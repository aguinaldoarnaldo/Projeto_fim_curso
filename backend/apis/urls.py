"""
URLs da API v1
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apis.views import (
    # Auth views
    login_view, logout_view, me_view, update_profile_view, define_password_view,
    # ViewSets
    CargoViewSet, FuncionarioViewSet, EncarregadoViewSet, CargoFuncionarioViewSet,
    UsuarioViewSet, # Added
    AlunoViewSet, AlunoEncarregadoViewSet,
    SalaViewSet, ClasseViewSet, DepartamentoViewSet, SeccaoViewSet,
    AreaFormacaoViewSet, CursoViewSet, PeriodoViewSet, TurmaViewSet, AnoLectivoViewSet,
    VagaCursoViewSet,
    TipoDisciplinaViewSet, DisciplinaViewSet, DisciplinaCursoViewSet,

    ProfessorDisciplinaViewSet, NotaViewSet, FaltaAlunoViewSet,
    FaturaViewSet, PagamentoViewSet,
    CandidaturaViewSet,
    ListaEsperaViewSet,
    RelatorioViewSet,
    AuditoriaViewSet,
)

# Criar router e registrar ViewSets
router = DefaultRouter()

# Usuários
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'cargos', CargoViewSet, basename='cargo')
router.register(r'funcionarios', FuncionarioViewSet, basename='funcionario')
router.register(r'encarregados', EncarregadoViewSet, basename='encarregado')
router.register(r'cargo-funcionario', CargoFuncionarioViewSet, basename='cargo-funcionario')

# Alunos
router.register(r'alunos', AlunoViewSet, basename='aluno')
router.register(r'aluno-encarregado', AlunoEncarregadoViewSet, basename='aluno-encarregado')

# Acadêmico
router.register(r'salas', SalaViewSet, basename='sala')
router.register(r'classes', ClasseViewSet, basename='classe')
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')
router.register(r'seccoes', SeccaoViewSet, basename='seccao')
router.register(r'areas-formacao', AreaFormacaoViewSet, basename='area-formacao')
router.register(r'cursos', CursoViewSet, basename='curso')
router.register(r'periodos', PeriodoViewSet, basename='periodo')
router.register(r'anos-lectivos', AnoLectivoViewSet, basename='ano-lectivo')
router.register(r'vaga-curso', VagaCursoViewSet, basename='vaga-curso')
router.register(r'turmas', TurmaViewSet, basename='turma')

# Avaliações
router.register(r'tipos-disciplina', TipoDisciplinaViewSet, basename='tipo-disciplina')
router.register(r'disciplinas', DisciplinaViewSet, basename='disciplina')
router.register(r'disciplina-curso', DisciplinaCursoViewSet, basename='disciplina-curso')
router.register(r'professor-disciplina', ProfessorDisciplinaViewSet, basename='professor-disciplina')
router.register(r'notas', NotaViewSet, basename='nota')
router.register(r'faltas', FaltaAlunoViewSet, basename='falta')

# Financeiro
router.register(r'faturas', FaturaViewSet, basename='fatura')
router.register(r'pagamentos', PagamentoViewSet, basename='pagamento')

# Candidatura
router.register(r'candidaturas', CandidaturaViewSet, basename='candidatura')
router.register(r'lista-espera', ListaEsperaViewSet, basename='lista-espera')

# Matriculas
from apis.views.matricula_views import MatriculaViewSet
router.register(r'matriculas', MatriculaViewSet, basename='matricula')

# Configuração
from apis.views.configuracao_views import ConfiguracaoViewSet
from apis.views.backup_views import BackupViewSet
router.register(r'config', ConfiguracaoViewSet, basename='config')
router.register(r'backups', BackupViewSet, basename='backup')

# Notificações
from apis.views.notificacao import NotificacaoViewSet
router.register(r'notificacoes', NotificacaoViewSet, basename='notificacao')

# Relatórios
router.register(r'relatorios', RelatorioViewSet, basename='relatorio')

# Auditoria / Logs
router.register(r'auditoria', AuditoriaViewSet, basename='auditoria')

# URLs
urlpatterns = [
    # Autenticação
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path('auth/profile/update/', update_profile_view, name='update_profile'),
    path('auth/define-password/', define_password_view, name='define_password'),
    
    # Incluir rotas do router
    path('', include(router.urls)),
]
