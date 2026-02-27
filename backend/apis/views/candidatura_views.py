import datetime
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.cache import cache
from apis.models import Candidato, RupeCandidato, Curso, ExameAdmissao, Sala
from apis.serializers import CandidatoSerializer, CandidatoCreateSerializer, RupeCandidatoSerializer
from decimal import Decimal
from apis.permissions.custom_permissions import HasAdditionalPermission
from apis.mixins import AuditMixin
from apis.permissions.authentication import SchoolJWTAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from apis.services.pdf_service import PDFService

class CandidaturaViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para gerenciar candidaturas"""
    queryset = Candidato.objects.all()
    serializer_class = CandidatoSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]

    # Mapeamento de permissões por ação
    # Mapeamento de permissões por ação
    permission_map = {
        # 'list': 'view_inscritos',
        # 'retrieve': 'view_inscritos',
        'distribuir_exames': 'manage_inscritos',
        'lista_chamada': 'manage_inscritos', # Aligned with frontend button permission
        'avaliar': 'manage_inscritos',
        'matricular': 'matricular_aluno',
        'destroy': 'manage_inscritos',
    }
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CandidatoCreateSerializer
        return CandidatoSerializer

    authentication_classes = [SchoolJWTAuthentication, JWTAuthentication]

    def get_permissions(self):
        """Permite criacao anonima de candidaturas para ações publicas"""
        if self.action in ['create', 'gerar_rupe', 'consultar_status', 'simular_pagamento', 'download_comprovativo']:
            return [AllowAny()]
        return [IsAuthenticated(), HasAdditionalPermission()]

    def create(self, request, *args, **kwargs):
        # 0. Check Global Config and Academic Year Schedule
        from apis.models import Configuracao, AnoLectivo
        config = Configuracao.get_solo()
        
        # Primeiro verificar se o portal está aberto manualmente
        if not config.candidaturas_abertas:
            return Response(
                {
                    'erro': 'As candidaturas estão encerradas.', 
                    'detalhe': config.mensagem_candidaturas_fechadas
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Segundo verificar o cronograma do ano lectivo activo
        active_year = AnoLectivo.get_active_year()
        if active_year and not active_year.is_inscricoes_abertas:
            return Response(
                {
                    'erro': 'Período de inscrições encerrado.', 
                    'detalhe': f'O período de inscrições para o ano {active_year.nome} foi concluído.'
                }, 
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'erro_interno': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny], authentication_classes=[])
    def download_comprovativo(self, request, pk=None):
        """Disponibiliza download do comprovativo de Inscrição"""
        
        candidato = self.get_object()
        exame = ExameAdmissao.objects.filter(candidato=candidato).first()
        rupe = RupeCandidato.objects.filter(inscricao=candidato).first()
        
        context = {
            'candidato': candidato,
            'exame': exame,
            'rupe': rupe,
            'hoje': timezone.now(),
            'site_url': request.build_absolute_uri('/')[:-1]
        }
        
        if not candidato:
             return Response({'erro': 'Candidato não encontrado'}, status=404)

        try:
            pdf = PDFService.render_to_pdf('pdf/comprovativo_inscricao.html', context)
        except Exception as e:
            print(f"Erro ao renderizar PDF: {e}")
            return Response({'erro': f'Erro na geração do PDF: {str(e)}'}, status=500)
        
        if pdf:
            response = HttpResponse(pdf, content_type='application/pdf')
            filename = f"Comprovativo_{candidato.numero_inscricao}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        return Response({'erro': 'Erro ao gerar PDF'}, status=500)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def gerar_rupe(self, request, pk=None):
        """Gera RUPE para o candidato (limite de 2 referências)"""
        candidato = self.get_object()
        
        # Logica de Cobranca: 1 RUPE por curso
        qtd_cursos = 1
        if candidato.curso_segunda_opcao:
            qtd_cursos = 2
        
        valor_unitario = Decimal('2000.00') # Exemplo 2000 Kz
        total = valor_unitario * qtd_cursos
        
        # Histórico de RUPEs deste candidato
        rupes_existentes = RupeCandidato.objects.filter(inscricao=candidato).order_by('-criado_em')
        rupe_ativo = None
        
        # Verificar se existe algum RUPE pago ou pendente válido
        for r in rupes_existentes:
            if r.status_rup == 'PAGO':
                return Response({'erro': 'Já existe um pagamento confirmado para esta candidatura.'}, status=400)
            if not r.is_expired:
                rupe_ativo = r
                break
        
        if rupe_ativo:
            return Response({
                'mensagem': 'RUPE atual ainda é válido.',
                'codigo_rup': rupe_ativo.codigo_rup,
                'valor': rupe_ativo.valor,
                'status_rup': rupe_ativo.status_rup,
                'expira_em': rupe_ativo.data_expiracao or (rupe_ativo.criado_em + datetime.timedelta(hours=48))
            })

        # Se não há RUPE ativo, verificar o limite de 2
        if rupes_existentes.count() >= 2:
            return Response({
                'erro': 'Limite de referências RUPE atingido (máximo 2).',
                'detalhe': 'As suas referências anteriores expiraram. Por favor, contacte a administração.'
            }, status=403)
        
        # Gerar nova referência (Simulação)
        import random
        import datetime
        from django.utils import timezone
        ano = datetime.datetime.now().year
        ref_num = f"{ano}.{random.randint(10000000, 99999999)}"
        data_exp = timezone.now() + datetime.timedelta(hours=48)
        
        rupe = RupeCandidato.objects.create(
            inscricao=candidato,
            valor=total,
            status_rup='PENDENTE',
            codigo_rup=ref_num,
            data_geracao=timezone.now(),
            data_expiracao=data_exp
        )
        
        return Response({
            'mensagem': 'Nova referência RUPE gerada com sucesso.',
            'codigo_rup': rupe.codigo_rup,
            'valor': rupe.valor,
            'status_rup': rupe.status_rup,
            'expira_em': rupe.data_expiracao
        })

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def simular_pagamento(self, request, pk=None):
        """Simula o pagamento do RUPE e agenda exame (apenas para testes/demo)"""
        return self._processar_pagamento()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirmar_pagamento(self, request, pk=None):
        """Confirma o pagamento real do RUPE e agenda exame (Apenas Admin/Financeiro)"""
        # Aqui poderia ter validação adicional de permissão
        return self._processar_pagamento()

    def _processar_pagamento(self):
        """Lógica comum de processamento de pagamento"""
        candidato = self.get_object()
        rupe = RupeCandidato.objects.filter(inscricao=candidato).last()
        
        if not rupe:
            return Response({'erro': 'Nenhum RUPE encontrado para este candidato.'}, status=400)
            
        # 1. Update RUPE
        rupe.status_rup = 'PAGO'
        rupe.data_pagamento = timezone.now()
        rupe.save()
        
        # 2. Update Candidato Status
        candidato.status = 'INSCRITO'
        candidato.save()
        
        # 3. Schedule Exam (Lógica Simples: Atribui primeira sala e data +7 dias)
        # Numa versão real, isso poderia ser manual ou usar a distribuição automatica depois
        sala = Sala.objects.first() 
        data_exame = datetime.datetime.now() + datetime.timedelta(days=7)
        
        ExameAdmissao.objects.update_or_create(
            candidato=candidato,
            defaults={
                'data_exame': data_exame,
                'sala': sala,
                'realizado': False
            }
        )
        
        candidato.status = 'INSCRITO'
        candidato.save()
        
        return Response({
            'mensagem': 'Pagamento confirmado com sucesso! Candidato pronto para exame.',
            'status': candidato.status
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def distribuir_exames(self, request):
        """
        Distribui candidatos com status 'Pago' por salas disponíveis.
        Parâmetros: { data_inicio: str, hora_inicio: str, limite_candidatos: int }
        """
        import datetime
        from apis.models import Sala, ExameAdmissao
        
        data_inicio_str = request.data.get('data_inicio')
        hora_inicio_str = request.data.get('hora_inicio', '08:00')
        limite_candidatos = request.data.get('limite_candidatos')
        candidatos_por_sala_custom = request.data.get('candidatos_por_sala')
        
        if not data_inicio_str:
            return Response({'erro': 'Informe a data de início (data_inicio)'}, status=400)
            
        # 1. Obter Candidatos Pagos que não possuem exame agendado em anos ativos
        candidatos_qs = Candidato.objects.filter(status='Pago', ano_lectivo__status='Activo').order_by('id_candidato')
        
        # Se houver um limite definido pelo usuário
        if limite_candidatos:
            try:
                candidatos_qs = candidatos_qs[:int(limite_candidatos)]
            except: pass

        candidatos = list(candidatos_qs)
        
        if not candidatos:
            return Response({'mensagem': 'Nenhum candidato pago aguardando agendamento.'}, status=200)
            
        # 2. Obter Salas
        salas = Sala.objects.all().order_by('numero_sala')
        if not salas.exists():
            return Response({'erro': 'Nenhuma sala cadastrada no sistema.'}, status=400)
            
        # 3. Lógica de Distribuição
        try:
            data_atual = datetime.datetime.strptime(f"{data_inicio_str} {hora_inicio_str}", "%Y-%m-%d %H:%M")
        except ValueError:
            return Response({'erro': 'Formato de data/hora inválido. Use YYYY-MM-DD e HH:MM'}, status=400)
            
        distribuidos = 0
        idx = 0
        total = len(candidatos)
        
        while idx < total:
            # Respeitar janelas de horário: 08-12 e 13-16
            current_hour = data_atual.hour
            
            # Se cair no intervalo de almoço (12:xx), salta para as 13h
            if current_hour >= 12 and current_hour < 13:
                data_atual = data_atual.replace(hour=13, minute=0)
            
            # Se passar das 16:xx, salta para as 08h do dia seguinte
            if current_hour >= 16:
                data_atual = data_atual.replace(hour=8, minute=0) + datetime.timedelta(days=1)

            # Preencher cada sala no horário atual
            for sala in salas:
                if idx >= total:
                    break
                    
                capacidade = int(candidatos_por_sala_custom) if candidatos_por_sala_custom else sala.capacidade_alunos
                bloco = candidatos[idx : idx + capacidade]
                
                for cand in bloco:
                    ExameAdmissao.objects.update_or_create(
                        candidato=cand,
                        defaults={
                            'data_exame': data_atual,
                            'sala': sala,
                            'realizado': False
                        }
                    )
                    cand.status = 'INSCRITO'
                    cand.save()
                    distribuidos += 1
                
                idx += len(bloco)
            
            # Próximo turno (vamos assumir turnos de 2 horas para preencher o tempo)
            data_atual += datetime.timedelta(hours=2)
        
        return Response({
            'mensagem': f'Distribuição concluída com sucesso! {distribuidos} candidatos foram agendados respeitando as salas e janelas de horário.',
            'total': distribuidos
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def lista_chamada(self, request):
        """
        Retorna a lista de candidatos organizada por Data e Sala para impressão.
        """
        from apis.models import ExameAdmissao
        exames = ExameAdmissao.objects.select_related('candidato', 'sala', 'candidato__curso_primeira_opcao').filter(
            candidato__status='INSCRITO',
            realizado=False
        ).order_by('data_exame', 'sala__numero_sala', 'candidato__nome_completo')
        
        # Organizar por Data e Sala
        pautas = {}
        for ex in exames:
            data_key = ex.data_exame.strftime("%d/%m/%Y %H:%M")
            sala_key = f"Sala {ex.sala.numero_sala if ex.sala else '?'}"
            
            if data_key not in pautas:
                pautas[data_key] = {}
            if sala_key not in pautas[data_key]:
                pautas[data_key][sala_key] = []
                
            pautas[data_key][sala_key].append({
                'numero_inscricao': ex.candidato.numero_inscricao,
                'nome': ex.candidato.nome_completo,
                'bi': ex.candidato.numero_bi,
                'curso': ex.candidato.curso_primeira_opcao.nome_curso if ex.candidato.curso_primeira_opcao else 'N/A'
            })
            
        return Response(pautas)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def consultar_status(self, request):
        """Consulta status pelo numero de inscricao ou BI com cache e throttling"""
        self.throttle_scope = 'candidate_check'
        term = request.query_params.get('q')
        if not term:
            return Response({'erro': 'Informe o parâmetro q (BI ou Nº Inscrição)'}, status=400)
            
        # Tentar recuperar do cache (10 minutos)
        cache_key = f'candidato_status_{term}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        candidato = Candidato.objects.filter(numero_inscricao=term).first() or \
                    Candidato.objects.filter(numero_bi=term).first()
                    
        if not candidato:
            return Response({'erro': 'Candidato não encontrado'}, status=404)
            
        serializer = CandidatoSerializer(candidato)
        data = serializer.data
        
        # Salvar no cache
        cache.set(cache_key, data, 600)
        
        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def avaliar(self, request, pk=None):
        """Avalia o exame do candidato"""
        try:
            candidato = self.get_object()
            nota = request.data.get('nota')
            
            if nota is None:
                return Response({'erro': 'Informe a nota'}, status=400)
                
            try:
                nota = Decimal(str(nota))
            except:
                 return Response({'erro': 'Nota invalida'}, status=400)
                 
            # Update Exam
            from apis.models import ExameAdmissao
            exame, _ = ExameAdmissao.objects.get_or_create(candidato=candidato, defaults={'data_exame': '2026-01-25'})
            exame.nota = nota
            exame.realizado = True
            exame.save()
            
            # Update Status
            aprovado = nota >= 10
            candidato.status = 'CLASSIFICADO' if aprovado else 'NAO_CLASSIFICADO'
            candidato.save()

            self._log_audit_action('update', candidato)
            
            return Response({
                'status': candidato.status,
                'nota': exame.nota
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'erro': f'Erro ao avaliar: {str(e)}'}, status=500)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def matricular(self, request, pk=None):
        """
        Converte Candidato Aprovado em Aluno e cria Matrícula.
        Dados esperados: { id_turma: int }
        """
        from apis.models import Aluno, Matricula, Turma, Encarregado, AlunoEncarregado
        from django.db import transaction
        
        candidato = self.get_object()
        id_turma = request.data.get('id_turma')
        
        if not id_turma:
            return Response({'erro': 'Informe a turma (id_turma)'}, status=400)
            
        if candidato.status != 'Aprovado':
             return Response({'erro': f'Candidato não está Aprovado (Status: {candidato.status})'}, status=400)

        try:
            with transaction.atomic():
                turma = Turma.objects.get(pk=id_turma)
                
                # 1. Criar/Recuperar Encarregado
                # Tenta buscar por telefone primeiro (mais unico que nome)
                encarregado = Encarregado.objects.filter(telefone__contains=candidato.telefone_encarregado).first()
                if not encarregado:
                    encarregado = Encarregado.objects.create(
                        nome_completo=candidato.nome_encarregado,
                        telefone=candidato.telefone_encarregado,
                        senha_hash='123456', 
                        is_online=False
                    )
                
                # 2. Criar ou Recuperar Aluno
                aluno = Aluno.objects.filter(numero_bi=candidato.numero_bi).first()
                if not aluno and candidato.email:
                     aluno = Aluno.objects.filter(email=candidato.email).first()

                if not aluno:
                    import datetime
                    year = datetime.datetime.now().year
                    last = Aluno.objects.order_by('-numero_matricula').first()
                    new_num = (last.numero_matricula + 1) if last and last.numero_matricula else int(f"{year}0001")
                    
                    aluno = Aluno.objects.create(
                        nome_completo=candidato.nome_completo,
                        data_nascimento=candidato.data_nascimento,
                        genero=candidato.genero,
                        numero_bi=candidato.numero_bi,
                        email=candidato.email,
                        telefone=candidato.telefone,
                        provincia_residencia=candidato.provincia or 'Huíla', 
                        municipio_residencia=candidato.municipio or candidato.residencia,
                        numero_matricula=new_num,
                        senha_hash='123456',
                        status_aluno='Activo',
                        id_turma=turma,
                        img_path=candidato.foto_passe
                    )
                else:
                    # Atualizar dados do aluno existente
                    aluno.id_turma = turma
                    aluno.status_aluno = 'Activo'
                    # Se nao tiver dados que talvez tenham vindo agora
                    if not aluno.data_nascimento and candidato.data_nascimento:
                        aluno.data_nascimento = candidato.data_nascimento
                    aluno.save()
                
                # 3. Vincular Encarregado (se nao existir vinculo)
                if not AlunoEncarregado.objects.filter(id_aluno=aluno, id_encarregado=encarregado).exists():
                    AlunoEncarregado.objects.create(
                        id_aluno=aluno,
                        id_encarregado=encarregado,
                        grau_parentesco=candidato.parentesco_encarregado
                    )
                
                # 4. Criar Matricula (se nao existir ativa)
                if not Matricula.objects.filter(id_aluno=aluno, id_turma=turma, ativo=True).exists():
                    matricula = Matricula.objects.create(
                        id_aluno=aluno,
                        id_turma=turma,
                        ativo=True
                    )
                
                # 5. Update Candidato
                candidato.status = 'MATRICULADO'
                candidato.save()
                
                self._log_audit_action('update', candidato)
                self._log_audit_action('create', matricula) if 'matricula' in locals() else None
                
                return Response({
                    'mensagem': 'Matrícula realizada com sucesso!',
                    'aluno': {
                        'id': aluno.id_aluno,
                        'nome': aluno.nome_completo,
                        'matricula': aluno.numero_matricula
                    },
                    'turma': turma.codigo_turma
                }, status=201)
                
        except Turma.DoesNotExist:
            return Response({'erro': 'Turma não encontrada'}, status=404)
        except Exception as e:
            # logger.error(f"Erro na matricula: {e}")
            return Response({'erro': f'Erro ao matricular: {str(e)}'}, status=500)

from apis.serializers import ListaEsperaSerializer
from apis.models import ListaEspera

class ListaEsperaViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para Lista de Espera"""
    queryset = ListaEspera.objects.select_related('candidato', 'candidato__curso_primeira_opcao').all()
    serializer_class = ListaEsperaSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def chamar_candidato(self, request, pk=None):
        """Altera status para Chamado e notifica (simulado)"""
        espera = self.get_object()
        if espera.status == 'Chamado':
             return Response({'mensagem': 'Candidato já foi chamado.'}, status=200)

        espera.status = 'Chamado'
        espera.save()
        
        # Simula envio de email/SMS
        msg = f"Olá {espera.candidato.nome_completo}, surgiu uma vaga! Compareça à secretaria."
        
        return Response({
            'mensagem': 'Candidato chamado com sucesso!',
            'notificacao': msg,
            'status': espera.status
        })

    @action(detail=False, methods=['post'])
    def adicionar_candidato_reprovado(self, request):
        """Adiciona um candidato (provavelmente Reprovado ou Pendente) à lista de espera"""
        id_candidato = request.data.get('id_candidato')
        if not id_candidato:
            return Response({'erro': 'Informe o id_candidato'}, status=400)
            
        try:
             candidato = Candidato.objects.get(pk=id_candidato)
        except Candidato.DoesNotExist:
             return Response({'erro': 'Candidato não encontrado'}, status=404)

        # Check if already in list
        if ListaEspera.objects.filter(candidato=candidato).exists():
             return Response({'erro': 'Candidato já está na lista de espera'}, status=400)

        item = ListaEspera.objects.create(
            candidato=candidato,
            prioridade=request.data.get('prioridade', 0),
            observacao=request.data.get('observacao', '')
        )
        
        serializer = self.get_serializer(item)
        return Response(serializer.data, status=201)
