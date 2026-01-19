from django.db import models
import uuid
from .usuarios import Funcionario
from .alunos import Aluno
from .usuarios import Encarregado


class Documento(models.Model):
    TIPO_DOCUMENTO_CHOICES=[
        ('DECLARAÇÃO','DECLARAÇÃO'),
        ('BOLETIM','BOLETIM'),
        ('CERTIFICADO','CERTIFICADO'),
    ]
    """Documentos gerados (PDFs)"""
    id_documento = models.AutoField(primary_key=True)
    id_aluno = models.ForeignKey(
        Aluno,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Aluno'
    )
    tipo_documento = models.CharField(max_length=100,choices=TIPO_DOCUMENTO_CHOICES, verbose_name='Tipo de Documento')
    caminho_pdf = models.FileField(upload_to="documentos/documents/pdfs/")
    #models.TextField(null=True, blank=True, verbose_name='Caminho do PDF')
    #imagem_carimbo = models.TextField(null=True, blank=True, verbose_name='Carimbo/Assinatura')
    uuid_documento = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, verbose_name='CÓDIGO ÚNICO DO DOCUMENTO')
    criado_por = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_criados',
        verbose_name='Criado por'
    )
    data_emissao = models.DateTimeField(auto_now_add=True, verbose_name='Data de Emissão')
    
    class Meta:
        db_table = 'documento'
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering = ['-data_emissao']
        indexes = [
            models.Index(fields=['id_aluno']),
            models.Index(fields=['uuid_documento']),
        ]
    
    def __str__(self):
        return f"{self.tipo_documento} - {self.uuid_documento}"


class SolicitacaoDocumento(models.Model):
    """Solicitações de documentos"""
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aprovado', 'Aprovado'),
        ('rejeitado', 'Rejeitado'),
        ('pago', 'Pago'),
    ]
    
    id_solicitacao = models.AutoField(primary_key=True)
    id_aluno = models.ForeignKey(
        Aluno,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Aluno'
    )
    id_encarregado = models.ForeignKey(
        Encarregado,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Encarregado'
    )
    id_funcionario = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitacoes_gerenciadas',
        verbose_name='Funcionário Responsável'
    )
    tipo_documento = models.CharField(max_length=100, verbose_name='Tipo de Documento')
    status_solicitacao = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pendente',
        verbose_name='Status'
    )
    caminho_arquivo = models.TextField(null=True, blank=True, verbose_name='Arquivo Gerado')
    uuid_documento = models.UUIDField(null=True, blank=True, verbose_name='UUID do Documento')
    data_solicitacao = models.DateTimeField(auto_now_add=True, verbose_name='Data da Solicitação')
    data_aprovacao = models.DateTimeField(null=True, blank=True, verbose_name='Data de Aprovação')
    
    class Meta:
        db_table = 'solicitacao_documento'
        verbose_name = 'Solicitação de Documento'
        verbose_name_plural = 'Solicitações de Documentos'
        ordering = ['-data_solicitacao']
        indexes = [
            models.Index(fields=['status_solicitacao']),
            models.Index(fields=['id_aluno']),
        ]
    
    def __str__(self):
        return f"{self.tipo_documento} - {self.status_solicitacao}"
