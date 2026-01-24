from django.db import models
from .alunos import Aluno
from .academico import AnoLectivo

class HistoricoEscolar(models.Model):
    """
    Registra o histórico de alunos transferidos ou histórico de anos anteriores.
    """
    id_historico = models.AutoField(primary_key=True)
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='historico_escolar', verbose_name='Aluno')
    escola_origem = models.CharField(max_length=200, verbose_name='Escola de Origem')
    ano_lectivo = models.CharField(max_length=20, verbose_name='Ano Lectivo')
    classe = models.CharField(max_length=50, verbose_name='Classe Concluída')
    turma_origem = models.CharField(max_length=50, null=True, blank=True, verbose_name='Turma Original')
    numero_processo_origem = models.CharField(max_length=50, null=True, blank=True, verbose_name='Nº Processo Anterior')
    media_final = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, verbose_name='Média Final')
    observacoes = models.TextField(null=True, blank=True, verbose_name='Observações')
    
    # Se quiser anexar um PDF/Imagem do certificado ou declaração
    documento = models.FileField(upload_to="documentos/historico_escolar/", null=True, blank=True, verbose_name="Comprovativo")
    
    criado_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'historico_escolar'
        verbose_name = 'Histórico Escolar'
        verbose_name_plural = 'Históricos Escolares'
        ordering = ['-ano_lectivo']
        
    def __str__(self):
        return f"{self.aluno.nome_completo} - {self.classe} ({self.ano_lectivo})"
