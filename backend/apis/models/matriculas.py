from django.db import models
from django.core.exceptions import ValidationError
from .alunos import Aluno
from .alunos import Aluno
from .academico import Turma, AnoLectivo


class Inscricao(models.Model):
    """Inscrições/Pré-matrículas"""
    id_inscricao = models.AutoField(primary_key=True)
    data_inscricao = models.DateField(auto_now_add=True, verbose_name='Data de Inscrição')
    nome_candidato = models.CharField(max_length=150, null=True, blank=True, verbose_name='Nome do Candidato')
    documento_candidato = models.JSONField(null=True, blank=True, verbose_name='Documento')
    resultado_avaliacao = models.CharField(max_length=80, null=True, blank=True, verbose_name='Resultado')
    
    class Meta:
        db_table = 'inscricao'
        verbose_name = 'Inscrição'
        verbose_name_plural = 'Inscrições'
        ordering = ['-data_inscricao']
    
    def __str__(self):
        return f"Inscrição {self.id_inscricao} - {self.nome_candidato}"


class Matricula(models.Model):
    """Matrículas definitivas"""
    id_matricula = models.AutoField(primary_key=True)
    id_aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, verbose_name='Aluno')
    id_turma = models.ForeignKey(
        Turma,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Turma'
    )
    ano_lectivo = models.ForeignKey(
        AnoLectivo,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name='Ano Lectivo'
    )
    data_matricula = models.DateField(auto_now_add=True, verbose_name='Data de Matrícula')
    ativo = models.BooleanField(default=True, verbose_name='Ativo')
    
    class Meta:
        db_table = 'matricula'
        verbose_name = 'Matrícula'
        verbose_name_plural = 'Matrículas'
        ordering = ['-data_matricula']
    
    def __str__(self):
        return f"Matrícula {self.id_matricula} - {self.id_aluno.nome_completo}"

    def clean(self):
        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo selecionado está encerrado. Não são permitidas alterações.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo selecionado está encerrado. Não é possível excluir.")
        super().delete(*args, **kwargs)
