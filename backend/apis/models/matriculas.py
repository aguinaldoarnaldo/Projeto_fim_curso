from django.db import models
from django.core.exceptions import ValidationError
from .alunos import Aluno

from .academico import Turma, AnoLectivo


class Inscricao(models.Model):
    """Inscrições/Pré-matrículas"""
    id_inscricao = models.AutoField(primary_key=True)
    data_inscricao = models.DateField(auto_now_add=True, verbose_name='Data de Inscrição')
    nome_candidato = models.CharField(max_length=150, null=True, blank=True, verbose_name='Nome do Candidato')
    documento_candidato = models.JSONField(null=True, blank=True, verbose_name='Documento')
    resultado_avaliacao = models.CharField(max_length=80, null=True, blank=True, verbose_name='Resultado')
    
    class Meta:
        db_table = 'inscricao'
        verbose_name = 'Inscrição'
        verbose_name_plural = 'Inscrições'
        ordering = ['-data_inscricao']
    
    def __str__(self):
        return f"Inscrição {self.id_inscricao} - {self.nome_candidato}"


class Matricula(models.Model):
    """Matrículas definitivas"""
    id_matricula = models.AutoField(primary_key=True)
    id_aluno = models.ForeignKey(
        Aluno, 
        on_delete=models.CASCADE, 
        verbose_name='Nome Completo',
        help_text="Para alunos novos, use o menu 'Alunos > Adicionar' para registar dados pessoais e matrícula de uma só vez."
    )
    id_turma = models.ForeignKey(
        Turma,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name='Turma'
    )
    ano_lectivo = models.ForeignKey(
        AnoLectivo,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name='Ano Lectivo'
    )
    data_matricula = models.DateField(auto_now_add=True, verbose_name='Data de Matrícula')
    TIPO_MATRICULA = [
        ('Novo', 'Novo Ingresso'),
        ('Confirmacao', 'Confirmação'),
        ('Transferencia', 'Transferência'),
        ('Repetente', 'Repetente'),
        ('Reenquadramento', 'Reenquadramento')
    ]
    
    STATUS_MATRICULA = [
        ('Ativa', 'Ativa'),
        ('Confirmada', 'Confirmada'),
        ('Concluida', 'Concluída'),
        ('Desistente', 'Desistente'),
        ('Transferido', 'Transferido')
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_MATRICULA, default='Novo', verbose_name='Tipo de Matrícula')
    status = models.CharField(max_length=20, choices=STATUS_MATRICULA, default='Ativa', verbose_name='Estado')
    ativo = models.BooleanField(default=True, verbose_name='Ativo') # Mantendo para retrocompatibilidade
    
    doc_certificado = models.FileField(
        upload_to='matriculas/documentos/', 
        null=True, 
        blank=True, 
        verbose_name='Certificado/Declaração (PDF)',
        help_text="Se deixado em branco, o sistema tentará buscar o documento da última matrícula do aluno."
    )
    doc_bi = models.FileField(
        upload_to='matriculas/documentos/', 
        null=True, 
        blank=True, 
        verbose_name='Cópia do BI (PDF)',
        help_text="Se deixado em branco, o sistema tentará buscar o documento da última matrícula do aluno."
    )
    
    class Meta:
        db_table = 'matricula'
        verbose_name = 'Matrícula'
        verbose_name_plural = 'Matrículas'
        ordering = ['-data_matricula']
        unique_together = ['id_aluno', 'ano_lectivo']
    
    def __str__(self):
        return f"Matrícula {self.id_matricula} - {self.id_aluno.nome_completo}"

    def clean(self):
        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo selecionado está encerrado. Não são permitidas alterações.")
        
        # Se veio de uma turma, garantir que o ano_lectivo seja o da turma
        if self.id_turma and self.id_turma.ano_lectivo:
            if self.ano_lectivo and self.ano_lectivo != self.id_turma.ano_lectivo:
                raise ValidationError("O Ano Lectivo da matrícula deve ser o mesmo da Turma.")
            self.ano_lectivo = self.id_turma.ano_lectivo
            
        if not self.ano_lectivo:
            raise ValidationError("O Ano Lectivo é obrigatório para realizar a matrícula.")

    def save(self, *args, **kwargs):
        # Auto-assign active year if not provided
        if not self.ano_lectivo:
            self.ano_lectivo = AnoLectivo.get_active_year()
            
        self.clean()
        
        # Check capacity and notify if full
        if self.id_turma and self.id_turma.id_sala:
            # Import here to avoid circular dependencies
            from apis.models.notificacao import Notificacao
            
            capacity = self.id_turma.id_sala.capacidade_alunos
            # Count existing active enrollments for this turma and year
            current_count = Matricula.objects.filter(
                id_turma=self.id_turma, 
                ativo=True,
                ano_lectivo=self.ano_lectivo
            ).exclude(pk=self.pk).count()
            
            if current_count >= capacity:
                # Create notification
                Notificacao.objects.create(
                    titulo=f"Capacidade Excedida: {self.id_turma.codigo_turma}",
                    mensagem=f"A turma {self.id_turma.codigo_turma} atingiu ou excedeu a capacidade de {capacity} alunos ao matricular {self.id_aluno.nome_completo}.",
                    tipo='warning',
                    link=f"/turmas"
                )
        
        super().save(*args, **kwargs)
        
        # Inheritance of documentation from previous enrollment if not provided
        if not self.doc_certificado or not self.doc_bi:
            # Look for the immediate previous enrollment (excluding current)
            last_mat = Matricula.objects.filter(
                id_aluno=self.id_aluno
            ).exclude(pk=self.pk).order_by('-data_matricula', '-id_matricula').first()
            
            if last_mat:
                updated = False
                if not self.doc_certificado and last_mat.doc_certificado:
                    self.doc_certificado = last_mat.doc_certificado
                    updated = True
                if not self.doc_bi and last_mat.doc_bi:
                    self.doc_bi = last_mat.doc_bi
                    updated = True
                
                if updated:
                    # Save again but only the file fields to avoid recursion/re-validation
                    Matricula.objects.filter(pk=self.pk).update(
                        doc_certificado=self.doc_certificado,
                        doc_bi=self.doc_bi
                    )
        
        # Sync Aluno's Turma
        if self.id_aluno and self.id_turma:
            self.id_aluno.id_turma = self.id_turma
            self.id_aluno.save()
            
        # Sync Candidato status if applicable (so it shows as 'Matriculado' in Inscritos list)
        if self.id_aluno and self.id_aluno.numero_bi:
            try:
                from apis.models.candidatura import Candidato
                Candidato.objects.filter(numero_bi=self.id_aluno.numero_bi, status='Aprovado').update(status='Matriculado')
            except ImportError:
                pass # Avoid issues if candidacy app isn't ready


    def delete(self, *args, **kwargs):
        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo selecionado está encerrado. Não é possível excluir.")
        super().delete(*args, **kwargs)
