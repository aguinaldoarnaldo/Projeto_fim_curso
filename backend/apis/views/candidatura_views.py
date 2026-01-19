from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apis.models import Candidato, RupeCandidato, Curso, ExameAdmissao, Sala
from apis.serializers import CandidatoSerializer, CandidatoCreateSerializer, RupeCandidatoSerializer
from decimal import Decimal

class CandidaturaViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar candidaturas"""
    queryset = Candidato.objects.all()
    serializer_class = CandidatoSerializer
    
    def list(self, request, *args, **kwargs):
        print(f"Listando candidatos. User: {request.user}, Auth: {request.auth}")
        queryset = self.filter_queryset(self.get_queryset())
        print(f"Total encontrados: {queryset.count()}")
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

    def get_permissions(self):
        """Permite criacao anonima de candidaturas"""
        if self.action in ['create', 'gerar_rupe', 'consultar_status', 'list', 'avaliar', 'matricular']:
            return [AllowAny()]
        return [IsAuthenticated()] # Admin see list

    def create(self, request, *args, **kwargs):
        print("Recebendo dados de candidatura:", request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Erros de validacao:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def gerar_rupe(self, request, pk=None):
        """Gera RUPE para o candidato"""
        candidato = self.get_object()
        
        # Logica de Cobranca: 1 RUPE por curso
        qtd_cursos = 1
        if candidato.curso_segunda_opcao:
            qtd_cursos = 2
        
        valor_unitario = Decimal('2000.00') # Exemplo 2000 Kz
        total = valor_unitario * qtd_cursos
        
        # Check if already exists
        import datetime
        rupe = RupeCandidato.objects.filter(candidato=candidato).first()
        if not rupe:
            # Generate a numeric reference (simulation)
            import random
            ano = datetime.datetime.now().year
            ref_num = f"{ano}.{random.randint(10000000, 99999999)}"
            
            rupe = RupeCandidato.objects.create(
                candidato=candidato,
                valor=total,
                status='Pendente',
                referencia=ref_num
            )
        
        return Response({
            'mensagem': 'RUPE gerado com sucesso',
            'referencia': rupe.referencia,
            'valor': rupe.valor,
            'status': rupe.status
        })

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def simular_pagamento(self, request, pk=None):
        """Simula o pagamento do RUPE e agenda exame"""
        candidato = self.get_object()
        rupe = RupeCandidato.objects.filter(candidato=candidato).last()
        
        if not rupe:
            return Response({'erro': 'Nenhum RUPE encontrado para este candidato.'}, status=400)
            
        # 1. Update RUPE
        import datetime
        rupe.status = 'Pago'
        rupe.data_pagamento = datetime.datetime.now()
        rupe.save()
        
        # 2. Update Candidato Status
        candidato.status = 'Pago'
        candidato.save()
        
        # 3. Schedule Exam (Demo Logic: Assign a random room and date)
        sala = Sala.objects.first() # Assign first available room or mock
        data_exame = datetime.datetime.now() + datetime.timedelta(days=7) # 7 days from now
        
        ExameAdmissao.objects.update_or_create(
            candidato=candidato,
            defaults={
                'data_exame': data_exame,
                'sala': sala,
                'realizado': False
            }
        )
        
        candidato.status = 'Agendado'
        candidato.save()
        
        return Response({
            'mensagem': 'Pagamento confirmado e exame agendado!',
            'exame': {
                'data': data_exame,
                'sala': sala.nome_sala if sala else 'Sala 1 - Bloco A'
            }
        })

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def consultar_status(self, request):
        """Consulta status pelo numero de inscricao ou BI"""
        term = request.query_params.get('q')
        if not term:
            return Response({'erro': 'Informe o parâmetro q (BI ou Nº Inscrição)'}, status=400)
            
        candidato = Candidato.objects.filter(numero_inscricao=term).first() or \
                    Candidato.objects.filter(numero_bi=term).first()
                    
        if not candidato:
            return Response({'erro': 'Candidato não encontrado'}, status=404)
            
        serializer = CandidatoSerializer(candidato)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def avaliar(self, request, pk=None):
        """Avalia o exame do candidato"""
        candidato = self.get_object()
        nota = request.data.get('nota')
        
        if nota is None:
            return Response({'erro': 'Informe a nota'}, status=400)
            
        try:
            nota = Decimal(str(nota))
        except:
             return Response({'erro': 'Nota invalida'}, status=400)
             
        # Update Exam
        exame, _ = ExameAdmissao.objects.get_or_create(candidato=candidato, defaults={'data_exame': '2026-01-25'})
        exame.nota = nota
        exame.realizado = True
        exame.save()
        
        # Update Status
        aprovado = nota >= 10
        candidato.status = 'Aprovado' if aprovado else 'Reprovado' # Or 'Nao Admitido'
        candidato.save()
        
        return Response({
            'status': candidato.status,
            'nota': exame.nota
        })

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
                # Opção simplificada: Cria encarregado baseado no nome se não existir
                # Idealmente o sistema verificaria email/telefone único
                encarregado, created = Encarregado.objects.get_or_create(
                    nome_completo=candidato.nome_encarregado,
                    defaults={
                        'telefone': [candidato.telefone_encarregado],
                        'senha_hash': '123456', # Senha padrão
                        'is_online': False
                    }
                )
                
                # 2. Criar Aluno
                import datetime
                year = datetime.datetime.now().year
                # Gerar numero de matricula simples (ex: 20240001)
                last = Aluno.objects.order_by('-numero_matricula').first()
                new_num = (last.numero_matricula + 1) if last and last.numero_matricula else int(f"{year}0001")
                
                aluno = Aluno.objects.create(
                    nome_completo=candidato.nome_completo,
                    genero=candidato.genero,
                    numero_bi=candidato.numero_bi,
                    email=candidato.email,
                    telefone=candidato.telefone,
                    provincia_residencia='Huíla', # Default ou do form
                    municipio_residencia=candidato.residencia, # Adaptando
                    numero_matricula=new_num,
                    senha_hash='123456', # Senha padrao
                    status_aluno='Activo',
                    id_turma=turma,
                    img_path=candidato.foto_passe
                )
                
                # 3. Vincular Encarregado
                AlunoEncarregado.objects.create(
                    id_aluno=aluno,
                    id_encarregado=encarregado,
                    grau_parentesco=candidato.parentesco_encarregado
                )
                
                # 4. Criar Matricula
                matricula = Matricula.objects.create(
                    id_aluno=aluno,
                    id_turma=turma,
                    ativo=True
                )
                
                # 5. Update Candidato
                candidato.status = 'Matriculado'
                candidato.save()
                
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
            return Response({'erro': f'Erro ao matricular: {str(e)}'}, status=500)
