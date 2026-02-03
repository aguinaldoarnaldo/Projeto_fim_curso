# Importar todos os models para facilitar o uso
from .base import BaseModel
from .usuarios import Cargo, Funcionario, Encarregado, CargoFuncionario, Usuario
from .alunos import Aluno, AlunoEncarregado
from .academico import (
    Sala, Classe, Departamento, Seccao, AreaFormacao,
    Curso, Periodo, Turma, AnoLectivo
)

from .avaliacoes import TipoDisciplina, Disciplina, DisciplinaCurso, ProfessorDisciplina, Nota, FaltaAluno
from .documentos import Documento, SolicitacaoDocumento
from .biblioteca import Categoria, Livro
from .financeiro import Fatura, Pagamento
from .matriculas import Inscricao, Matricula
from .historico import HistoricoEscolar
from .auditoria import Historico, HistoricoLogin
from .candidatura import Candidato, RupeCandidato, ExameAdmissao, ListaEspera
from .configuracao import Configuracao
from .notificacao import Notificacao

__all__ = [
    'BaseModel',
    'Usuario', 'Cargo', 'Funcionario', 'Encarregado', 'CargoFuncionario',
    'Aluno', 'AlunoEncarregado',
    'Sala', 'Classe', 'Departamento', 'Seccao', 'AreaFormacao', 'Curso', 'Periodo', 'Turma', 'AnoLectivo',

    'TipoDisciplina', 'Disciplina', 'DisciplinaCurso', 'ProfessorDisciplina', 'Nota', 'FaltaAluno',
    'Documento', 'SolicitacaoDocumento',
    'Categoria', 'Livro',
    'Fatura', 'Pagamento',
    'Inscricao', 'Matricula',
    'Historico', 'HistoricoLogin',
    # Candidatura
    'Candidato', 'RupeCandidato', 'ExameAdmissao', 'ListaEspera',
    'Configuracao',
    'Notificacao',
]
