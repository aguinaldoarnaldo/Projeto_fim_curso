# Importar todas as views para facilitar o uso
from .auth_views import login_view, logout_view, me_view
from .usuario_views import (
    CargoViewSet, FuncionarioViewSet, EncarregadoViewSet, CargoFuncionarioViewSet
)
from .aluno_views import AlunoViewSet, AlunoEncarregadoViewSet
from .academico_views import (
    SalaViewSet, ClasseViewSet, DepartamentoViewSet, SeccaoViewSet,
    AreaFormacaoViewSet, CursoViewSet, PeriodoViewSet, TurmaViewSet
)
from .avaliacao_views import (
    TipoDisciplinaViewSet, DisciplinaViewSet, DisciplinaCursoViewSet,
    ProfessorDisciplinaViewSet, NotaViewSet, FaltaAlunoViewSet
)
from .documento_views import DocumentoViewSet, SolicitacaoDocumentoViewSet
from .biblioteca_views import CategoriaViewSet, LivroViewSet
from .financeiro_views import FaturaViewSet, PagamentoViewSet

__all__ = [
    # Auth
    'login_view', 'logout_view', 'me_view',
    # Usuários
    'CargoViewSet', 'FuncionarioViewSet', 'EncarregadoViewSet', 'CargoFuncionarioViewSet',
    # Alunos
    'AlunoViewSet', 'AlunoEncarregadoViewSet',
    # Acadêmico
    'SalaViewSet', 'ClasseViewSet', 'DepartamentoViewSet', 'SeccaoViewSet',
    'AreaFormacaoViewSet', 'CursoViewSet', 'PeriodoViewSet', 'TurmaViewSet',
    # Avaliações
    'TipoDisciplinaViewSet', 'DisciplinaViewSet', 'DisciplinaCursoViewSet',
    'ProfessorDisciplinaViewSet', 'NotaViewSet', 'FaltaAlunoViewSet',
    # Documentos
    'DocumentoViewSet', 'SolicitacaoDocumentoViewSet',
    # Biblioteca
    'CategoriaViewSet', 'LivroViewSet',
    # Financeiro
    'FaturaViewSet', 'PagamentoViewSet',
]
