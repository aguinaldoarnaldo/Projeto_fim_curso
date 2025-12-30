from django.db import models
from .base import BaseModel


class Cargo(BaseModel):
    """Cargos de funcionários"""
    id_cargo = models.AutoField(primary_key=True)
    nome_cargo = models.CharField(max_length=100, unique=True, verbose_name='Nome do Cargo')
    
    class Meta:
        db_table = 'cargo'
        verbose_name = 'Cargo'
        verbose_name_plural = 'Cargos'
        ordering = ['nome_cargo']
    
    def __str__(self):
        return self.nome_cargo


class Funcionario(BaseModel):
    """Funcionários do sistema (Professores, Secretários, Administradores)"""
    
    GENERO_CHOICES = [
        ('F', 'Feminino'),
        ('M', 'Masculino'),
    ]
    
    STATUS_CHOICES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
        ('Demitido', 'Demitido'),
        ('Banido', 'Banido'),
    ]
    
    id_funcionario = models.AutoField(primary_key=True)
    numero_bi = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name='Número do BI')
    codigo_identificacao = models.CharField(max_length=50, unique=True, verbose_name='Código de Identificação')
    nome_completo = models.CharField(max_length=150, verbose_name='Nome Completo')
    id_cargo = models.ForeignKey(Cargo, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Cargo')
    genero = models.CharField(max_length=1, choices=GENERO_CHOICES, null=True, blank=True)
    email = models.EmailField(max_length=150, unique=True, null=True, blank=True)
    telefone = models.CharField(max_length=30, null=True, blank=True)
    provincia_residencia = models.CharField(max_length=100, null=True, blank=True, verbose_name='Província')
    municipio_residencia = models.CharField(max_length=100, null=True, blank=True, verbose_name='Município')
    bairro_residencia = models.CharField(max_length=100, null=True, blank=True, verbose_name='Bairro')
    senha_hash = models.CharField(max_length=255, verbose_name='Senha')
    status_funcionario = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Activo', verbose_name='Status')
    descricao = models.TextField(null=True, blank=True)
    data_admissao = models.DateField(null=True, blank=True, verbose_name='Data de Admissão')
    is_online = models.BooleanField(default=False, verbose_name='Online')
    img_path = models.TextField(null=True, blank=True, verbose_name='Foto')
    
    class Meta:
        db_table = 'funcionario'
        verbose_name = 'Funcionário'
        verbose_name_plural = 'Funcionários'
        ordering = ['nome_completo']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['id_cargo']),
        ]
    
    def __str__(self):
        return f"{self.nome_completo} - {self.codigo_identificacao}"


class Encarregado(BaseModel):
    """Responsáveis pelos alunos (Pais/Tutores)"""
    id_encarregado = models.AutoField(primary_key=True)
    nome_completo = models.CharField(max_length=150, verbose_name='Nome Completo')
    email = models.EmailField(max_length=150, unique=True, null=True, blank=True)
    telefone = models.JSONField(default=list, verbose_name='Telefones')
    provincia_residencia = models.CharField(max_length=100, null=True, blank=True)
    municipio_residencia = models.CharField(max_length=100, null=True, blank=True)
    bairro_residencia = models.CharField(max_length=100, null=True, blank=True)
    numero_casa = models.CharField(max_length=100, null=True, blank=True)
    senha_hash = models.CharField(max_length=255, verbose_name='Senha')
    img_path = models.TextField(null=True, blank=True, verbose_name='Foto')
    is_online = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'encarregado'
        verbose_name = 'Encarregado'
        verbose_name_plural = 'Encarregados'
        ordering = ['nome_completo']
        indexes = [
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return self.nome_completo


class CargoFuncionario(models.Model):
    """Histórico de cargos dos funcionários"""
    id_cargo_funcionario = models.AutoField(primary_key=True)
    id_cargo = models.ForeignKey(Cargo, on_delete=models.CASCADE, verbose_name='Cargo')
    id_funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, verbose_name='Funcionário')
    data_inicio = models.DateField(null=True, blank=True, verbose_name='Data de Início')
    data_fim = models.DateField(null=True, blank=True, verbose_name='Data de Fim')
    
    class Meta:
        db_table = 'cargo_funcionario'
        verbose_name = 'Cargo-Funcionário'
        verbose_name_plural = 'Cargos-Funcionários'
        ordering = ['-data_inicio']
    
    def __str__(self):
        return f"{self.id_funcionario.nome_completo} - {self.id_cargo.nome_cargo}"
