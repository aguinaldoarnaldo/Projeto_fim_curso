from django.db import models
from django.core.exceptions import ValidationError
from .alunos import Aluno

from .academico import Turma, AnoLectivo, Curso


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
        ('Concluida', 'Concluída'),
        ('Desistente', 'Desistente'),
        ('Transferido', 'Transferido')
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_MATRICULA, default='Novo', verbose_name='Tipo de Matrícula')
    status = models.CharField(max_length=20, choices=STATUS_MATRICULA, default='Ativa', verbose_name='Estado')
    ativo = models.BooleanField(default=True, verbose_name='Ativo') # Mantendo para retrocompatibilidade
    numero_matricula = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        verbose_name='Número de Matrícula'
    )

    
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
        return f"Matrícula {self.numero_matricula or self.id_matricula} - {self.id_aluno.nome_completo}"

    def clean(self):
        # Validação estrita: Impedir qualquer alteração se o ano lectivo da matrícula estiver encerrado
        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError(f"O Ano Lectivo '{self.ano_lectivo.nome}' está encerrado. Não são permitidas alterações em matrículas deste ciclo.")
        
        # Se veio de uma turma, garantir que o ano_lectivo seja o da turma
        if self.id_turma and self.id_turma.ano_lectivo:
            if self.ano_lectivo and self.ano_lectivo != self.id_turma.ano_lectivo:
                # Permitir se o ano da turma estiver encerrado e o da matrícula for o ativo (Reutilização de Turma)
                is_turma_closed = self.id_turma.ano_lectivo and not self.id_turma.ano_lectivo.activo
                is_matricula_active = self.ano_lectivo.activo
                
                if is_turma_closed and is_matricula_active:
                    pass
                else:
                    raise ValidationError("O Ano Lectivo da matrícula deve ser o mesmo da Turma.")
            
            # Não forçar mais o ano da turma se estivermos numa transição de ano
            if not (self.id_turma.ano_lectivo and not self.id_turma.ano_lectivo.activo):
                self.ano_lectivo = self.id_turma.ano_lectivo
            
        if not self.ano_lectivo:
            raise ValidationError("O Ano Lectivo é obrigatório para realizar a matrícula.")

        # Validação de Documentos Obrigatórios (Desativada temporariamente para facilitar importação)
        # Em produção real, poderíamos verificar um parâmetro ou permissão
        pass

    def save(self, *args, **kwargs):
        # Se não houver ano_lectivo, tenta buscar o ativo
        if not self.ano_lectivo:
            self.ano_lectivo = AnoLectivo.get_active_year()
            
        # Se veio como string (ID ou Nome)
        if isinstance(self.ano_lectivo, str):
            if self.ano_lectivo.isdigit():
                 self.ano_lectivo = AnoLectivo.objects.get(pk=int(self.ano_lectivo))
            else:
                 self.ano_lectivo = AnoLectivo.objects.filter(nome=self.ano_lectivo).first()

        # Validação de Segurança: Se o ano lectivo estiver encerrado, bloqueia salvamento (Criação ou Edição)
        if self.ano_lectivo and not self.ano_lectivo.activo:
             # Se for uma nova matrícula tentando entrar num ano fechado
             if not self.pk:
                 raise ValidationError(f"Não é possível criar novas matrículas para o ano lectivo '{self.ano_lectivo.nome}' pois este já se encontra encerrado.")
             # Se for uma edição de uma matrícula já existente em ano fechado
             raise ValidationError(f"A matrícula pertence ao ano lectivo '{self.ano_lectivo.nome}' que está encerrado. Nenhuma alteração é permitida.")
             
        # Garantir que matrículas de Confirmação entrem como 'Ativo'
        # Confirmação no sistema é o ato de renovar a matrícula para o novo ano
        if self.tipo == 'Confirmacao':
            self.status = 'Ativa'

        # Gerar número de matrícula se não existir (ex: 0038IN21AG)
        if not self.numero_matricula:
            self.numero_matricula = self._generate_numero_matricula()

        self.clean()
        
        # Check capacity and notify if full
        if self.id_turma:
            # Import here to avoid circular dependencies
            from .notificacao import Notificacao
            
            capacity = self.id_turma.capacidade
            # Count existing active enrollments for this turma and year
            current_count = Matricula.objects.filter(
                id_turma=self.id_turma, 
                ativo=True,
                ano_lectivo=self.ano_lectivo
            ).exclude(pk=self.pk).count()
            
            if current_count >= capacity:
                # Create notification
                Notificacao.objects.create(
                    titulo=f"Tentativa de Excesso na Turma: {self.id_turma.codigo_turma}",
                    mensagem=f"Foi impedida a matrícula de {self.id_aluno.nome_completo} porque a turma atingiu a capacidade ({capacity}).",
                    tipo='warning',
                    link=f"/turmas"
                )
                raise ValidationError(f"Lotação Excedida: A turma {self.id_turma.codigo_turma} já atingiu a sua capacidade máxima de {capacity} alunos.")
        
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
        
        # Sync Aluno's Turma and Status
        if self.id_aluno:
            updated_aluno = False
            
            # Sincronizar Turma
            if self.id_turma:
                self.id_aluno.id_turma = self.id_turma
                updated_aluno = True
            
            if self.status == 'Transferido' and self.id_aluno.status_aluno != 'Transferido':
                self.id_aluno.status_aluno = 'Transferido'
                updated_aluno = True
                
            if updated_aluno:
                self.id_aluno.save()

            
        # Sync Candidato status if applicable (so it shows as 'Matriculado' in Inscritos list)
        if self.id_aluno and self.id_aluno.numero_bi:
            try:
                from .candidatura import Candidato
                Candidato.objects.filter(numero_bi=self.id_aluno.numero_bi, status='Aprovado').update(status='Matriculado')
            except ImportError:
                pass # Avoid issues if candidacy app isn't ready

    @staticmethod
    def _only_alpha_upper(value: str) -> str:
        if not value:
            return ''
        import unicodedata
        normalized = unicodedata.normalize('NFKD', str(value))
        ascii_str = ''.join(ch for ch in normalized if not unicodedata.combining(ch))
        return ''.join(ch for ch in ascii_str.upper() if 'A' <= ch <= 'Z')

    @staticmethod
    def _get_curso_sigla_from_turma(turma: Turma) -> str:
        # Usa a mesma lógica centralizada no modelo Curso
        if not turma or not turma.id_curso:
            return 'XX'
        return Curso.get_sigla(turma.id_curso.nome_curso)

    @staticmethod
    def _get_ano_suffix(ano_lectivo: AnoLectivo) -> str:
        # AnoLectivo.nome costuma ser "2025/2026" → "25"
        import re
        nome = getattr(ano_lectivo, 'nome', '') or ''
        years = re.findall(r'(\d{4})', nome)
        if years:
            return years[0][-2:]
        return Matricula._only_alpha_upper(nome)[-2:] or '00'

    @staticmethod
    def _get_iniciais_aluno(nome_completo: str) -> str:
        parts = [p for p in str(nome_completo or '').strip().split() if p.strip()]
        if not parts:
            return 'XX'
        first = Matricula._only_alpha_upper(parts[0])[:1] or 'X'
        last = Matricula._only_alpha_upper(parts[-1])[:1] or 'X'
        return f"{first}{last}"

    def _next_sequencia(self) -> int:
        """
        Sequência GLOBAL de 4 dígitos (não reseta por ano).
        Ex.: 0001IN25GJ → 0001, 0002IN25AG → 0002, 0003IN26AC → 0003.

        IMPORTANTE: ignora valores legados numéricos (ex.: "20270001") que podem ter sido
        copiados de versões antigas, para não “pular” para 2027.
        """
        import re

        # Padrão esperado: 4 dígitos + 2 letras + 2 dígitos + 2 letras
        # Ex.: 0001IN25GJ
        pattern = re.compile(r'^(\d{4})[A-Z]{2}\d{2}[A-Z]{2}$')

        qs = Matricula.objects.exclude(pk=self.pk).values_list('numero_matricula', flat=True)

        max_seq = 0
        for num in qs:
            if not num:
                continue
            m = pattern.match(str(num))
            if m:
                try:
                    prefix = int(m.group(1))
                    # Se o prefixo parecer um ano (ex.: 2027), ignorar (legado/geração antiga)
                    if prefix >= 2000:
                        continue
                    max_seq = max(max_seq, prefix)
                except ValueError:
                    continue
        return max_seq + 1

    def _generate_numero_matricula(self) -> str:
        from django.db import IntegrityError, transaction

        curso_sigla = self._get_curso_sigla_from_turma(self.id_turma)
        ano_suffix = self._get_ano_suffix(self.ano_lectivo)
        iniciais = self._get_iniciais_aluno(self.id_aluno.nome_completo if self.id_aluno else '')

        # Evitar colisões em concorrência: tentar algumas vezes
        for _ in range(5):
            seq = self._next_sequencia()
            candidate = f"{seq:04d}{curso_sigla}{ano_suffix}{iniciais}"
            if not Matricula.objects.filter(numero_matricula=candidate).exists():
                return candidate

            # Se já existir, força incremento e tenta novamente
            try:
                with transaction.atomic():
                    if not Matricula.objects.select_for_update().filter(numero_matricula=candidate).exists():
                        return candidate
            except IntegrityError:
                continue

        # Fallback final (deve ser raríssimo)
        import uuid
        return f"{self._next_sequencia():04d}{curso_sigla}{ano_suffix}{iniciais}{uuid.uuid4().hex[:2].upper()}"


    def delete(self, *args, **kwargs):
        if self.ano_lectivo and not self.ano_lectivo.activo:
             raise ValidationError("O Ano Lectivo selecionado está encerrado. Não é possível excluir.")
        super().delete(*args, **kwargs)
