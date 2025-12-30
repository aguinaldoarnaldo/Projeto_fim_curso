# Importar todos os models para facilitar o uso
from .base import BaseModel
from .usuarios import Cargo, Funcionario, Encarregado, CargoFuncionario
from .alunos import Aluno, AlunoEncarregado
from .academico import (
    Sala, Classe, Departamento, Seccao, AreaFormacao,
    Curso, Periodo, Turma
)
from .avaliacoes import TipoDisciplina, Disciplina, DisciplinaCurso, ProfessorDisciplina, Nota, FaltaAluno
from .documentos import Documento, SolicitacaoDocumento
from .biblioteca import Categoria, Livro
from .financeiro import Fatura, Pagamento
from .matriculas import Inscricao, Matricula
from .auditoria import Historico, HistoricoLogin

__all__ = [
    'BaseModel',
    'Cargo', 'Funcionario', 'Encarregado', 'CargoFuncionario',
    'Aluno', 'AlunoEncarregado',
    'Sala', 'Classe', 'Departamento', 'Seccao', 'AreaFormacao', 'Curso', 'Periodo', 'Turma',
    'TipoDisciplina', 'Disciplina', 'DisciplinaCurso', 'ProfessorDisciplina', 'Nota', 'FaltaAluno',
    'Documento', 'SolicitacaoDocumento',
    'Categoria', 'Livro',
    'Fatura', 'Pagamento',
    'Inscricao', 'Matricula',
    'Historico', 'HistoricoLogin',
]
