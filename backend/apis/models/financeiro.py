from django.db import models
from django.core.exceptions import ValidationError
from .base import BaseModel
from .alunos import Aluno
from .alunos import Aluno
from .usuarios import Funcionario
from .academico import AnoLectivo


class Fatura(BaseModel):
    """Faturas dos alunos"""
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('paga', 'Paga'),
        ('cancelada', 'Cancelada'),
    ]
    
    id_fatura = models.AutoField(primary_key=True)
    id_aluno = models.ForeignKey(
        Aluno,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name='Aluno'
    )
    ano_lectivo = models.ForeignKey(
        AnoLectivo,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name='Ano Lectivo'
    )
    descricao = models.CharField(max_length=255, verbose_name='Descrição')
    total = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Total')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente', verbose_name='Status')
    data_vencimento = models.DateField(null=True, blank=True, verbose_name='Data de Vencimento')
    data_pagamento = models.DateField(null=True, blank=True, verbose_name='Data de Pagamento')
    
    class Meta:
        db_table = 'fatura'
        verbose_name = 'Fatura'
        verbose_name_plural = 'Faturas'
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['id_aluno']),
        ]
    
    def __str__(self):
        return f"Fatura {self.id_fatura} - {self.descricao}"

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


class Pagamento(BaseModel):
    """Pagamentos realizados"""
    id_pagamento = models.AutoField(primary_key=True)
    id_fatura = models.ForeignKey(Fatura, on_delete=models.CASCADE, verbose_name='Fatura')
    valor_pago = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Valor Pago')
    metodo_pagamento = models.CharField(max_length=80, null=True, blank=True, verbose_name='Método de Pagamento')
    comprovante_path = models.TextField(null=True, blank=True, verbose_name='Comprovante')
    id_recebedor = models.ForeignKey(
        Funcionario,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='pagamentos_recebidos',
        verbose_name='Recebedor'
    )
    
    class Meta:
        db_table = 'pagamento'
        verbose_name = 'Pagamento'
        verbose_name_plural = 'Pagamentos'
        ordering = ['-criado_em']
    
    def __str__(self):
        return f"Pagamento {self.id_pagamento} - {self.valor_pago} Kz"
