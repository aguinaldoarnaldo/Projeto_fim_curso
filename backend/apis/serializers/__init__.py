# Importar todos os serializers para facilitar o uso
from .usuario_serializers import (
    CargoSerializer, FuncionarioSerializer, FuncionarioListSerializer,
    EncarregadoSerializer, EncarregadoListSerializer, CargoFuncionarioSerializer
)
from .aluno_serializers import (
    AlunoSerializer, AlunoListSerializer, AlunoDetailSerializer, AlunoEncarregadoSerializer
)
from .academico_serializers import (
    SalaSerializer, ClasseSerializer, DepartamentoSerializer, SeccaoSerializer,
    AreaFormacaoSerializer, CursoSerializer, CursoListSerializer,
    PeriodoSerializer, TurmaSerializer, TurmaListSerializer, AnoLectivoSerializer
)

from .avaliacao_serializers import (
    TipoDisciplinaSerializer, DisciplinaSerializer, DisciplinaListSerializer,
    DisciplinaCursoSerializer, ProfessorDisciplinaSerializer,
    NotaSerializer, NotaListSerializer, NotaLancamentoLoteSerializer,
    FaltaAlunoSerializer, FaltaAlunoListSerializer
)
from .documento_serializers import (
    DocumentoSerializer, DocumentoListSerializer,
    SolicitacaoDocumentoSerializer, SolicitacaoDocumentoListSerializer,
    SolicitacaoDocumentoAprovarSerializer, SolicitacaoDocumentoRejeitarSerializer
)
from .biblioteca_serializers import (
    CategoriaSerializer, LivroSerializer, LivroListSerializer
)
from .financeiro_serializers import (
    FaturaSerializer, FaturaListSerializer,
    PagamentoSerializer, PagamentoListSerializer
)
from .auditoria_serializers import (
    InscricaoSerializer, MatriculaSerializer,
    HistoricoSerializer, HistoricoLoginSerializer
)
from .candidatura_serializers import (
    CandidatoSerializer, CandidatoCreateSerializer, RupeCandidatoSerializer
)

__all__ = [
    # Usuários
    'CargoSerializer', 'FuncionarioSerializer', 'FuncionarioListSerializer',
    'EncarregadoSerializer', 'EncarregadoListSerializer', 'CargoFuncionarioSerializer',
    # Alunos
    'AlunoSerializer', 'AlunoListSerializer', 'AlunoDetailSerializer', 'AlunoEncarregadoSerializer',
    # Acadêmico
    'SalaSerializer', 'ClasseSerializer', 'DepartamentoSerializer', 'SeccaoSerializer',
    'AreaFormacaoSerializer', 'CursoSerializer', 'CursoListSerializer',
    'PeriodoSerializer', 'TurmaSerializer', 'TurmaListSerializer', 'AnoLectivoSerializer',

    # Avaliações
    'TipoDisciplinaSerializer', 'DisciplinaSerializer', 'DisciplinaListSerializer',
    'DisciplinaCursoSerializer', 'ProfessorDisciplinaSerializer',
    'NotaSerializer', 'NotaListSerializer', 'NotaLancamentoLoteSerializer',
    'FaltaAlunoSerializer', 'FaltaAlunoListSerializer',
    # Documentos
    'DocumentoSerializer', 'DocumentoListSerializer',
    'SolicitacaoDocumentoSerializer', 'SolicitacaoDocumentoListSerializer',
    'SolicitacaoDocumentoAprovarSerializer', 'SolicitacaoDocumentoRejeitarSerializer',
    # Biblioteca
    'CategoriaSerializer', 'LivroSerializer', 'LivroListSerializer',
    # Financeiro
    'FaturaSerializer', 'FaturaListSerializer',
    'PagamentoSerializer', 'PagamentoListSerializer',
    # Auditoria
    'InscricaoSerializer', 'MatriculaSerializer',
    'HistoricoSerializer', 'HistoricoLoginSerializer',
    # Candidatura
    'CandidatoSerializer', 'CandidatoCreateSerializer', 'RupeCandidatoSerializer',
]
