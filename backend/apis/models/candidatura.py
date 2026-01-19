from django.db import models
from .base import BaseModel
from .academico import Curso, Sala
import uuid

class Candidato(BaseModel):
    """Candidatos inscritos no processo de admissão"""
    
    STATUS_CHOICES = [
        ('Pendente', 'Pendente'),
        ('Confirmado', 'Confirmado'), # Dados confirmados pelo candidato
        ('Pago', 'Pago'), # RUPE pago
        ('Agendado', 'Agendado'), # Exame agendado
        ('Aprovado', 'Aprovado'),
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
    residencia = models.CharField(max_length=200)
    telefone = models.CharField(max_length=30)
    email = models.EmailField(null=True, blank=True)
    
    # Dados Academicos (9a classe)
    escola_proveniencia = models.CharField(max_length=150)
    municipio_escola = models.CharField(max_length=100)
    ano_conclusao = models.IntegerField()
    media_final = models.DecimalField(max_digits=4, decimal_places=2)
    
    # Opcoes de Curso
    curso_primeira_opcao = models.ForeignKey(Curso, on_delete=models.SET_NULL, null=True, related_name='candidatos_opcao1')
    curso_segunda_opcao = models.ForeignKey(Curso, on_delete=models.SET_NULL, null=True, blank=True, related_name='candidatos_opcao2')
    turno_preferencial = models.CharField(max_length=20, choices=[('Manhã', 'Manhã'), ('Tarde', 'Tarde'), ('Noite', 'Noite')])
    
    # Documentos
    foto_passe = models.ImageField(upload_to='candidatos/fotos/', null=True, blank=True)
    comprovativo_bi = models.FileField(upload_to='candidatos/bi/', null=True, blank=True) # PDF ou Imagem
    certificado = models.FileField(upload_to='candidatos/certificados/', null=True, blank=True)
    
    # Encarregado
    nome_encarregado = models.CharField(max_length=150)
    parentesco_encarregado = models.CharField(max_length=50)
    telefone_encarregado = models.CharField(max_length=30)
    
    # Estado
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pendente')
    
    def save(self, *args, **kwargs):
        if not self.numero_inscricao:
            import datetime
            year = datetime.datetime.now().year
            last = Candidato.objects.filter(numero_inscricao__startswith=f"INS{year}").count()
            self.numero_inscricao = f"INS{year}{str(last+1).zfill(4)}"
        super().save(*args, **kwargs)

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
    sala = models.ForeignKey(Sala, on_delete=models.SET_NULL, null=True)
    nota = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    realizado = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'exame_admissao'
        verbose_name = 'Exame de Admissão'
        
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
