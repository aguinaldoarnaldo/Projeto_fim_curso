from django.db import models
from django.contrib.auth.hashers import make_password
from .base import BaseModel
from .academico import Turma


class Aluno(BaseModel):
    """Alunos do sistema"""
    
    GENERO_CHOICES = [
        ('F', 'Feminino'),
        ('M', 'Masculino'),
    ]
     
    STATUS_CHOICES = [
        ('Activo', 'Activo'),
        ('Inativo', 'Inativo'),
        ('Transferido', 'Transferido'),
        ('Concluido', 'Concluído'),
    ]
    
    id_aluno = models.AutoField(primary_key=True)
    numero_bi = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name='Número do BI')
    nome_completo = models.CharField(max_length=150, verbose_name='Nome Completo')
    data_nascimento = models.DateField(null=True, blank=True, verbose_name='Data de Nascimento')
    nacionalidade = models.CharField(max_length=50, default='Angolana', verbose_name='Nacionalidade')
    naturalidade = models.CharField(max_length=100, null=True, blank=True, verbose_name='Naturalidade')
    deficiencia = models.CharField(max_length=3, choices=[('Sim', 'Sim'), ('Não', 'Não')], default='Não', verbose_name='Deficiência')
    email = models.EmailField(max_length=250, unique=True, null=True, blank=True)
    numero_matricula = models.BigIntegerField(unique=True, null=True, blank=True, verbose_name='Número de Matrícula')
    telefone = models.CharField(max_length=10, verbose_name='Telefone')
    provincia_residencia = models.CharField(max_length=100, null=True, blank=True)
    municipio_residencia = models.CharField(max_length=100, null=True, blank=True)
    bairro_residencia = models.CharField(max_length=100, null=True, blank=True)
    numero_casa = models.CharField(max_length=100, null=True, blank=True)
    senha_hash = models.CharField(max_length=255, verbose_name='Senha', null=True, blank=True)
    genero = models.CharField(max_length=1, choices=GENERO_CHOICES, null=True, blank=True)
    status_aluno = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Activo', verbose_name='Estado')
    modo_user = models.CharField(max_length=20, default='Inativo', verbose_name='Modo Usuário')
    id_turma = models.ForeignKey(Turma, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Turma')
    img_path = models.ImageField(upload_to="image/alunos/", verbose_name="Foto do Aluno", null=True, blank=True)
    is_online = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'aluno'
        verbose_name = 'Aluno'
        verbose_name_plural = 'Alunos'
        ordering = ['nome_completo']
        indexes = [
            models.Index(fields=['status_aluno']),
            models.Index(fields=['id_turma']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.nome_completo} - {self.numero_matricula}"

    def save(self, *args, **kwargs):
        # Gerar número de matrícula se não existir
        if not self.numero_matricula:
            import datetime
            year = datetime.datetime.now().year
            start_range = year * 10000
            end_range = (year + 1) * 10000
            
            # Pegar o último número do ano atual para evitar conflitos
            last = Aluno.objects.filter(
                numero_matricula__gte=start_range,
                numero_matricula__lt=end_range
            ).order_by('-numero_matricula').first()
            
            if last and last.numero_matricula:
                self.numero_matricula = last.numero_matricula + 1
            else:
                self.numero_matricula = start_range + 1

        # Se a senha não estiver criptografada
        if self.senha_hash and not self.senha_hash.startswith('pbkdf2_sha256$'):
            self.senha_hash = make_password(self.senha_hash)
        super(Aluno, self).save(*args, **kwargs)


class AlunoEncarregado(models.Model):
    """Relacionamento entre Aluno e Encarregado"""
    from .usuarios import Encarregado
    
    id_aluno_encarregado = models.AutoField(primary_key=True)
    id_aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, verbose_name='Aluno')
    id_encarregado = models.ForeignKey(Encarregado, on_delete=models.CASCADE, verbose_name='Encarregado')
    grau_parentesco = models.CharField(max_length=80, null=True, blank=True, verbose_name='Grau de Parentesco')
    
    class Meta:
        db_table = 'aluno_encarregado'
        verbose_name = 'Aluno-Encarregado'
        verbose_name_plural = 'Alunos-Encarregados'
        unique_together = ['id_aluno', 'id_encarregado']
    
    def __str__(self):
        return f"{self.id_aluno.nome_completo} - {self.id_encarregado.nome_completo}"
