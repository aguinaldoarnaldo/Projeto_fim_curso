# Importar todas as views para facilitar o uso
from .auth_views import login_view, logout_view, me_view, update_profile_view, define_password_view
from .usuario_views import (
    CargoViewSet, FuncionarioViewSet, EncarregadoViewSet, CargoFuncionarioViewSet,
    UsuarioViewSet
)
from .aluno_views import AlunoViewSet, AlunoEncarregadoViewSet
from .academico_views import (
    SalaViewSet, ClasseViewSet, DepartamentoViewSet, SeccaoViewSet,
    AreaFormacaoViewSet, CursoViewSet, PeriodoViewSet, TurmaViewSet, AnoLectivoViewSet
)

from .avaliacao_views import (
    TipoDisciplinaViewSet, DisciplinaViewSet, DisciplinaCursoViewSet,
    ProfessorDisciplinaViewSet, NotaViewSet, FaltaAlunoViewSet
)
from .financeiro_views import FaturaViewSet, PagamentoViewSet
from .candidatura_views import CandidaturaViewSet, ListaEsperaViewSet
from .relatorio_views import RelatorioViewSet

__all__ = [
    # Auth
    'login_view', 'logout_view', 'me_view', 'update_profile_view', 'define_password_view',
    # Usuários
    'CargoViewSet', 'FuncionarioViewSet', 'EncarregadoViewSet', 'CargoFuncionarioViewSet',
    'UsuarioViewSet',
    # Alunos
    'AlunoViewSet', 'AlunoEncarregadoViewSet',
    # Acadêmico
    'SalaViewSet', 'ClasseViewSet', 'DepartamentoViewSet', 'SeccaoViewSet',
    'AreaFormacaoViewSet', 'CursoViewSet', 'PeriodoViewSet', 'TurmaViewSet', 'AnoLectivoViewSet',

    # Avaliações
    'TipoDisciplinaViewSet', 'DisciplinaViewSet', 'DisciplinaCursoViewSet',
    'ProfessorDisciplinaViewSet', 'NotaViewSet', 'FaltaAlunoViewSet',
    # Financeiro
    'FaturaViewSet', 'PagamentoViewSet',
    'CandidaturaViewSet', 'ListaEsperaViewSet',
    'RelatorioViewSet',
]
