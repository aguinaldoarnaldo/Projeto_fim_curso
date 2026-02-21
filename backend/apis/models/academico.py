from django.db import models
from django.core.exceptions import ValidationError
from .base import BaseModel
from .usuarios import Funcionario
import datetime

class AnoLectivo(BaseModel):
    """Ano Lectivo da Instituição"""
    STATUS_CHOICES = [
        ('Planeado', 'Planeado'),
        ('Activo', 'Activo'),
        ('Encerrado', 'Encerrado'),
        ('Suspenso', 'Suspenso'),
    ]

    id_ano = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=20, verbose_name='Ano Lectivo', unique=True, help_text="Ex: 2025/2026")
    data_inicio = models.DateField(verbose_name='Data de Início')
    data_fim = models.DateField(verbose_name='Data de Fim')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Planeado', verbose_name='Estado')
    activo = models.BooleanField(default=False, verbose_name='Activo?') # Mantido para compatibilidade
    
    class Meta:
        db_table = 'ano_lectivo'
        verbose_name = 'Ano Lectivo'
        verbose_name_plural = 'Anos Lectivos'
        ordering = ['-nome']
        
    def save(self, *args, **kwargs):
        from django.apps import apps
        Turma = apps.get_model('apis', 'Turma')
        Matricula = apps.get_model('apis', 'Matricula')
        Aluno = apps.get_model('apis', 'Aluno')

        # 1. Lógica para novos registros (Auto-seleção se não houver um activo)
        if not self.pk:
            if not AnoLectivo.objects.filter(status='Activo').exists():
                self.status = 'Activo'
            else:
                if not self.status or self.status == 'Activo':
                    self.status = 'Planeado'

        # 2. Sincronização Bidirecional (Campo antigo 'activo' vs novo 'status')
        if self.activo and self.status != 'Activo':
            self.status = 'Activo'

        # 3. Detectar a transição de status (para anos já existentes)
        status_anterior = None
        if self.pk:
            status_anterior = AnoLectivo.objects.values_list('status', flat=True).get(pk=self.pk)

        if self.status == 'Activo':
            self.activo = True

            # === CASO A: REABERTURA (Encerrado → Activo) ===
            # Reverter os efeitos do encerramento para este ano
            if status_anterior == 'Encerrado':
                # Reverter Turmas deste ano que foram concluídas pelo encerramento
                Turma.objects.filter(ano_lectivo=self, status='Concluida').update(status='Ativa')

                # Reverter Matrículas deste ano: 'Concluida' → 'Ativa'
                # ('Transferido' e 'Desistente' são estados finais - não reverter)
                Matricula.objects.filter(
                    ano_lectivo=self, status='Concluida'
                ).update(status='Ativa')

                # Reverter Alunos deste ano: 'Concluido' → 'Activo'
                # Apenas os que têm matrícula NESTE ano e estão como 'Concluido'
                ids_alunos = Matricula.objects.filter(
                    ano_lectivo=self
                ).values_list('id_aluno_id', flat=True).distinct()

                Aluno.objects.filter(
                    id_aluno__in=ids_alunos,
                    status_aluno='Concluido'
                ).update(status_aluno='Activo')

            # === CASO B: ACTIVAÇÃO NORMAL (outro ano estava activo) ===
            # Fechar o ano que estava activo antes
            old_active = AnoLectivo.objects.filter(status='Activo').exclude(pk=self.pk).first()
            if old_active:
                # Marcar Turmas do ano anterior como Concluídas
                Turma.objects.filter(ano_lectivo=old_active, status='Ativa').update(status='Concluida')

                # Marcar Matrículas do ano anterior como Concluídas
                # ('Transferido' e 'Desistente' são estados finais)
                Matricula.objects.filter(
                    ano_lectivo=old_active, status__in=['Ativa', 'Confirmada']
                ).update(status='Concluida')

                # Actualizar Alunos do ano anterior: 'Activo' → 'Concluido'
                ids_alunos_do_ano = Matricula.objects.filter(
                    ano_lectivo=old_active
                ).values_list('id_aluno_id', flat=True).distinct()

                Aluno.objects.filter(
                    id_aluno__in=ids_alunos_do_ano,
                    status_aluno='Activo'
                ).update(status_aluno='Concluido')

                # Fechar o ano anterior
                AnoLectivo.objects.filter(pk=old_active.pk).update(status='Encerrado', activo=False)

            # Segurança extra: garantir que não há outro ano Activo além deste
            AnoLectivo.objects.filter(status='Activo').exclude(pk=self.pk).update(status='Encerrado', activo=False)
        else:
            self.activo = False

        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.nome} ({self.status})"

    @staticmethod
    def get_active_year():
        """Retorna o ano lectivo actualmente activo"""
        return AnoLectivo.objects.filter(status='Activo').first()


