from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apis.models import (
    Sala, Classe, Departamento, Seccao, AreaFormacao,
    Curso, Periodo, Turma, AnoLectivo
)
from apis.serializers.academico_serializers import (
    SalaSerializer, ClasseSerializer, DepartamentoSerializer, SeccaoSerializer,
    AreaFormacaoSerializer, CursoSerializer, CursoListSerializer,
    PeriodoSerializer, TurmaSerializer, TurmaListSerializer, AnoLectivoSerializer
)



class AnoLectivoViewSet(viewsets.ModelViewSet):
    """ViewSet para AnoLectivo"""
    queryset = AnoLectivo.objects.all()
    serializer_class = AnoLectivoSerializer
    ordering = ['-nome']
    
    def get_permissions(self):
        """
        Apenas admins podem criar, editar ou excluir.
        Listar pode ser permitido a autenticados (para selects etc).
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]



class SalaViewSet(viewsets.ModelViewSet):
    """ViewSet para Sala"""
    queryset = Sala.objects.all()
    serializer_class = SalaSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['numero_sala', 'bloco']
    ordering_fields = ['numero_sala', 'capacidade_alunos', 'bloco']
    ordering = ['numero_sala']


class ClasseViewSet(viewsets.ModelViewSet):
    """ViewSet para Classe"""
    queryset = Classe.objects.all()
    serializer_class = ClasseSerializer
    
    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    ordering = ['nivel']


class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para Departamento"""
    queryset = Departamento.objects.select_related('chefe_id_funcionario').all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nome_departamento']
    ordering = ['nome_departamento']


class SeccaoViewSet(viewsets.ModelViewSet):
    """ViewSet para Seccao"""
    queryset = Seccao.objects.select_related('id_departamento').all()
    serializer_class = SeccaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    #filterset_fields = ['id_departamento']
    search_fields = ['nome_seccao']


class AreaFormacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para AreaFormacao"""
    queryset = AreaFormacao.objects.select_related('id_responsavel').all()
    serializer_class = AreaFormacaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nome_area']
    ordering = ['nome_area']


class CursoViewSet(viewsets.ModelViewSet):
    """ViewSet para Curso"""
    queryset = Curso.objects.select_related(
        'id_area_formacao', 'id_responsavel'
    ).all()
    # permission_classes = [IsAuthenticated] - Managed by get_permissions
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    #filterset_fields = ['id_area_formacao']
    search_fields = ['nome_curso']
    ordering_fields = ['nome_curso', 'duracao']
    ordering = ['nome_curso']
    
    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CursoListSerializer
        return CursoSerializer
    
    @action(detail=True, methods=['get'])
    def turmas(self, request, pk=None):
        """Retorna turmas do curso"""
        curso = self.get_object()
        turmas = Turma.objects.filter(id_curso=curso).select_related(
            'id_sala', 'id_classe', 'id_periodo'
        )
        serializer = TurmaListSerializer(turmas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def disciplinas(self, request, pk=None):
        """Retorna disciplinas do curso"""
        from apis.models import DisciplinaCurso
        from apis.serializers import DisciplinaListSerializer
        
        curso = self.get_object()
        vinculos = DisciplinaCurso.objects.filter(
            id_curso=curso
        ).select_related('id_disciplina')
        disciplinas = [v.id_disciplina for v in vinculos]
        serializer = DisciplinaListSerializer(disciplinas, many=True)
        return Response(serializer.data)


class PeriodoViewSet(viewsets.ModelViewSet):
    """ViewSet para Periodo"""
    queryset = Periodo.objects.select_related('id_responsavel').all()
    serializer_class = PeriodoSerializer
    permission_classes = [AllowAny]


class TurmaViewSet(viewsets.ModelViewSet):
    """ViewSet para Turma"""
    queryset = Turma.objects.select_related(
        'id_sala', 'id_curso', 'id_classe', 'id_periodo', 'id_responsavel'
    ).all()
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    #filterset_fields = ['id_curso', 'id_classe', 'id_periodo', 'ano']
    search_fields = ['codigo_turma']
    ordering_fields = ['codigo_turma', 'ano']
    ordering = ['codigo_turma']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TurmaListSerializer
        return TurmaSerializer
    
    @action(detail=True, methods=['get'])
    def alunos(self, request, pk=None):
        """Retorna alunos da turma"""
        from apis.models import Aluno
        from apis.serializers import AlunoListSerializer
        
        turma = self.get_object()
        alunos = Aluno.objects.filter(id_turma=turma)
        serializer = AlunoListSerializer(alunos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def estatisticas(self, request, pk=None):
        """Retorna estatísticas da turma"""
        from apis.models import Aluno
        from django.db.models import Count
        
        turma = self.get_object()
        total_alunos = Aluno.objects.filter(id_turma=turma).count()
        alunos_por_status = Aluno.objects.filter(
            id_turma=turma
        ).values('status_aluno').annotate(total=Count('id_aluno'))
        alunos_por_genero = Aluno.objects.filter(
            id_turma=turma
        ).values('genero').annotate(total=Count('id_aluno'))
        
        return Response({
            'turma': TurmaSerializer(turma).data,
            'total_alunos': total_alunos,
            'alunos_por_status': list(alunos_por_status),
            'alunos_por_genero': list(alunos_por_genero)
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Retorna sumário de turmas para o dashboard"""
        total = Turma.objects.count()
        ativas = Turma.objects.filter(status='Ativa').count()
        concluidas = Turma.objects.filter(status='Concluida').count()
        
        return Response({
            'total': total,
            'ativas': ativas,
            'concluidas': concluidas
        })
        