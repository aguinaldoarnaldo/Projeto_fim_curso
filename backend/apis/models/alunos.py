from django.db import models
from django.contrib.auth.hashers import make_password
from .base import BaseModel
from .academico import Turma
from ..utils.image_processing import process_image


class Aluno(BaseModel):
    """Alunos do sistema"""
    
    GENERO_CHOICES = [
        ('F', 'Feminino'),
        ('M', 'Masculino'),
    ]
     
    STATUS_CHOICES = [
        ('Ativo', 'Ativo'),
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
    telefone = models.CharField(max_length=10, verbose_name='Telefone')
    provincia_residencia = models.CharField(max_length=100, null=True, blank=True)
    municipio_residencia = models.CharField(max_length=100, null=True, blank=True)
    bairro_residencia = models.CharField(max_length=100, null=True, blank=True)
    numero_casa = models.CharField(max_length=100, null=True, blank=True)
    senha_hash = models.CharField(max_length=255, verbose_name='Senha', null=True, blank=True)
    genero = models.CharField(max_length=1, choices=GENERO_CHOICES, null=True, blank=True)
    status_aluno = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Ativo', verbose_name='Estado')
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
        return f"{self.nome_completo}"
    
    def save(self, *args, **kwargs):
        # --- Regra: Estados finais não bloqueiam dados pessoais ---
        # Permite editar dados pessoais mesmo em estados finais, mas bloqueia alterações académicas (Turma).
        ESTADOS_FINAIS = {'Concluido', 'Transferido', 'Inativo'}
        if self.pk:
            from django.core.exceptions import ValidationError
            try:
                old = Aluno.objects.values('status_aluno', 'id_turma_id').get(pk=self.pk)
                estado_anterior = old.get('status_aluno')
                turma_anterior_id = old.get('id_turma_id')

                # 1) Se o aluno estiver num estado final e o estado não estiver a mudar,
                #    bloquear apenas mudança de turma (académico).
                if estado_anterior in ESTADOS_FINAIS and self.status_aluno == estado_anterior:
                    if self.id_turma_id != turma_anterior_id:
                        raise ValidationError(
                            f"O aluno encontra-se com o estado '{estado_anterior}'. "
                            f"Não é permitido alterar a Turma/Dados Académicos neste estado."
                        )

                # 2) Se o ano lectivo da turma anterior estiver encerrado, também não permite mudar a turma,
                # EXCETO se a nova turma pertencer a um ano lectivo ativo (Progressão/Confirmação).
                if turma_anterior_id:
                    from .academico import Turma
                    turma_old = Turma.objects.select_related('ano_lectivo').filter(pk=turma_anterior_id).first()
                    if turma_old and turma_old.ano_lectivo and not turma_old.ano_lectivo.activo:
                        if self.id_turma_id != turma_anterior_id:
                            # Verificar se a nova turma pertence a um ano ativo
                            turma_new = Turma.objects.select_related('ano_lectivo').filter(pk=self.id_turma_id).first()
                            if not (turma_new and turma_new.ano_lectivo and turma_new.ano_lectivo.activo):
                                raise ValidationError(
                                    f"O Ano Lectivo '{turma_old.ano_lectivo.nome}' está encerrado. "
                                    f"Não é permitido alterar a Turma/Dados Académicos do aluno nesse ciclo."
                                )
            except Aluno.DoesNotExist:
                pass  # Novo registo, nada a validar

        # Se a senha não estiver criptografada
        if self.senha_hash and not self.senha_hash.startswith('pbkdf2_sha256$'):
            self.senha_hash = make_password(self.senha_hash)

        # --- Otimização de Imagem ---
        # Se houver uma nova imagem sendo enviada
        if self.img_path:
            # Verificar se a imagem mudou ou é nova
            try:
                old_instance = Aluno.objects.get(pk=self.pk) if self.pk else None
                if not old_instance or old_instance.img_path != self.img_path:
                    process_image(self.img_path, max_width=400, max_height=400, quality=80)
            except Aluno.DoesNotExist:
                process_image(self.img_path, max_width=400, max_height=400, quality=80)

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