class Sala(BaseModel):
    """Salas de aula"""
    id_sala = models.AutoField(primary_key=True)
    numero_sala = models.SmallIntegerField(verbose_name='Número da Sala', unique=True)
    capacidade_alunos = models.IntegerField(verbose_name='Capacidade')
    bloco = models.CharField(max_length=50, verbose_name='Bloco', null=True, blank=True, default='')

    
    class Meta:
        db_table = 'sala'
        verbose_name = 'Sala'
        verbose_name_plural = 'Salas'
        ordering = ['numero_sala']
    
    def __str__(self):
        return f"Sala {self.numero_sala}"


class Classe(models.Model):
    """Níveis/Anos escolares"""
    id_classe = models.AutoField(primary_key=True)
    nivel = models.SmallIntegerField(verbose_name='Nível')
    descricao = models.CharField(max_length=80, null=True, blank=True)
    
    class Meta:
        db_table = 'classe'
        verbose_name = 'Classe'
        verbose_name_plural = 'Classes'
        ordering = ['nivel']
    
    def __str__(self):
        return f"{self.nivel}ª Classe"


class Departamento(models.Model):
    """Departamentos da instituição"""
    id_departamento = models.AutoField(primary_key=True)
    nome_departamento = models.CharField(max_length=150, verbose_name='Nome do Departamento')
    chefe_id_funcionario = models.ForeignKey(
        Funcionario, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        related_name='departamentos_chefiados',
        verbose_name='Chefe'
    )
    
    class Meta:
        db_table = 'departamento'
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'
        ordering = ['nome_departamento']
    
    def __str__(self):
        return self.nome_departamento


class Seccao(models.Model):
    """Seções dentro dos departamentos"""
    id_seccao = models.AutoField(primary_key=True)
    nome_seccao = models.CharField(max_length=150, verbose_name='Nome da Seção')
    id_departamento = models.ForeignKey(
        Departamento, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        verbose_name='Departamento'
    )
    
    class Meta:
        db_table = 'seccao'
        verbose_name = 'Seção'
        verbose_name_plural = 'Seções'
        ordering = ['nome_seccao']
    
    def __str__(self):
        return self.nome_seccao


class AreaFormacao(BaseModel):
    """Áreas de formação dos cursos"""
    id_area_formacao = models.AutoField(primary_key=True)
    nome_area = models.CharField(max_length=150, verbose_name='Nome da Área')
    id_responsavel = models.ForeignKey(
        Funcionario,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='areas_coordenadas',
        verbose_name='Responsável'
    )
    
    class Meta:
        db_table = 'area_formacao'
        verbose_name = 'Área de Formação'
        verbose_name_plural = 'Áreas de Formação'
        ordering = ['nome_area']
    
    def __str__(self):
        return self.nome_area


class Curso(BaseModel):
    """Cursos oferecidos"""
    id_curso = models.AutoField(primary_key=True)
    nome_curso = models.CharField(max_length=150, verbose_name='Nome do Curso', unique=True)
    id_area_formacao = models.ForeignKey(
        AreaFormacao,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name='Área de Formação'
    )
    duracao = models.IntegerField(null=True, blank=True, verbose_name='Duração (Anos)',default=4)
    id_responsavel = models.ForeignKey(
        Funcionario,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='cursos_coordenados',
        verbose_name='Coordenador'
    )
    
    class Meta:
        db_table = 'curso'
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'
        ordering = ['nome_curso']
    
    def __str__(self):
        return self.nome_curso


