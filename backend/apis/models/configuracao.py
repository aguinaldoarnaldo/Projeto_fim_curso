from django.db import models

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
    nome_escola = models.CharField(max_length=255, default="Sistema de Gestão Escolar", verbose_name="Nome da Escola")
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

    def delete(self, *args, **kwargs):
        pass # Impedir exclusão

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Configuração Global Do Sistema"
