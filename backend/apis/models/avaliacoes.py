from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .base import BaseModel
from .usuarios import Funcionario
from .alunos import Aluno
from .academico import Turma, Curso


class TipoDisciplina(models.Model):
    """Tipos de disciplina (Obrigatória, Optativa, etc.)"""
    id_tipo_disciplina = models.AutoField(primary_key=True)
    nome_tipo = models.CharField(max_length=80, verbose_name='Nome do Tipo')
    sigla = models.CharField(max_length=20, null=True, blank=True)
    
    class Meta:
        db_table = 'tipo_disciplina'
        verbose_name = 'Tipo de Disciplina'
        verbose_name_plural = 'Tipos de Disciplina'
    
    def __str__(self):
        return self.nome_tipo


class Disciplina(BaseModel):
    """Disciplinas oferecidas"""
    id_disciplina = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=150, verbose_name='Nome da Disciplina')
    id_tipo_disciplina = models.ForeignKey(
        TipoDisciplina,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Tipo'
    )
    carga_horaria = models.IntegerField(null=True, blank=True, verbose_name='Carga Horária')
    id_coordenador = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disciplinas_coordenadas',
        verbose_name='Coordenador'
    )
    
    class Meta:
        db_table = 'disciplina'
        verbose_name = 'Disciplina'
        verbose_name_plural = 'Disciplinas'
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class DisciplinaCurso(models.Model):
    """Relacionamento entre Disciplina e Curso"""
    id_disciplina_curso = models.AutoField(primary_key=True)
    id_curso = models.ForeignKey(Curso, on_delete=models.CASCADE, verbose_name='Curso')
    id_disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE, verbose_name='Disciplina')
    
    class Meta:
        db_table = 'disciplina_curso'
        verbose_name = 'Disciplina-Curso'
        verbose_name_plural = 'Disciplinas-Cursos'
        unique_together = ['id_curso', 'id_disciplina']
    
    def __str__(self):
        return f"{self.id_disciplina.nome} - {self.id_curso.nome_curso}"


class ProfessorDisciplina(models.Model):
    """Vinculação de Professor com Disciplina e Turma"""
    id_professor_disciplina = models.AutoField(primary_key=True)
    id_funcionario = models.ForeignKey(
        Funcionario,
        on_delete=models.CASCADE,
        verbose_name='Professor'
    )
    id_disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE, verbose_name='Disciplina')
    id_turma = models.ForeignKey(Turma, on_delete=models.CASCADE, verbose_name='Turma')
    
    class Meta:
        db_table = 'professor_disciplina'
        verbose_name = 'Professor-Disciplina'
        verbose_name_plural = 'Professores-Disciplinas'
        unique_together = ['id_funcionario', 'id_disciplina', 'id_turma']
    
    def __str__(self):
        return f"{self.id_funcionario.nome_completo} - {self.id_disciplina.nome} - {self.id_turma.codigo_turma}"


class Nota(models.Model):
    """Notas dos alunos"""
    
    TIPO_AVALIACAO_CHOICES = [
        ('Prova do Professor', 'Prova do Professor'),
        ('Prova Trimestral', 'Prova Trimestral'),
        ('Avaliação Continua', 'Avaliação Contínua'),
    ]
    
    id_nota = models.AutoField(primary_key=True)
    id_aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, verbose_name='Aluno')
    id_disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE, verbose_name='Disciplina')
    id_professor = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Professor'
    )
    id_turma = models.ForeignKey(Turma, on_delete=models.CASCADE, verbose_name='Turma')
    tipo_avaliacao = models.CharField(max_length=30, choices=TIPO_AVALIACAO_CHOICES, verbose_name='Tipo de Avaliação')
    valor = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        verbose_name='Nota'
    )
    data_lancamento = models.DateTimeField(auto_now_add=True, verbose_name='Data de Lançamento')
    
    class Meta:
        db_table = 'nota'
        verbose_name = 'Nota'
        verbose_name_plural = 'Notas'
        ordering = ['-data_lancamento']
        indexes = [
            models.Index(fields=['id_aluno', 'id_disciplina']),
        ]
    
    def __str__(self):
        return f"{self.id_aluno.nome_completo} - {self.id_disciplina.nome}: {self.valor}"


class FaltaAluno(models.Model):
    """Registro de faltas dos alunos"""
    id_falta = models.AutoField(primary_key=True)
    id_aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, verbose_name='Aluno')
    id_disciplina = models.ForeignKey(
        Disciplina,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Disciplina'
    )
    id_turma = models.ForeignKey(Turma, on_delete=models.CASCADE, verbose_name='Turma')
    data_falta = models.DateField(verbose_name='Data da Falta')
    justificada = models.BooleanField(default=False, verbose_name='Justificada')
    observacao = models.TextField(null=True, blank=True, verbose_name='Observação')
    
    class Meta:
        db_table = 'falta_aluno'
        verbose_name = 'Falta'
        verbose_name_plural = 'Faltas'
        ordering = ['-data_falta']
        indexes = [
            models.Index(fields=['id_aluno', 'data_falta']),
        ]
    
    def __str__(self):
        return f"{self.id_aluno.nome_completo} - {self.data_falta}"
