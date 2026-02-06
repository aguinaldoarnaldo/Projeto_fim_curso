from django.db import models
from django.core.exceptions import ValidationError
from .base import BaseModel
from .base import BaseModel
from .academico import Curso, Sala, AnoLectivo
import uuid

class Candidato(BaseModel):
    """Candidatos inscritos no processo de admissão"""
    
    STATUS_CHOICES = [
        ('Pendente', 'Pendente'),
        ('Em Análise', 'Em Análise'),
        ('Confirmado', 'Confirmado'),
        ('Pago', 'Pago'),
        ('Agendado', 'Agendado'),
        ('Aprovado', 'Aprovado'),
        ('Não Admitido', 'Não Admitido'), 
        ('Reprovado', 'Reprovado'),
        ('Matriculado', 'Matriculado')
    ]

    GENERO_CHOICES = [('M', 'Masculino'), ('F', 'Feminino')]

    id_candidato = models.AutoField(primary_key=True)
    numero_inscricao = models.CharField(max_length=20, unique=True, editable=False)
    
    # Dados Pessoais
    nome_completo = models.CharField(max_length=150)
    genero = models.CharField(max_length=1, choices=GENERO_CHOICES)
    data_nascimento = models.DateField()
    numero_bi = models.CharField(max_length=20, unique=True)
    nacionalidade = models.CharField(max_length=50, default='Angolana')
    naturalidade = models.CharField(max_length=100, default='Luanda', verbose_name="Naturalidade (Local de Nascimento)")
    # Novo Campo
    deficiencia = models.CharField(max_length=3, choices=[('Sim', 'Sim'), ('Não', 'Não')], default='Não')
    provincia = models.CharField(max_length=100, null=True, blank=True)
    municipio = models.CharField(max_length=100, null=True, blank=True)
    residencia = models.CharField(max_length=200)
    telefone = models.CharField(max_length=30)
    email = models.EmailField(null=True, blank=True)
    
    # Dados Academicos (9a classe)
    tipo_escola = models.CharField(max_length=20, choices=[('Pública', 'Pública'), ('Privada', 'Privada')], default='Pública')
    escola_proveniencia = models.CharField(max_length=150)
    municipio_escola = models.CharField(max_length=100)
    ano_conclusao = models.IntegerField()
    media_final = models.DecimalField(max_digits=4, decimal_places=2)
    
    # Opcoes de Curso
    curso_primeira_opcao = models.ForeignKey(Curso, on_delete=models.PROTECT, null=True, related_name='candidatos_opcao1')
    curso_segunda_opcao = models.ForeignKey(Curso, on_delete=models.PROTECT, null=True, blank=True, related_name='candidatos_opcao2')
    turno_preferencial = models.CharField(max_length=20, choices=[('Manhã', 'Manhã'), ('Tarde', 'Tarde'), ('Noite', 'Noite')], null=True, blank=True)
    
    # Documentos
    foto_passe = models.ImageField(upload_to='candidatos/fotos/', null=True, blank=True)
    comprovativo_bi = models.FileField(upload_to='candidatos/bi/', null=True, blank=True) # PDF ou Imagem
    certificado = models.FileField(upload_to='candidatos/certificados/', null=True, blank=True)
    
    # Encarregado
    nome_encarregado = models.CharField(max_length=150)
    parentesco_encarregado = models.CharField(max_length=50)
    telefone_encarregado = models.CharField(max_length=30)
    telefone_alternativo_encarregado = models.CharField(max_length=30, null=True, blank=True)
    email_encarregado = models.EmailField(null=True, blank=True)
    numero_bi_encarregado = models.CharField(max_length=20, null=True, blank=True)
    profissao_encarregado = models.CharField(max_length=100, null=True, blank=True)
    residencia_encarregado = models.CharField(max_length=200, null=True, blank=True)
    
    # Ano Lectivo
    ano_lectivo = models.ForeignKey(
        AnoLectivo,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name='Ano Lectivo'
    )
    
    # Estado
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pendente')
    
    def save(self, *args, **kwargs):
        if not self.numero_inscricao:
            import datetime
            year = datetime.datetime.now().year
            
            # Find the last used number to avoid gaps/duplicates
            # We look for the last created entry for this year
            last_entry = Candidato.objects.filter(numero_inscricao__startswith=f"INS{year}").order_by('numero_inscricao').last()
            
            if last_entry:
                # Extract the sequence number from INS20250004 -> 0004
                try:
                    last_sequence = int(last_entry.numero_inscricao.replace(f"INS{year}", ""))
                    next_sequence = last_sequence + 1
                except ValueError:
                    # Fallback if manual entry messed up format
                    next_sequence = Candidato.objects.filter(numero_inscricao__startswith=f"INS{year}").count() + 1
            else:
                next_sequence = 1
            
            # Ensure uniqueness loop (just in case)
            while True:
                candidate_number = f"INS{year}{str(next_sequence).zfill(4)}"
                if not Candidato.objects.filter(numero_inscricao=candidate_number).exists():
                    self.numero_inscricao = candidate_number
                    break
                next_sequence += 1
                
        super().save(*args, **kwargs)

    def clean(self):
        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo selecionado está encerrado. Não são permitidas alterações.")

    def delete(self, *args, **kwargs):
        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo selecionado está encerrado. Não é possível excluir.")
        super().delete(*args, **kwargs)

    class Meta:
        db_table = 'candidato'
        verbose_name = 'Candidato'
        verbose_name_plural = 'Candidatos'
        ordering = ['-criado_em']

    def __str__(self):
        return f"{self.numero_inscricao} - {self.nome_completo}"


