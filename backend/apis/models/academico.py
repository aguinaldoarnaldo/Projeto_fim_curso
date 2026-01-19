from django.db import models
from .base import BaseModel
from .usuarios import Funcionario
import datetime

class Sala(BaseModel):
    """Salas de aula"""
    id_sala = models.AutoField(primary_key=True)
    numero_sala = models.SmallIntegerField(verbose_name='Número da Sala')
    capacidade_alunos = models.IntegerField(verbose_name='Capacidade')
    bloco = models.CharField(max_length=50, verbose_name='Bloco', null=True, blank=True, default='')

    
    class Meta:
        db_table = 'sala'
        verbose_name = 'Sala'
        verbose_name_plural = 'Salas'
        ordering = ['numero_sala']
    
    def __str__(self):
        return f"Sala {self.numero_sala}"


class Classe(models.Model):
    """Níveis/Anos escolares"""
    id_classe = models.AutoField(primary_key=True)
    nivel = models.SmallIntegerField(verbose_name='Nível')
    descricao = models.CharField(max_length=80, null=True, blank=True)
    
    class Meta:
        db_table = 'classe'
        verbose_name = 'Classe'
        verbose_name_plural = 'Classes'
        ordering = ['nivel']
    
    def __str__(self):
        return f"{self.nivel}ª Classe"


class Departamento(models.Model):
    """Departamentos da instituição"""
    id_departamento = models.AutoField(primary_key=True)
    nome_departamento = models.CharField(max_length=150, verbose_name='Nome do Departamento')
    chefe_id_funcionario = models.ForeignKey(
        Funcionario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='departamentos_chefiados',
        verbose_name='Chefe'
    )
    
    class Meta:
        db_table = 'departamento'
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'
        ordering = ['nome_departamento']
    
    def __str__(self):
        return self.nome_departamento


class Seccao(models.Model):
    """Seções dentro dos departamentos"""
    id_seccao = models.AutoField(primary_key=True)
    nome_seccao = models.CharField(max_length=150, verbose_name='Nome da Seção')
    id_departamento = models.ForeignKey(
        Departamento, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name='Departamento'
    )
    
    class Meta:
        db_table = 'seccao'
        verbose_name = 'Seção'
        verbose_name_plural = 'Seções'
        ordering = ['nome_seccao']
    
    def __str__(self):
        return self.nome_seccao


class AreaFormacao(BaseModel):
    """Áreas de formação dos cursos"""
    id_area_formacao = models.AutoField(primary_key=True)
    nome_area = models.CharField(max_length=150, verbose_name='Nome da Área')
    id_responsavel = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='areas_coordenadas',
        verbose_name='Responsável'
    )
    
    class Meta:
        db_table = 'area_formacao'
        verbose_name = 'Área de Formação'
        verbose_name_plural = 'Áreas de Formação'
        ordering = ['nome_area']
    
    def __str__(self):
        return self.nome_area


class Curso(BaseModel):
    """Cursos oferecidos"""
    id_curso = models.AutoField(primary_key=True)
    nome_curso = models.CharField(max_length=150, verbose_name='Nome do Curso')
    id_area_formacao = models.ForeignKey(
        AreaFormacao,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Área de Formação'
    )
    duracao = models.IntegerField(null=True, blank=True, verbose_name='Duração (Anos)',default=4)
    id_responsavel = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cursos_coordenados',
        verbose_name='Coordenador'
    )
    
    class Meta:
        db_table = 'curso'
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'
        ordering = ['nome_curso']
    
    def __str__(self):
        return self.nome_curso


class Periodo(models.Model):
    """Períodos de aula (Manhã, Tarde, Noite)"""
    
    PERIODO_CHOICES = [
        ('Manhã', 'Manhã'),
        ('Tarde', 'Tarde'),
        ('Noite', 'Noite'),
    ]
    
    id_periodo = models.AutoField(primary_key=True)
    periodo = models.CharField(max_length=10, choices=PERIODO_CHOICES)
    id_responsavel = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='periodos_responsaveis',
        verbose_name='Responsável'
    )
    
    class Meta:
        db_table = 'periodo'
        verbose_name = 'Período'
        verbose_name_plural = 'Períodos'
    
    def __str__(self):
        return self.periodo


class Turma(BaseModel):
    """Turmas de alunos"""
    id_turma = models.AutoField(primary_key=True)
    id_sala = models.ForeignKey(Sala, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Sala')
    id_curso = models.ForeignKey(Curso, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Curso')
    id_classe = models.ForeignKey(Classe, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Classe')
    id_periodo = models.ForeignKey(Periodo, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Período')
    ano = models.CharField(null=True, blank=True, verbose_name='Ano',default=f"{str(datetime.date.year)}")
    codigo_turma = models.CharField(max_length=50, unique=True, verbose_name='Código da Turma')
    id_responsavel = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='turmas_responsaveis',
        verbose_name='Responsável'
    )
    
    class Meta:
        db_table = 'turma'
        verbose_name = 'Turma'
        verbose_name_plural = 'Turmas'
        ordering = ['codigo_turma']
    
    def save(self, *args, **kwargs):
        if self.id_sala and self.id_curso and self.id_classe and self.id_periodo and self.ano:
            sala = str(self.id_sala.numero_sala)
            curso = self.id_curso.nome_curso[:2].upper()
            classe = str(self.id_classe.nivel)
            periodo = self.id_periodo.periodo[0].upper()
            ano = str(self.ano)[-2:]
            
            self.codigo_turma = f"{sala}{curso}{classe}{periodo}{ano}"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.codigo_turma
