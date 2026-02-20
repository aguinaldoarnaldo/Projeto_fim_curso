from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apis.permissions.custom_permissions import HasAdditionalPermission, IsActiveYearOrReadOnly

from apis.models import (
    Sala, Classe, Departamento, Seccao, AreaFormacao,
    Curso, Periodo, Turma, AnoLectivo
)
from apis.serializers.academico_serializers import (
    SalaSerializer, ClasseSerializer, DepartamentoSerializer, SeccaoSerializer,
    AreaFormacaoSerializer, CursoSerializer, CursoListSerializer,
    PeriodoSerializer, TurmaSerializer, TurmaListSerializer, AnoLectivoSerializer
)

from rest_framework.pagination import PageNumberPagination

class AnoLectivoPagination(PageNumberPagination):
    page_size = 6

class AnoLectivoViewSet(viewsets.ModelViewSet):
    """ViewSet para AnoLectivo"""
    queryset = AnoLectivo.objects.all()
    serializer_class = AnoLectivoSerializer
    pagination_class = AnoLectivoPagination
    ordering = ['-nome']

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('all') == 'true':
            return None
        return super().paginate_queryset(queryset)
    
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        # 'list': 'view_configuracoes',
        # 'retrieve': 'view_configuracoes',
        'create': 'manage_configuracoes',
        'update': 'manage_configuracoes',
        'partial_update': 'manage_configuracoes',
        'destroy': 'manage_configuracoes',
        'encerrar': 'manage_configuracoes',
        'stats_by_year': 'view_dashboard',
    }

    @action(detail=True, methods=['post'])
    def encerrar(self, request, pk=None):
        """Encerra o ano lectivo (desativa) e atualiza matrículas"""
        ano_lectivo = self.get_object()
        if ano_lectivo.status == 'Encerrado':
            return Response({"detail": "O ano lectivo já está encerrado."}, status=400)
        
        # 1. Update active status
        ano_lectivo.status = 'Encerrado'
        ano_lectivo.activo = False
        ano_lectivo.save()
        
        # 2. Bulk update matriculas e Turmas to 'Concluida'
        from apis.models import Matricula, Turma
        
        updated_matriculas = Matricula.objects.filter(
            ano_lectivo=ano_lectivo,
            status__in=['Ativa', 'Confirmada']
        ).update(status='Concluida')
        
        updated_turmas = Turma.objects.filter(
            ano_lectivo=ano_lectivo, 
            status='Ativa'
        ).update(status='Concluida')
        
        return Response({
            "detail": f"Ano lectivo {ano_lectivo.nome} encerrado com sucesso.",
            "matriculas_atualizadas": updated_matriculas,
            "turmas_encerradas": updated_turmas
        }, status=200)

    def perform_update(self, serializer):
        # Check if reopening (setting status='Activo' or activo=True)
        is_reopening = (
            ('status' in serializer.validated_data and serializer.validated_data['status'] == 'Activo') or
            ('activo' in serializer.validated_data and serializer.validated_data['activo'] is True)
        )
        
        if is_reopening:
             user = self.request.user
             is_admin = user.is_superuser or (
                 hasattr(user, 'profile') and 
                 user.profile.papel and 
                 any(role in user.profile.papel.lower() for role in ['admin', 'diretor'])
             )
             
             if not is_admin:
                  from rest_framework.exceptions import PermissionDenied
                  raise PermissionDenied("Apenas administradores podem reabrir um ano lectivo.")

             # Reabertura do Ano Lectivo: Reverter matrículas 'Concluida' para 'Ativa'
             instance = serializer.instance
             if instance and instance.status != 'Activo':
                 from apis.models import Matricula
                 updated_count = Matricula.objects.filter(
                    ano_lectivo=instance,
                    status='Concluida'
                 ).update(status='Ativa')
                 
                 from apis.models import Turma
                 updated_turmas = Turma.objects.filter(
                    ano_lectivo=instance, 
                    status='Concluida'
                 ).update(status='Ativa')
                 
                 print(f"Ano Lectivo {instance.nome} reaberto: {updated_count} matrículas e {updated_turmas} turmas revertidas para 'Ativa'.")
        
        serializer.save()

    @action(detail=True, methods=['get'])
    def stats_by_year(self, request, pk=None):
        """Retorna estatísticas mensais para o gráfico (Matrículas vs Inscrições)"""
        # Imports locais para evitar dependências circulares
        from django.db.models.functions import ExtractMonth
        from django.db.models import Count
        from apis.models import Matricula, Candidato
        
        ano_lectivo = self.get_object()
        
        # 1. Matrículas por mes
        matriculas_qs = Matricula.objects.filter(ano_lectivo=ano_lectivo).annotate(
            mes=ExtractMonth('data_matricula')
        ).values('mes').annotate(total=Count('id_matricula')).order_by('mes')
        
        # 2. Candidaturas (Inscritos) por mes
        candidatos_qs = Candidato.objects.filter(ano_lectivo=ano_lectivo).annotate(
            mes=ExtractMonth('criado_em')
        ).values('mes').annotate(total=Count('id_candidato')).order_by('mes')
        
        # 3. Merge data into standard format [Jan-Dec]
        month_map = {
            1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
            7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
        }
        
        data = []
        for i in range(1, 13):
            mes_label = month_map[i]
            mat_stat = next((item for item in matriculas_qs if item['mes'] == i), None)
            cand_stat = next((item for item in candidatos_qs if item['mes'] == i), None)
            
            data.append({
                'mes': mes_label,
                'matriculas': mat_stat['total'] if mat_stat else 0,
                'inscritos': cand_stat['total'] if cand_stat else 0
            })
            
        return Response(data)

