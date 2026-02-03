from django.db import models

class Notificacao(models.Model):
    """Notificações do sistema"""
    TIPO_CHOICES = [
        ('info', 'Informação'),
        ('warning', 'Aviso'),
        ('error', 'Erro'),
        ('success', 'Sucesso'),
    ]

    id_notificacao = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=255, verbose_name='Título')
    mensagem = models.TextField(verbose_name='Mensagem')
    lida = models.BooleanField(default=False, verbose_name='Lida?')
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='info', verbose_name='Tipo')
    link = models.CharField(max_length=255, null=True, blank=True, verbose_name='Link de Ação')

    class Meta:
        db_table = 'notificacao'
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        ordering = ['-data_criacao']

    def __str__(self):
        return f"{self.titulo} - {self.data_criacao}"
