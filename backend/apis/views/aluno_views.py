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


class AlunoViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para Aluno"""
    queryset = Aluno.objects.select_related(
        'id_turma',
        'id_turma__id_curso',
        'id_turma__id_classe',
        'id_turma__id_periodo',
        'id_turma__id_sala'
    ).prefetch_related(
        'alunoencarregado_set',
        'alunoencarregado_set__id_encarregado'
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
        'ativos': 'view_alunos',
        'stats': 'view_dashboard',
        'notas': 'view_notas',
        'faltas': 'view_faltas',
        'boletim': 'view_notas',
        'encarregados': 'view_alunos',
    }

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    #filterset_fields = ['status_aluno', 'id_turma', 'genero']
    search_fields = ['nome_completo', 'email', 'numero_matricula']
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
        alunos = self.queryset.filter(status_aluno='Activo')
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
        
        # 1. Total e Ativos (Globais ou por Ano?) 
        # Vamos manter globais para os contadores principais, mas filtrados para os gráficos
        total = Aluno.objects.count()
        ativos = Aluno.objects.filter(status_aluno='Activo').count()
        
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
