from django.db import models
from django.core.cache import cache

class Configuracao(models.Model):
    """
    Modelo de configuração global do sistema (Singleton).
    Armazena flags e definições globais como o estado das candidaturas online.
    """
    id_config = models.AutoField(primary_key=True)
    candidaturas_abertas = models.BooleanField(default=True, verbose_name="Inscrições Online Abertas")
    mensagem_candidaturas_fechadas = models.TextField(
        default="As candidaturas estão encerradas no momento.", 
        verbose_name="Mensagem de Encerramento",
        blank=True
    )
    data_fim_candidatura = models.DateTimeField(
        null=True, blank=True, 
        verbose_name="Data de Término das Candidaturas"
    )
    fechamento_automatico = models.BooleanField(
        default=False, 
        verbose_name="Fechar Automaticamente no Limite"
    )
    nome_escola = models.CharField(max_length=200, default="Sistema Gestão de Matricula", verbose_name="Nome da Escola")
    logo = models.ImageField(upload_to='branding/', blank=True, null=True, verbose_name="Logotipo")
    
    # Outras configurações globais podem ser adicionadas aqui
    # ex: ano_lectivo_matricula_default = models.ForeignKey(...)

    class Meta:
        db_table = 'configuracao'
        verbose_name = 'Configuração do Sistema'
        verbose_name_plural = 'Configurações'

    def save(self, *args, **kwargs):
        self.pk = 1 # Garantir que sempre seja o ID 1 (Singleton)
        super(Configuracao, self).save(*args, **kwargs)
        # Limpar cache ao salvar
        cache.delete('global_config_solo')

    def delete(self, *args, **kwargs):
        pass # Impedir exclusão

    @classmethod
    def get_solo(cls):
        # Tentar recuperar do cache
        config = cache.get('global_config_solo')
        if not config:
            config, created = cls.objects.get_or_create(pk=1)
            # Cache por 1 hora (3600s)
            cache.set('global_config_solo', config, 3600)
        return config

    def __str__(self):
        return "Configuração Global Do Sistema"
