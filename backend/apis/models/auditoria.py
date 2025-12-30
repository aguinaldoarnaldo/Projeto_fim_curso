from django.db import models
from .usuarios import Funcionario, Encarregado
from .alunos import Aluno


class Historico(models.Model):
    """Histórico de ações do sistema"""
    id_historico = models.AutoField(primary_key=True)
    id_funcionario = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Funcionário'
    )
    id_aluno = models.ForeignKey(
        Aluno,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Aluno'
    )
    tipo_accao = models.CharField(max_length=50, verbose_name='Tipo de Ação')
    dados_anteriores = models.JSONField(null=True, blank=True, verbose_name='Dados Anteriores')
    dados_novos = models.JSONField(null=True, blank=True, verbose_name='Dados Novos')
    data_hora = models.DateTimeField(auto_now_add=True, verbose_name='Data/Hora')
    
    class Meta:
        db_table = 'historico'
        verbose_name = 'Histórico'
        verbose_name_plural = 'Históricos'
        ordering = ['-data_hora']
        indexes = [
            models.Index(fields=['data_hora']),
        ]
    
    def __str__(self):
        return f"{self.tipo_accao} - {self.data_hora}"


class HistoricoLogin(models.Model):
    """Histórico de logins"""
    id_historico_login = models.AutoField(primary_key=True)
    id_funcionario = models.ForeignKey(
        Funcionario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Funcionário'
    )
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
    ip_usuario = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP')
    dispositivo = models.CharField(max_length=150, null=True, blank=True, verbose_name='Dispositivo')
    navegador = models.CharField(max_length=150, null=True, blank=True, verbose_name='Navegador')
    hora_entrada = models.DateTimeField(auto_now_add=True, verbose_name='Hora de Entrada')
    hora_saida = models.DateTimeField(null=True, blank=True, verbose_name='Hora de Saída')
    
    class Meta:
        db_table = 'historico_login'
        verbose_name = 'Histórico de Login'
        verbose_name_plural = 'Históricos de Login'
        ordering = ['-hora_entrada']
    
    def __str__(self):
        return f"Login {self.id_historico_login} - {self.hora_entrada}"
