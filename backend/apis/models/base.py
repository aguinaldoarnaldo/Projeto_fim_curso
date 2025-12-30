from django.db import models


class BaseModel(models.Model):
    """Modelo abstrato base com campos comuns de auditoria"""
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
    class Meta:
        abstract = True
