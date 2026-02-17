from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apis.permissions.custom_permissions import HasAdditionalPermission, IsActiveYearOrReadOnly
from apis.services.academic_service import AcademicService

from apis.models import (
    TipoDisciplina, Disciplina, DisciplinaCurso,
    ProfessorDisciplina, Nota, FaltaAluno
)
from apis.serializers import (
    TipoDisciplinaSerializer, DisciplinaSerializer, DisciplinaListSerializer,
    DisciplinaCursoSerializer, ProfessorDisciplinaSerializer,
    NotaSerializer, NotaListSerializer, NotaLancamentoLoteSerializer,
    FaltaAlunoSerializer, FaltaAlunoListSerializer
)


class TipoDisciplinaViewSet(viewsets.ModelViewSet):
    """ViewSet para TipoDisciplina"""
    queryset = TipoDisciplina.objects.all()
    serializer_class = TipoDisciplinaSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {'list': 'view_cursos', 'create': 'manage_disciplinas'}


class DisciplinaViewSet(viewsets.ModelViewSet):
    """ViewSet para Disciplina"""
    queryset = Disciplina.objects.select_related(
        'id_tipo_disciplina', 'id_coordenador'
    ).all()
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        'list': 'view_cursos',
        'retrieve': 'view_cursos',
        'create': 'manage_disciplinas',
        'update': 'manage_disciplinas',
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    #filterset_fields = ['id_tipo_disciplina']
    search_fields = ['nome']
    ordering_fields = ['nome', 'carga_horaria']
    ordering = ['nome']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DisciplinaListSerializer
        return DisciplinaSerializer


class DisciplinaCursoViewSet(viewsets.ModelViewSet):
    """ViewSet para DisciplinaCurso"""
    queryset = DisciplinaCurso.objects.select_related(
        'id_curso', 'id_disciplina'
    ).all()
    serializer_class = DisciplinaCursoSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {'list': 'view_cursos', 'create': 'manage_disciplinas'}
    filter_backends = [DjangoFilterBackend]


class ProfessorDisciplinaViewSet(viewsets.ModelViewSet):
    """ViewSet para ProfessorDisciplina"""
    queryset = ProfessorDisciplina.objects.select_related(
        'id_funcionario', 'id_disciplina', 'id_turma'
    ).all()
    serializer_class = ProfessorDisciplinaSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission, IsActiveYearOrReadOnly]
    permission_map = {'list': 'view_turmas', 'create': 'manage_turmas'}
    filter_backends = [DjangoFilterBackend]


class NotaViewSet(viewsets.ModelViewSet):
    """ViewSet para Nota"""
    queryset = Nota.objects.select_related(
        'id_aluno', 'id_disciplina', 'id_professor', 'id_turma'
    ).all()
    permission_classes = [IsAuthenticated, HasAdditionalPermission, IsActiveYearOrReadOnly]
    permission_map = {
        'list': 'view_notas',
        'retrieve': 'view_notas',
        'create': 'manage_notas',
        'lancar_lote': 'manage_notas',
    }
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    #filterset_fields = ['id_aluno', 'id_disciplina', 'id_turma', 'tipo_avaliacao']
    ordering_fields = ['data_lancamento', 'valor']
    ordering = ['-data_lancamento']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NotaListSerializer
        elif self.action == 'lancar_lote':
            return NotaLancamentoLoteSerializer
        return NotaSerializer
    
    @action(detail=False, methods=['post'])
    def lancar_lote(self, request):
        """Lançamento de notas em lote"""
        serializer = NotaLancamentoLoteSerializer(data=request.data)
        if serializer.is_valid():
            id_turma = serializer.validated_data['id_turma']
            id_disciplina = serializer.validated_data['id_disciplina']
            id_professor = serializer.validated_data['id_professor']
            tipo_avaliacao = serializer.validated_data['tipo_avaliacao']
            notas_data = serializer.validated_data['notas']
            
            try:
                from apis.models import Nota, Aluno, Disciplina, Funcionario, Turma
                turma = Turma.objects.get(id_turma=id_turma)
                
                # Check active year
                if turma.ano_lectivo and not turma.ano_lectivo.activo:
                    return Response(
                        {'error': f'O Ano Lectivo {turma.ano_lectivo.nome} está encerrado. Não é possível lançar notas.'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )

                disciplina = Disciplina.objects.get(id_disciplina=id_disciplina)
                professor = Funcionario.objects.get(id_funcionario=id_professor)
                
                notas_criadas = []
                for n in notas_data:
                    nota = Nota.objects.create(
                        id_aluno_id=n['id_aluno'],
                        id_disciplina=disciplina,
                        id_professor=professor,
                        id_turma=turma,
                        tipo_avaliacao=tipo_avaliacao,
                        valor=n['valor']
                    )
                    notas_criadas.append(nota)
                
                return Response({
                    'message': f'{len(notas_criadas)} notas lançadas.',
                    'count': len(notas_criadas)
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FaltaAlunoViewSet(viewsets.ModelViewSet):
    """ViewSet para FaltaAluno"""
    queryset = FaltaAluno.objects.select_related(
        'id_aluno', 'id_disciplina', 'id_turma'
    ).all()
    permission_classes = [IsAuthenticated, HasAdditionalPermission, IsActiveYearOrReadOnly]
    permission_map = {
        'list': 'view_faltas',
        'create': 'manage_faltas',
        'registrar_lote': 'manage_faltas',
    }
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    #filterset_fields = ['id_aluno', 'id_disciplina', 'id_turma', 'justificada']
    ordering_fields = ['data_falta']
    ordering = ['-data_falta']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FaltaAlunoListSerializer
        return FaltaAlunoSerializer
    
    @action(detail=False, methods=['post'])
    def registrar_lote(self, request):
        """Registro de faltas em lote"""
        aluno_ids = request.data.get('aluno_ids', [])
        disciplina_id = request.data.get('disciplina_id')
        turma_id = request.data.get('turma_id')
        data_falta = request.data.get('data_falta')
        observacao = request.data.get('observacao')
        
        try:
            from apis.models import Turma
            turma = Turma.objects.get(pk=turma_id)
            if turma.ano_lectivo and not turma.ano_lectivo.activo:
                 return Response(
                    {'error': f'O Ano Lectivo {turma.ano_lectivo.nome} está encerrado. Não é possível registrar faltas.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            total = AcademicService.registrar_falta_lote(
                aluno_ids, disciplina_id, turma_id, data_falta, observacao
            )
            return Response({
                'message': f'{total} faltas registradas.',
                'count': total
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
