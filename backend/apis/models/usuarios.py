from django.db import models
from .base import BaseModel
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User


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


class Usuario(BaseModel):
    """
    Usuário do Sistema (Login e Permissões).
    Agora atua como PERFIL estendido do User nativo.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='profile', verbose_name='Auth User')
    id_usuario = models.AutoField(primary_key=True)
    nome_completo = models.CharField(max_length=150, verbose_name='Nome Completo')
    email = models.EmailField(max_length=150, unique=True, verbose_name='Email')
    senha_hash = models.CharField(max_length=255, verbose_name='Senha')
    
    # Controle de Acesso
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    is_superuser = models.BooleanField(default=False, verbose_name='Superusuário')
    permissoes = models.JSONField(default=list, blank=True, verbose_name='Permissões')
    papel = models.CharField(max_length=50, default='Comum', verbose_name='Papel/Role') # Admin, Comum
    
    # Cargo no sistema (RBAC baseado em Cargo)
    cargo = models.ForeignKey('Cargo', on_delete=models.PROTECT, null=True, blank=True, verbose_name='Cargo/Função')

    # Flag para saber se é funcionário (opcional, pode ser inferido pelo relacionamento)
    is_funcionario = models.BooleanField(default=False)
    
    # Novos campos para perfil completo
    telefone = models.CharField(max_length=30, null=True, blank=True, verbose_name='Telefone')
    bairro_residencia = models.CharField(max_length=100, null=True, blank=True, verbose_name='Bairro/Cidade')
    
    img_path = models.ImageField(upload_to="image/usuarios/images/", null=True, blank=True, verbose_name='Foto')
    is_online = models.BooleanField(default=False, verbose_name='Online')

    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['nome_completo']

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if self.senha_hash and not self.senha_hash.startswith('pbkdf2_sha256$'):
            self.senha_hash = make_password(self.senha_hash)
        super(Usuario, self).save(*args, **kwargs)


class Funcionario(BaseModel):
    """Funcionários do sistema (Professores, Secretários, Administradores)"""
    # Link com Usuário do Sistema (Opcional, pois pode existir funcionário sem acesso ao sistema, ou vice-versa)
    usuario = models.OneToOneField(Usuario, on_delete=models.PROTECT, null=True, blank=True, related_name='funcionario_perfil', verbose_name='Usuário de Sistema')
    
    
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
    id_cargo = models.ForeignKey(Cargo, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Cargo')
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
    img_path = models.ImageField(upload_to="image/funcionario/images/",null=True, blank=True, verbose_name='Foto')
    permissoes_adicionais = models.JSONField(default=list, blank=True, verbose_name='Permissões Adicionais')
    
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

    @property
    def is_staff(self):
        """Allows access to admin sites and IsAdminUser permission"""
        return True 

    @property
    def is_superuser(self):
        """Allows all permissions"""
    @property
    def is_superuser(self):
        """Allows all permissions"""
        if self.id_cargo:
             cargo = self.id_cargo.nome_cargo.lower()
             if any(role in cargo for role in ['diretor', 'administrador', 'admin', 'coordenador']):
                 return True
        return False
    
    @property
    def is_active(self):
        return self.status_funcionario == 'Activo'

    def save(self, *args, **kwargs):
        # Se a senha não estiver criptografada (não começa com o prefixo padrão do Django)
        if self.senha_hash and not self.senha_hash.startswith('pbkdf2_sha256$'):
            self.senha_hash = make_password(self.senha_hash)
        super(Funcionario, self).save(*args, **kwargs)


class Encarregado(BaseModel):
    """Responsáveis pelos alunos (Pais/Tutores)"""
    id_encarregado = models.AutoField(primary_key=True)
    nome_completo = models.CharField(max_length=150, verbose_name='Nome Completo')
    numero_bi = models.CharField(max_length=20, null=True, blank=True, verbose_name='Número do BI')
    profissao = models.CharField(max_length=100, null=True, blank=True, verbose_name='Profissão')
    email = models.EmailField(max_length=150, unique=True, null=True, blank=True)
    telefone = models.JSONField(default=list, verbose_name='Telefones')
    provincia_residencia = models.CharField(max_length=100, null=True, blank=True)
    municipio_residencia = models.CharField(max_length=100, null=True, blank=True)
    bairro_residencia = models.CharField(max_length=100, null=True, blank=True)
    numero_casa = models.CharField(max_length=100, null=True, blank=True)
    senha_hash = models.CharField(max_length=255, verbose_name='Senha')
    img_path = models.ImageField(upload_to="image/encarregados/images/",null=True, blank=True, verbose_name='Foto')

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

    def save(self, *args, **kwargs):
        # Se a senha não estiver criptografada
        if self.senha_hash and not self.senha_hash.startswith('pbkdf2_sha256$'):
            self.senha_hash = make_password(self.senha_hash)
        super(Encarregado, self).save(*args, **kwargs)


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