class ExameAdmissao(BaseModel):
    """Exames agendados para os candidatos"""
    id_exame = models.AutoField(primary_key=True)
    candidato = models.OneToOneField(Candidato, on_delete=models.CASCADE, related_name='exame')
    data_exame = models.DateTimeField()
    sala = models.ForeignKey(Sala, on_delete=models.PROTECT, null=True)
    nota = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    realizado = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'exame_admissao'
        verbose_name = 'Exame de Admissão'

    def clean(self):
        if self.candidato.ano_lectivo and not self.candidato.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo deste candidato está encerrado. Não são permitidas alterações.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.candidato.ano_lectivo and not self.candidato.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo deste candidato está encerrado. Não é possível excluir.")
        super().delete(*args, **kwargs)
        
class RupeCandidato(BaseModel):
    """Pagamento do RUPE de inscrição"""
    id_rupe = models.AutoField(primary_key=True)
    candidato = models.ForeignKey(Candidato, on_delete=models.CASCADE, related_name='rupes')
    referencia = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[('Pendente', 'Pendente'), ('Pago', 'Pago')], default='Pendente')
    data_pagamento = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'rupe_candidato'

    def clean(self):
        if self.candidato.ano_lectivo and not self.candidato.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo deste candidato está encerrado. Não são permitidas alterações.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.candidato.ano_lectivo and not self.candidato.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo deste candidato está encerrado. Não é possível excluir.")
        super().delete(*args, **kwargs)

class ListaEspera(BaseModel):
    """Candidatos em lista de espera"""
    candidato = models.OneToOneField(Candidato, on_delete=models.CASCADE, related_name='lista_espera')
    data_entrada = models.DateTimeField(auto_now_add=True)
    prioridade = models.IntegerField(default=0, help_text="Maior numero = maior prioridade")
    observacao = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('Aguardando', 'Aguardando'), ('Chamado', 'Chamado'), ('Expirado', 'Expirado')], default='Aguardando')
    
    class Meta:
        db_table = 'lista_espera'
        verbose_name = 'Lista de Espera'
        verbose_name_plural = 'Listas de Espera'
        ordering = ['-prioridade', 'data_entrada']
    
    def __str__(self):
        return f"Espera: {self.candidato.nome_completo}"

    def clean(self):
        if self.candidato.ano_lectivo and not self.candidato.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo deste candidato está encerrado. Não são permitidas alterações.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.candidato.ano_lectivo and not self.candidato.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo deste candidato está encerrado. Não é possível excluir.")
        super().delete(*args, **kwargs)