class Periodo(models.Model):
    """Períodos de aula (Manhã, Tarde, Noite)"""
    
    PERIODO_CHOICES = [
        ('Manhã', 'Manhã'),
        ('Tarde', 'Tarde'),
        ('Noite', 'Noite'),
    ]
    
    id_periodo = models.AutoField(primary_key=True)
    periodo = models.CharField(max_length=10, choices=PERIODO_CHOICES)
    id_responsavel = models.ForeignKey(
        Funcionario,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='periodos_responsaveis',
        verbose_name='Responsável'
    )
    
    class Meta:
        db_table = 'periodo'
        verbose_name = 'Período'
        verbose_name_plural = 'Períodos'
    
    def __str__(self):
        return self.periodo


def current_year():
    return str(datetime.date.today().year)

class Turma(BaseModel):
    """Turmas de alunos"""
    STATUS_CHOICES = [
        ('Ativa', 'Ativa'),
        ('Concluida', 'Concluída'),
    ]

    id_turma = models.AutoField(primary_key=True)
    id_sala = models.ForeignKey(Sala, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Sala')
    id_curso = models.ForeignKey(Curso, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Curso')
    id_classe = models.ForeignKey(Classe, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Classe')
    id_periodo = models.ForeignKey(Periodo, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Período')
    ano_lectivo = models.ForeignKey(AnoLectivo, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Ano Lectivo')
    ano = models.CharField(null=True, blank=True, verbose_name='Ano (Legacy)', default=current_year)
    codigo_turma = models.CharField(max_length=50, unique=True, verbose_name='Código da Turma')
    capacidade = models.IntegerField(default=55, verbose_name='Capacidade de Alunos')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Ativa', verbose_name='Estado da Turma')
    id_responsavel = models.ForeignKey(
        Funcionario,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='turmas_responsaveis',
        verbose_name='Responsável'
    )
    
    class Meta:
        db_table = 'turma'
        verbose_name = 'Turma'
        verbose_name_plural = 'Turmas'
        ordering = ['codigo_turma']
    
    def save(self, *args, **kwargs):
        # Auto-assign active year if not provided
        if not self.ano_lectivo:
            self.ano_lectivo = AnoLectivo.get_active_year()
            
        # Validação estrita: Impedir operações se não houver ano lectivo ativo
        if not self.ano_lectivo:
             raise ValidationError("Não existe um Ano Lectivo Ativo no sistema. É necessário abrir um novo ano lectivo para criar turmas.")

        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError(f"O Ano Lectivo '{self.ano_lectivo.nome}' está encerrado. Não são permitidas alterações ou criações neste ano.")
        
        # Validação de Capacidade vs Sala
        if self.id_sala and self.capacidade > self.id_sala.capacidade_alunos:
            raise ValidationError({
                'capacidade': f"Erro de Lotação: A capacidade definida para esta turma ({self.capacidade} alunos) ultrapassa o limite máximo da Sala {self.id_sala.numero_sala}, que suporta apenas {self.id_sala.capacidade_alunos} alunos. Por favor, ajuste a lotação ou troque de sala."
            })

        if self.id_sala and self.id_curso and self.id_classe and self.id_periodo:
            sala = str(self.id_sala.numero_sala)
            curso = self.id_curso.nome_curso[:2].upper()
            classe = str(self.id_classe.nivel)
            periodo = self.id_periodo.periodo[0].upper()
            
            # Use ano_lectivo name if available, fallback to legacy ano
            ano_str = self.ano
            if self.ano_lectivo:
                ano_str = self.ano_lectivo.nome
            
            ano_suffix = str(ano_str)[-2:] if ano_str else "25"
            
            self.codigo_turma = f"{sala}{curso}{classe}{periodo}{ano_suffix}"

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo selecionado está encerrado. Não é possível excluir.")
        super().delete(*args, **kwargs)

    def __str__(self):
        return self.codigo_turma