class SalaViewSet(viewsets.ModelViewSet):
    """ViewSet para Sala"""
    queryset = Sala.objects.all()
    serializer_class = SalaSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        # 'list': 'view_salas',
        # 'retrieve': 'view_salas',
        'create': 'manage_salas',
        'update': 'manage_salas',
        'destroy': 'manage_salas',
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['numero_sala', 'bloco']
    ordering_fields = ['numero_sala', 'capacidade_alunos', 'bloco']
    ordering = ['numero_sala']

class ClasseViewSet(viewsets.ModelViewSet):
    """ViewSet para Classe"""
    queryset = Classe.objects.all()
    serializer_class = ClasseSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        # 'list': 'view_turmas', # Usado para dropdowns
        # 'retrieve': 'view_turmas',
        'create': 'manage_configuracoes',
        'update': 'manage_configuracoes',
        'destroy': 'manage_configuracoes',
    }
    ordering = ['nivel']

class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para Departamento"""
    queryset = Departamento.objects.select_related('chefe_id_funcionario').all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        'list': 'view_configuracoes',
        'retrieve': 'view_configuracoes',
        'create': 'manage_configuracoes',
    }
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nome_departamento']
    ordering = ['nome_departamento']

class SeccaoViewSet(viewsets.ModelViewSet):
    """ViewSet para Seccao"""
    queryset = Seccao.objects.select_related('id_departamento').all()
    serializer_class = SeccaoSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {'list': 'view_configuracoes'}
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['nome_seccao']

class AreaFormacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para AreaFormacao"""
    queryset = AreaFormacao.objects.select_related('id_responsavel').all()
    serializer_class = AreaFormacaoSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {'list': 'view_configuracoes'}
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nome_area']
    ordering = ['nome_area']

class CursoViewSet(viewsets.ModelViewSet):
    """ViewSet para Curso"""
    queryset = Curso.objects.select_related('id_area_formacao', 'id_responsavel').all()
    serializer_class = CursoSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        # 'list': 'view_cursos',
        # 'retrieve': 'view_cursos',
        'create': 'manage_cursos',
        'update': 'manage_cursos',
        'destroy': 'manage_cursos',
        'turmas': 'view_turmas',
        'disciplinas': 'view_cursos',
    }
    
    def get_permissions(self):
        """Permitir listagem pública para o formulário de candidaturas"""
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated(), HasAdditionalPermission()]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nome_curso']
    ordering_fields = ['nome_curso', 'duracao']
    ordering = ['nome_curso']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CursoListSerializer
        return CursoSerializer
    
    @action(detail=True, methods=['get'])
    def turmas(self, request, pk=None):
        curso = self.get_object()
        turmas = Turma.objects.filter(id_curso=curso).select_related('id_sala', 'id_classe', 'id_periodo')
        serializer = TurmaListSerializer(turmas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def disciplinas(self, request, pk=None):
        from apis.models import DisciplinaCurso
        from apis.serializers import DisciplinaListSerializer
        curso = self.get_object()
        vinculos = DisciplinaCurso.objects.filter(id_curso=curso).select_related('id_disciplina')
        disciplinas = [v.id_disciplina for v in vinculos]
        serializer = DisciplinaListSerializer(disciplinas, many=True)
        return Response(serializer.data)

class PeriodoViewSet(viewsets.ModelViewSet):
    """ViewSet para Periodo"""
    queryset = Periodo.objects.select_related('id_responsavel').all()
    serializer_class = PeriodoSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {} # 'list': 'view_turmas' removido

class TurmaViewSet(viewsets.ModelViewSet):
    """ViewSet para Turma"""
    queryset = Turma.objects.select_related('id_sala', 'id_curso', 'id_classe', 'id_periodo', 'id_responsavel').all()
    serializer_class = TurmaSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission, IsActiveYearOrReadOnly]
    permission_map = {
        # 'list': 'view_turmas',
        # 'retrieve': 'view_turmas',
        'create': 'create_turma',
        'update': 'edit_turma',
        'destroy': 'delete_turma',
        'alunos': 'view_alunos',
        'estatisticas': 'view_turmas',
        'summary': 'view_dashboard',
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['codigo_turma']
    ordering_fields = ['codigo_turma', 'ano']
    ordering = ['codigo_turma']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TurmaListSerializer
        return TurmaSerializer
    
    @action(detail=True, methods=['get'])
    def alunos(self, request, pk=None):
        from apis.models import Aluno
        from apis.serializers import AlunoListSerializer
        turma = self.get_object()
        alunos = Aluno.objects.filter(id_turma=turma)
        serializer = AlunoListSerializer(alunos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def estatisticas(self, request, pk=None):
        from apis.models import Aluno
        from django.db.models import Count
        turma = self.get_object()
        total_alunos = Aluno.objects.filter(id_turma=turma).count()
        alunos_por_status = Aluno.objects.filter(id_turma=turma).values('status_aluno').annotate(total=Count('id_aluno'))
        alunos_por_genero = Aluno.objects.filter(id_turma=turma).values('genero').annotate(total=Count('id_aluno'))
        return Response({
            'turma': TurmaSerializer(turma).data,
            'total_alunos': total_alunos,
            'alunos_por_status': list(alunos_por_status),
            'alunos_por_genero': list(alunos_por_genero)
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total = Turma.objects.count()
        ativas = Turma.objects.filter(status='Ativa').count()
        concluidas = Turma.objects.filter(status='Concluida').count()
        return Response({
            'total': total, 'ativas': ativas, 'concluidas': concluidas
        })