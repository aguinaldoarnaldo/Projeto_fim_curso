from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from django.core.exceptions import ValidationError
import json

from apis.models import Matricula
from apis.serializers.matricula_serializers import MatriculaSerializer

from apis.permissions.custom_permissions import HasAdditionalPermission, IsActiveYearOrReadOnly

class MatriculaViewSet(viewsets.ModelViewSet):
    """ViewSet para Matricula"""
    queryset = Matricula.objects.select_related(
        'id_aluno', 
        'id_turma', 
        'id_turma__id_curso', 
        'id_turma__id_sala', 
        'id_turma__id_classe', 
        'id_turma__id_periodo'
    ).prefetch_related(
        'id_aluno__alunoencarregado_set',
        'id_aluno__alunoencarregado_set__id_encarregado'
    ).all()
    serializer_class = MatriculaSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission, IsActiveYearOrReadOnly]
    
    # Mapeamento de permissões por ação
    permission_map = {
        # 'list': 'view_matriculas',
        # 'retrieve': 'view_matriculas',
        'create': 'create_matricula',
        'update': 'edit_matricula',
        'partial_update': 'edit_matricula',
        'destroy': 'delete_matricula',
        'matricular_novo_aluno': 'create_matricula',
        'permutar': 'change_matricula',
    }

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['id_aluno__nome_completo', 'id_matricula']
    ordering_fields = ['data_matricula', 'id_aluno__nome_completo']
    ordering = ['-data_matricula']

    @action(detail=False, methods=['post'])
    def matricular_novo_aluno(self, request):
        """
        Matrícula direta para alunos novos (transferidos ou sem candidatura prévia).
        Recebe dados completos do aluno + turma + histórico escolar.
        """
        from apis.models import Aluno, Turma, Encarregado, AlunoEncarregado, Matricula, HistoricoEscolar, AnoLectivo, Candidato
        import json
        
        data = request.data
        
        # Validações Básicas
        required_fields = ['nome_completo', 'numero_bi', 'turma_id']
        for field in required_fields:
            if not data.get(field):
                return Response({'erro': f'Campo obrigatório ausente: {field}'}, status=400)

        turma_id = data.get('turma_id')
        try:
           turma = Turma.objects.get(pk=turma_id)
        except Turma.DoesNotExist:
            return Response({'erro': 'Turma não encontrada'}, status=404)
        
        # Verificar se a turma tem ano_lectivo ou buscar o ativo
        ano_lectivo = turma.ano_lectivo
        if not ano_lectivo:
            # Buscar ano letivo ativo
            ano_lectivo = AnoLectivo.objects.filter(status='Activo').first()
            if not ano_lectivo:
                return Response({'erro': 'Nenhum Ano Lectivo ativo encontrado. Configure um Ano Lectivo primeiro.'}, status=400)
        
        # Validation: prevent enrollment in closed year
        if ano_lectivo.status != 'Activo':
             return Response({'erro': f'O Ano Lectivo {ano_lectivo.nome} está encerrado. Não é possível realizar matrículas.'}, status=403)
            
        try:
            with transaction.atomic():
                # 1. Encarregado (se houver dados)
                encarregado = None
                nome_enc = data.get('nome_encarregado')
                tel_enc = data.get('telefone_encarregado')
                
                if nome_enc:
                    # Tentar encontrar por BI ou telefone
                    bi_enc = data.get('numero_bi_encarregado')
                    if bi_enc:
                        encarregado = Encarregado.objects.filter(numero_bi=bi_enc).first()
                    elif tel_enc:
                        encarregado = Encarregado.objects.filter(telefone__contains=tel_enc).first()
                    
                    if encarregado:
                        # Atualizar dados do encarregado existente
                        encarregado.nome_completo = nome_enc
                        if bi_enc: encarregado.numero_bi = bi_enc
                        if tel_enc and tel_enc not in encarregado.telefone:
                            encarregado.telefone.append(tel_enc)
                        encarregado.profissao = data.get('profissao_encarregado')
                        encarregado.save()
                    else:
                        encarregado = Encarregado.objects.create(
                            nome_completo=nome_enc,
                            numero_bi=bi_enc,
                            profissao=data.get('profissao_encarregado'),
                            telefone=[tel_enc] if tel_enc else [],
                            senha_hash='123456', 
                            is_online=False
                        )

                # 2. Aluno
                candidato_id = data.get('candidato_id')
                candidato = None
                if candidato_id:
                    candidato = Candidato.objects.filter(pk=candidato_id).first()

                id_aluno = data.get('id_aluno')
                aluno = None
                if id_aluno:
                    aluno = Aluno.objects.filter(id_aluno=id_aluno).first()
                
                if not aluno:
                    # Verificar se já existe por BI 
                    aluno_exists = Aluno.objects.filter(numero_bi=data.get('numero_bi')).first()
                    if aluno_exists:
                         # Se já existe, usar este aluno (mas avisar user seria ideal)
                         aluno = aluno_exists
                    else:
                        foto = request.FILES.get('novo_aluno_foto')
                        
                        aluno = Aluno.objects.create(
                            nome_completo=data.get('nome_completo'),
                            data_nascimento=data.get('data_nascimento'),
                            genero=data.get('genero'),
                            numero_bi=data.get('numero_bi'),
                            nacionalidade=data.get('nacionalidade', 'Angolana'),
                            naturalidade=data.get('naturalidade'),
                            deficiencia=data.get('deficiencia', 'Não'),
                            email=data.get('email'),
                            telefone=data.get('telefone', '000000000'),
                            provincia_residencia=data.get('provincia'),
                            municipio_residencia=data.get('municipio'),
                            bairro_residencia=data.get('bairro'),
                            numero_casa=data.get('numero_casa'),
                            senha_hash='123456',
                            status_aluno='Activo',
                            id_turma=turma,
                            img_path=foto if foto else None
                        )
    
                        # Se não veio foto nova, mas tem do candidato, vamos copiar FISICAMENTE
                        if not foto and candidato and candidato.foto_passe:
                            try:
                                from django.core.files.base import ContentFile
                                import os
                                content = candidato.foto_passe.read()
                                filename = os.path.basename(candidato.foto_passe.name)
                                aluno.img_path.save(filename, ContentFile(content), save=True)
                            except Exception as e:
                                print(f"Erro ao copiar foto do candidato: {e}")
                else:
                    # Atualizar dados do aluno existente
                    aluno.id_turma = turma
                    aluno.status_aluno = 'Activo'
                    
                    # Campos de Identidade
                    if data.get('nome_completo'): aluno.nome_completo = data.get('nome_completo')
                    if data.get('data_nascimento'): aluno.data_nascimento = data.get('data_nascimento')
                    if data.get('genero'): aluno.genero = data.get('genero')
                    if data.get('numero_bi'): aluno.numero_bi = data.get('numero_bi')

                    # Campos de Endereço/Contato
                    if data.get('nacionalidade'): aluno.nacionalidade = data.get('nacionalidade')
                    if data.get('naturalidade'): aluno.naturalidade = data.get('naturalidade')
                    if data.get('deficiencia'): aluno.deficiencia = data.get('deficiencia')
                    if data.get('email'): aluno.email = data.get('email')
                    if data.get('telefone'): aluno.telefone = data.get('telefone')
                    if data.get('provincia'): aluno.provincia_residencia = data.get('provincia')
                    if data.get('municipio'): aluno.municipio_residencia = data.get('municipio')
                    if data.get('bairro'): aluno.bairro_residencia = data.get('bairro')
                    if data.get('numero_casa'): aluno.numero_casa = data.get('numero_casa')
                    
                    # Foto
                    foto_nova = request.FILES.get('novo_aluno_foto')
                    if foto_nova:
                        aluno.img_path = foto_nova
                    elif candidato and candidato.foto_passe and not aluno.img_path:
                        try:
                            from django.core.files.base import ContentFile
                            import os
                            content = candidato.foto_passe.read()
                            filename = os.path.basename(candidato.foto_passe.name)
                            aluno.img_path.save(filename, ContentFile(content), save=False)
                        except Exception:
                            pass
                    aluno.save()

                # 3. Vínculo Encarregado
                if encarregado:
                    AlunoEncarregado.objects.update_or_create(
                        id_aluno=aluno,
                        id_encarregado=encarregado,
                        defaults={'grau_parentesco': data.get('parentesco_encarregado', 'Não Especificado')}
                    )
                    
                # 4. Matrícula
                db_bi = request.FILES.get('doc_bi')
                db_cert = request.FILES.get('doc_certificado')

                # Se não foram enviados agora, tentar herdar do candidato
                if candidato:
                    if not db_bi and candidato.comprovativo_bi:
                        db_bi = candidato.comprovativo_bi
                    if not db_cert and candidato.certificado:
                        db_cert = candidato.certificado

                matricula_id = data.get('matricula_id')
                if data.get('tipo') == 'Edicao' and matricula_id:
                    # UPDATE MODE
                    try:
                        matricula = Matricula.objects.get(pk=matricula_id)
                        matricula.id_aluno = aluno
                        matricula.id_turma = turma
                        matricula.ano_lectivo = ano_lectivo
                        if db_bi: matricula.doc_bi = db_bi
                        if db_cert: matricula.doc_certificado = db_cert
                        matricula.save()
                    except Matricula.DoesNotExist:
                        return Response({'erro': 'Matrícula não encontrada para edição.'}, status=404)
                else:
                    # CREATE MODE
                    Matricula.objects.create(
                         id_aluno=aluno,
                         id_turma=turma,
                         ano_lectivo=ano_lectivo,
                         ativo=True,
                         tipo=data.get('tipo', 'Novo'),
                         status='Ativa',
                         doc_bi=db_bi,
                         doc_certificado=db_cert
                    )
                
                # 4.1 Atualizar Status do Candidato
                if candidato:
                    candidato.status = 'Matriculado'
                    candidato.save()

                # 5. Histórico Escolar (se houver)
                historico_list = data.get('historico_escolar', [])
                
                if isinstance(historico_list, str):
                    try:
                        historico_list = json.loads(historico_list)
                    except json.JSONDecodeError:
                         historico_list = []

                if historico_list and isinstance(historico_list, list):
                    for item in historico_list:
                        ano_hist = item.get('ano', '')
                        
                        HistoricoEscolar.objects.create(
                            aluno=aluno,
                            escola_origem=item.get('escola'),
                            ano_lectivo=str(ano_hist), 
                            classe=item.get('classe'),
                            turma_origem=item.get('turma_antiga'),
                            numero_processo_origem=item.get('num_processo'),
                            media_final=item.get('media') if item.get('media') else None,
                            observacoes=item.get('obs')
                        )
                
                is_edit = data.get('tipo') == 'Edicao'
                return Response({
                    'mensagem': f'Dados de {aluno.nome_completo} atualizados com sucesso!' if is_edit else 'Aluno matriculado com sucesso!',
                    'aluno_id': aluno.id_aluno,
                    'matricula': aluno.numero_matricula
                }, status=200 if is_edit else 201)

        except ValidationError as e:
            return Response({'erro': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'erro': f'Erro ao processar matrícula: {str(e)}'}, status=500)

    @action(detail=False, methods=['get'])
    def sugerir_tipo(self, request):
        """
        Sugere o tipo de matrícula com base no histórico do aluno.
        Query Params: aluno_id
        """
        aluno_id = request.query_params.get('aluno_id')
        if not aluno_id:
            return Response({'erro': 'aluno_id é obrigatório'}, status=400)
            
        from apis.services.academic_service import AcademicService
        tipo = AcademicService.determinar_tipo_matricula(aluno_id)
        
        return Response({'tipo_sugerido': tipo})

    @action(detail=False, methods=['post'])
    def permutar(self, request):
        """
        Permuta (troca) de turmas entre dois alunos matriculados.
        Payload: { 'matricula_id_1': INT, 'matricula_id_2': INT }
        """
        id1 = request.data.get('matricula_id_1')
        id2 = request.data.get('matricula_id_2')

        if not id1 or not id2:
            return Response({'erro': 'IDs das matriculas (matricula_id_1, matricula_id_2) são obrigatórios.'}, status=400)
        
        if id1 == id2:
            return Response({'erro': 'Não é possível permutar a mesma matrícula.'}, status=400)

        from apis.models import Matricula

        try:
            with transaction.atomic():
                try:
                    mat1 = Matricula.objects.select_related('id_turma', 'id_aluno').get(pk=id1)
                except Matricula.DoesNotExist:
                     return Response({'erro': f'Matrícula {id1} não encontrada.'}, status=404)

                try:
                    mat2 = Matricula.objects.select_related('id_turma', 'id_aluno').get(pk=id2)
                except Matricula.DoesNotExist:
                     return Response({'erro': f'Matrícula {id2} não encontrada.'}, status=404)
                
                # Validar se o Ano Lectivo está ativo
                if (mat1.ano_lectivo and mat1.ano_lectivo.status != 'Activo') or (mat2.ano_lectivo and mat2.ano_lectivo.status != 'Activo'):
                     return Response({'erro': 'Não é possível permutar matrículas de um Ano Lectivo encerrado.'}, status=403)
                
                # Armazenar turmas para a troca
                turma1 = mat1.id_turma
                turma2 = mat2.id_turma
                
                # Validar se ambas têm turma (para evitar erros se uma for pendente sem turma - regra de negócio opcional)
                if not turma1 or not turma2:
                     return Response({'erro': 'Ambas as matrículas devem ter turmas atribuídas para permutar.'}, status=400)

                if turma1 == turma2:
                    return Response({'erro': 'Os alunos já estão na mesma turma. Permuta desnecessária.'}, status=400)

                # Realizar a troca na Matrícula
                mat1.id_turma = turma2
                mat2.id_turma = turma1
                
                mat1.save()
                mat2.save()
                
                # Atualizar também o registo do Aluno (pois Aluno tem id_turma redundancy)
                aluno1 = mat1.id_aluno
                aluno2 = mat2.id_aluno
                
                aluno1.id_turma = turma2
                aluno2.id_turma = turma1
                aluno1.save()
                aluno2.save()
                
                # Log (Print for now, could be AuditModel)
                print(f"Permuta efetuada: {aluno1.nome_completo} (agora na {turma2}) <-> {aluno2.nome_completo} (agora na {turma1})")

                return Response({
                    'mensagem': 'Permuta realizada com sucesso!',
                    'troca': f"{aluno1.nome_completo} trocou com {aluno2.nome_completo}"
                })

        except Exception as e:
            return Response({'erro': f'Erro ao realizar permuta: {str(e)}'}, status=500)

    @action(detail=True, methods=['get'])
    def download_ficha(self, request, pk=None):
        """
        Gera e retorna a Ficha de Matrícula em PDF.
        """
        from django.http import HttpResponse
        from apis.services.pdf_service import PDFService
        from django.utils import timezone
        
        matricula = self.get_object()
        aluno = matricula.id_aluno
        turma = matricula.id_turma
        
        # Obter encarregados
        encarregados = aluno.alunoencarregado_set.select_related('id_encarregado').all()
        
        context = {
            'matricula': matricula,
            'aluno': aluno,
            'turma': turma,
            'encarregados': encarregados,
            'hoje': timezone.now(),
            'site_url': request.build_absolute_uri('/')[:-1]
        }
        
        pdf = PDFService.render_to_pdf('pdf/ficha_matricula.html', context)
        
        if pdf:
            response = HttpResponse(pdf, content_type='application/pdf')
            filename = f"Ficha_Matricula_{aluno.numero_matricula}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        return Response({'erro': 'Erro ao gerar PDF'}, status=500)
