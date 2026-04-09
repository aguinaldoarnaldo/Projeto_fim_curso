from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apis.permissions.custom_permissions import HasAdditionalPermission, IsActiveYearOrReadOnly

from apis.models import Aluno, AlunoEncarregado
from apis.serializers import (
    AlunoSerializer, AlunoListSerializer, AlunoDetailSerializer,
    AlunoEncarregadoSerializer
)
from apis.mixins import AuditMixin


from rest_framework.pagination import PageNumberPagination

class LargeResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 5000

class AlunoViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para Aluno"""
    pagination_class = LargeResultsSetPagination
    queryset = Aluno.objects.select_related(
        'id_turma',
        'id_turma__id_curso',
        'id_turma__id_classe',
        'id_turma__id_periodo',
        'id_turma__id_sala',
        'id_turma__ano_lectivo'
    ).prefetch_related(
        'alunoencarregado_set__id_encarregado',
        'matricula_set__ano_lectivo',
        'matricula_set__id_turma__id_curso',
        'matricula_set__id_turma__id_classe',
        'matricula_set__id_turma__id_periodo',
        'matricula_set__id_turma__id_sala',
        'historico_escolar'
    ).all()
    
    permission_classes = [IsAuthenticated, HasAdditionalPermission, IsActiveYearOrReadOnly]
    
    # Mapeamento de permissões por ação
    permission_map = {
        # 'list': 'view_alunos',     # Liberado para autenticados
        # 'retrieve': 'view_alunos', # Liberado para autenticados
        'create': 'create_aluno',
        'update': 'edit_aluno',
        'partial_update': 'edit_aluno',
        'destroy': 'delete_aluno',
        'update_status': 'edit_aluno',
        'ativos': 'view_alunos',
        'stats': 'view_dashboard',
        'notas': 'view_notas',
        'faltas': 'view_faltas',
        'boletim': 'view_notas',
        'encarregados': 'view_alunos',
    }

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, HasAdditionalPermission])
    def update_status(self, request, pk=None):
        """
        Actualiza apenas o status_aluno, contornando as validações do modelo
        que bloqueiam edições em estados finais ou anos lectivos encerrados.
        Esta operação é sempre administrativa e deve ser permitida.
        """
        VALID_STATUSES = {'Ativo', 'Inativo', 'Transferido', 'Concluido'}
        new_status = request.data.get('status_aluno')

        if not new_status:
            return Response(
                {'error': 'O campo status_aluno é obrigatório.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status not in VALID_STATUSES:
            return Response(
                {'error': f'Status inválido. Valores permitidos: {", ".join(VALID_STATUSES)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # update() directo na BD sem chamar o save() do modelo (contorna os bloqueios)
        updated = Aluno.objects.filter(pk=pk).update(status_aluno=new_status)

        if updated == 0:
            return Response(
                {'error': 'Aluno não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        aluno = Aluno.objects.get(pk=pk)
        serializer = AlunoListSerializer(aluno, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, HasAdditionalPermission])
    def update_dados_pessoais(self, request, pk=None):
        """
        Actualiza apenas os dados pessoais do aluno, contornando a validação do modelo
        que bloqueia edições quando o aluno está em estado final (Concluido, Transferido, Inativo).
        Permite editar: nome, género, data nascimento, BI, email, telefone, endereço, etc.
        """
        CAMPOS_PERMITIDOS = {
            'nome_completo', 'genero', 'data_nascimento', 'numero_bi',
            'nacionalidade', 'naturalidade', 'deficiencia',
            'email', 'telefone',
            'provincia_residencia', 'municipio_residencia',
            'bairro_residencia', 'numero_casa',
        }

        dados = {k: v for k, v in request.data.items() if k in CAMPOS_PERMITIDOS}

        if not dados:
            return Response(
                {'error': 'Nenhum campo válido para actualizar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar se aluno existe
        if not Aluno.objects.filter(pk=pk).exists():
            return Response({'error': 'Aluno não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Tratar data_nascimento vazia
        if 'data_nascimento' in dados and not dados['data_nascimento']:
            dados['data_nascimento'] = None

        # update() directo na BD — contorna completamente o save() do modelo
        Aluno.objects.filter(pk=pk).update(**dados)

        # Actualizar dados do Encarregado se fornecidos
        enc_data = request.data.get('encarregado_data')
        if enc_data:
            from apis.models import Encarregado, AlunoEncarregado
            e_id = enc_data.get('id')
            
            # Preparar campos do Encarregado
            e_update = {}
            if enc_data.get('nome'): e_update['nome_completo'] = enc_data['nome']
            if 'email' in enc_data: e_update['email'] = enc_data['email']
            if 'numero_bi' in enc_data: e_update['numero_bi'] = enc_data['numero_bi']
            if 'profissao' in enc_data: e_update['profissao'] = enc_data['profissao']
            if 'telefone' in enc_data: 
                tel = enc_data['telefone']
                e_update['telefone'] = [tel] if tel else []

            if e_id:
                # 1. Actualizar perfil do Encarregado existente
                if e_update:
                    Encarregado.objects.filter(pk=e_id).update(**e_update)
            else:
                # 1. Tentar vincular ou criar novo se tiver nome
                if enc_data.get('nome'):
                    bi = enc_data.get('numero_bi')
                    enc = None
                    if bi:
                        enc = Encarregado.objects.filter(numero_bi=bi).first()
                    
                    if not enc:
                        # Criar novo (senha padrão é o BI ou 123456)
                        if e_update:
                            e_update['senha_hash'] = bi if bi else '123456'
                            enc = Encarregado.objects.create(**e_update)
                    
                    if enc:
                        # Garantir vínculo
                        AlunoEncarregado.objects.get_or_create(
                            id_aluno_id=pk, 
                            id_encarregado=enc,
                            defaults={'grau_parentesco': enc_data.get('parentesco', 'Tutor')}
                        )
                        e_id = enc.pk

            # 2. Actualizar o grau de parentesco no relacionamento
            if e_id and 'parentesco' in enc_data:
                AlunoEncarregado.objects.filter(id_aluno_id=pk, id_encarregado_id=e_id).update(
                    grau_parentesco=enc_data['parentesco']
                )

        aluno = Aluno.objects.get(pk=pk)
        serializer = AlunoListSerializer(aluno, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    #filterset_fields = ['status_aluno', 'id_turma', 'genero']
    search_fields = ['nome_completo', 'email', 'numero_matricula', 'numero_bi']
    ordering_fields = ['nome_completo', 'numero_matricula', 'criado_em']
    ordering = ['nome_completo']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AlunoDetailSerializer
        elif self.action == 'list':
            return AlunoListSerializer
        return AlunoSerializer
    
    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Retorna apenas alunos ativos"""
        alunos = self.queryset.filter(status_aluno='Ativo')
        serializer = AlunoListSerializer(alunos, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retorna estatísticas gerais dos alunos para o dashboard"""
        from django.db.models import Count
        from apis.models import AnoLectivo, Turma
        
        # 1. Obter ano para filtragem (Query param ou Ativo)
        year_name = request.query_params.get('ano')
        active_year = AnoLectivo.objects.filter(activo=True).first()
        
        if year_name:
            target_year = AnoLectivo.objects.filter(nome=year_name).first()
        else:
            target_year = active_year

        # Filtro base para os gráficos (Alunos associados a turmas daquele ano)
        # Nota: total/ativos continuam globais para os cards, 
        # mas gênero/cursos serão filtrados pelo ano se disponível
        aluno_filter = {}
        if target_year:
            aluno_filter['id_turma__ano_lectivo'] = target_year
        
        # 1. Total e outros status (Globais)
        total = Aluno.objects.count()
        ativos = Aluno.objects.filter(status_aluno='Ativo').count()
        inativos = Aluno.objects.filter(status_aluno='Inativo').count()
        transferidos = Aluno.objects.filter(status_aluno='Transferido').count()
        concluidos = Aluno.objects.filter(status_aluno='Concluido').count()
        
        # 2. Por Gênero (Filtrado por Ano)
        genero = Aluno.objects.filter(**aluno_filter).values('genero').annotate(total=Count('id_aluno'))
        
        # 3. Por Curso (Filtrado por Ano)
        cursos = Aluno.objects.filter(**aluno_filter).values(
            'id_turma__id_curso__nome_curso'
        ).annotate(
            total=Count('id_aluno')
        ).order_by('-total')
        
        return Response({
            'total': total,
            'ativos': ativos,
            'inativos': inativos,
            'transferidos': transferidos,
            'concluidos': concluidos,
            'genero': list(genero),
            'cursos': [
                {
                    'nome': c['id_turma__id_curso__nome_curso'] or 'Sem Curso',
                    'total': c['total']
                } 
                for c in cursos
            ],
            'ano_filtrado': target_year.nome if target_year else 'Todos'
        })
    
    @action(detail=True, methods=['get'])
    def notas(self, request, pk=None):
        """Retorna notas do aluno"""
        from apis.models import Nota
        from apis.serializers import NotaListSerializer
        
        aluno = self.get_object()
        notas = Nota.objects.filter(id_aluno=aluno).select_related(
            'id_disciplina', 'id_professor'
        ).order_by('-data_lancamento')
        serializer = NotaListSerializer(notas, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def faltas(self, request, pk=None):
        """Retorna faltas do aluno"""
        from apis.models import FaltaAluno
        from apis.serializers import FaltaAlunoListSerializer
        
        aluno = self.get_object()
        faltas = FaltaAluno.objects.filter(id_aluno=aluno).select_related(
            'id_disciplina', 'id_turma'
        ).order_by('-data_falta')
        serializer = FaltaAlunoListSerializer(faltas, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def boletim(self, request, pk=None):
        """Retorna boletim completo do aluno"""
        from apis.models import Nota
        from django.db.models import Avg, Count
        
        aluno = self.get_object()
        
        # Notas agrupadas por disciplina
        notas_por_disciplina = Nota.objects.filter(
            id_aluno=aluno
        ).values(
            'id_disciplina__nome'
        ).annotate(
            media=Avg('valor'),
            total_avaliacoes=Count('id_nota')
        )
        
        # Faltas totais
        from apis.models import FaltaAluno
        total_faltas = FaltaAluno.objects.filter(id_aluno=aluno).count()
        faltas_justificadas = FaltaAluno.objects.filter(
            id_aluno=aluno, justificada=True
        ).count()
        
        return Response({
            'aluno': AlunoDetailSerializer(aluno, context={'request': request}).data,
            'notas_por_disciplina': list(notas_por_disciplina),
            'total_faltas': total_faltas,
            'faltas_justificadas': faltas_justificadas,
            'faltas_injustificadas': total_faltas - faltas_justificadas
        })
    
    @action(detail=True, methods=['get'])
    def encarregados(self, request, pk=None):
        """Retorna encarregados do aluno"""
        from apis.serializers import EncarregadoListSerializer
        
        aluno = self.get_object()
        vinculos = AlunoEncarregado.objects.filter(
            id_aluno=aluno
        ).select_related('id_encarregado')
        encarregados = [v.id_encarregado for v in vinculos]
        serializer = EncarregadoListSerializer(encarregados, many=True, context={'request': request})
        return Response(serializer.data)


class AlunoEncarregadoViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para AlunoEncarregado"""
    queryset = AlunoEncarregado.objects.select_related(
        'id_aluno', 'id_encarregado'
    ).all()
    serializer_class = AlunoEncarregadoSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        # 'list': 'view_alunos',
        # 'retrieve': 'view_alunos',
        'create': 'create_aluno',
        'update': 'edit_aluno',
        'partial_update': 'edit_aluno',
        'destroy': 'delete_aluno',
    }
    filter_backends = [DjangoFilterBackend]
    #filterset_fields = ['id_aluno', 'id_encarregado']
