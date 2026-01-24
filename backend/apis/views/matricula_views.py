from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction

from apis.models import Matricula
from apis.serializers.matricula_serializers import MatriculaSerializer

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
    permission_classes = [AllowAny] # For dev ease, typically IsAuthenticated
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['id_aluno__nome_completo', 'id_matricula']
    ordering_fields = ['data_matricula', 'id_aluno__nome_completo']
    ordering = ['-data_matricula']

    @action(detail=False, methods=['post'], permission_classes=[AllowAny]) # Changed to AllowAny for easier testing if needed
    def matricular_novo_aluno(self, request):
        """
        Matrícula direta para alunos novos (transferidos ou sem candidatura prévia).
        Recebe dados completos do aluno + turma + histórico escolar.
        """
        from apis.models import Aluno, Turma, Encarregado, AlunoEncarregado, Matricula, HistoricoEscolar
        
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
            
        try:
            with transaction.atomic():
                # 1. Encarregado (se houver dados)
                encarregado = None
                nome_enc = data.get('nome_encarregado')
                tel_enc = data.get('telefone_encarregado')
                
                if nome_enc:
                    # Tentar encontrar por telefone
                    if tel_enc:
                        encarregado = Encarregado.objects.filter(telefone__contains=tel_enc).first()
                    
                    if not encarregado:
                        encarregado = Encarregado.objects.create(
                            nome_completo=nome_enc,
                            telefone=tel_enc,
                            senha_hash='123456', # Senha padrão
                            is_online=False
                        )

                # 2. Aluno
                # Verificar se já existe por BI ou Email
                aluno = Aluno.objects.filter(numero_bi=data.get('numero_bi')).first()
                if aluno:
                    return Response({'erro': 'Já existe um aluno com este Número de BI.'}, status=400)
                
                import datetime
                year = datetime.datetime.now().year
                last = Aluno.objects.order_by('-numero_matricula').first()
                new_num = (last.numero_matricula + 1) if last and last.numero_matricula else int(f"{year}0001")
                
                aluno = Aluno.objects.create(
                    nome_completo=data.get('nome_completo'),
                    data_nascimento=data.get('data_nascimento'), # YYYY-MM-DD
                    genero=data.get('genero'), # M/F
                    numero_bi=data.get('numero_bi'),
                    nacionalidade=data.get('nacionalidade', 'Angolana'),
                    email=data.get('email'),
                    telefone=data.get('telefone', '000000000'),
                    # Endereço
                    provincia_residencia=data.get('provincia'),
                    municipio_residencia=data.get('municipio'),
                    bairro_residencia=data.get('bairro'),
                    
                    numero_matricula=new_num,
                    senha_hash='123456',
                    status_aluno='Activo',
                    id_turma=turma
                )
                
                # 3. Vínculo Encarregado
                if encarregado:
                    AlunoEncarregado.objects.create(
                        id_aluno=aluno,
                        id_encarregado=encarregado,
                        grau_parentesco=data.get('parentesco_encarregado')
                    )
                    
                # 4. Matrícula
                Matricula.objects.create(
                     id_aluno=aluno,
                     id_turma=turma,
                     ativo=True,
                     # ano_lectivo = turma.ano_lectivo (se necessário explicitar)
                )

                # 5. Histórico Escolar (se houver)
                historico_list = data.get('historico_escolar', [])
                if historico_list and isinstance(historico_list, list):
                    for item in historico_list:
                        HistoricoEscolar.objects.create(
                            aluno=aluno,
                            escola_origem=item.get('escola'),
                            ano_lectivo=item.get('ano'),
                            classe=item.get('classe'),
                            turma_origem=item.get('turma_antiga'),
                            numero_processo_origem=item.get('num_processo'),
                            media_final=item.get('media') if item.get('media') else None,
                            observacoes=item.get('obs')
                        )
                
                return Response({
                    'mensagem': 'Aluno matriculado com sucesso!',
                    'aluno_id': aluno.id_aluno,
                    'matricula': aluno.numero_matricula
                }, status=201)

        except Exception as e:
            # import traceback
            # traceback.print_exc()
            return Response({'erro': f'Erro ao processar matrícula: {str(e)}'}, status=500)
