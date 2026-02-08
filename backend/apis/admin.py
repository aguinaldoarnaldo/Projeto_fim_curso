from django.contrib import admin
from django.db.models import Count, Avg, Sum, Q
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from unfold.decorators import display

from apis.models import (
    # Usuários
    Cargo, Funcionario, Encarregado, CargoFuncionario,
    # Alunos
    Aluno, AlunoEncarregado,
    # Acadêmico
    Sala, Classe, Departamento, Seccao, AreaFormacao, Curso, Periodo, Turma, AnoLectivo,
    # Avaliações
    TipoDisciplina, Disciplina, DisciplinaCurso, ProfessorDisciplina, Nota, FaltaAluno,
    # Documentos
    Documento, SolicitacaoDocumento,
    # Biblioteca
    Categoria, Livro,
    # Financeiro
    Fatura, Pagamento,
    # Matrículas
    Inscricao, Matricula,
    # Auditoria
    Historico, HistoricoLogin,
    # Candidatura
    Candidato, ExameAdmissao, RupeCandidato
)




# =============================================================================
# ADMIN CLASSES PERSONALIZADAS
# =============================================================================

@admin.register(Candidato)
class CandidatoAdmin(ModelAdmin):
    list_display = ['numero_inscricao', 'nome_completo', 'numero_bi', 'curso1_nome', 'ano_lectivo', 'status_badge', 'criado_em']
    list_filter = ['ano_lectivo', 'status', 'genero', 'curso_primeira_opcao']
    search_fields = ['nome_completo', 'numero_bi', 'numero_inscricao']
    list_per_page = 20
    
    @display(description='Curso', ordering='curso_primeira_opcao__nome_curso')
    def curso1_nome(self, obj):
        return obj.curso_primeira_opcao.nome_curso if obj.curso_primeira_opcao else '-'

    @display(description='Status', ordering='status')
    def status_badge(self, obj):
        colors = {
            'Pendente': 'warning',
            'Aprovado': 'success',
            'Reprovado': 'danger',
            'Matriculado': 'info'
        }
        color = colors.get(obj.status, 'secondary')
        return format_html('<span class="badge badge-{}">{}</span>', color, obj.status)

@admin.register(ExameAdmissao)
class ExameAdmissaoAdmin(ModelAdmin):
    list_display = ['candidato', 'data_exame', 'sala', 'nota', 'realizado']
    list_filter = ['realizado']

@admin.register(RupeCandidato)
class RupeCandidatoAdmin(ModelAdmin):
    list_display = ['candidato', 'referencia', 'valor', 'status', 'data_pagamento']
    list_filter = ['status']
    search_fields = ['referencia', 'candidato__nome_completo']

@admin.register(Cargo)
class CargoAdmin(ModelAdmin):
    list_display = ['id_cargo', 'nome_cargo', 'total_funcionarios', 'criado_em']
    search_fields = ['nome_cargo']
    list_per_page = 20
    
    @display(description='Total de Funcionários', ordering='total_funcionarios')
    def total_funcionarios(self, obj):
        total = Funcionario.objects.filter(id_cargo=obj).count()
        return format_html('<span class="badge badge-primary">{}</span>', total)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(total_funcionarios=Count('funcionario'))


@admin.register(Funcionario)
class FuncionarioAdmin(ModelAdmin):
    list_display = ['id_funcionario', 'nome_completo', 'codigo_identificacao', 
                    'cargo_badge', 'email', 'status_badge', 'online_badge']
    list_filter = ['status_funcionario', 'id_cargo', 'genero']
    search_fields = ['nome_completo', 'email', 'codigo_identificacao']
    list_per_page = 20
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('codigo_identificacao', 'nome_completo', 'numero_bi', 'id_cargo')
        }),
        ('Contato', {
            'fields': ('email', 'telefone')
        }),
        ('Endereço', {
            'fields': ('provincia_residencia', 'municipio_residencia', 'bairro_residencia'),
            'classes': ('collapse',)
        }),
        ('Status e Segurança', {
            'fields': ('status_funcionario', 'senha_hash', 'is_online')
        }),
        ('Outros', {
            'fields': ('genero', 'data_admissao', 'descricao', 'img_path'),
            'classes': ('collapse',)
        }),
    )
    
    @display(description='Cargo', ordering='id_cargo__nome_cargo')
    def cargo_badge(self, obj):
        if obj.id_cargo:
            return format_html(
                '<span class="badge badge-info">{}</span>',
                obj.id_cargo.nome_cargo
            )
        return '-'
    
    @display(description='Status', ordering='status_funcionario')
    def status_badge(self, obj):
        colors = {
            'Activo': 'success',
            'Inactivo': 'warning',
            'Demitido': 'danger',
            'Banido': 'dark'
        }
        color = colors.get(obj.status_funcionario, 'secondary')
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            color, obj.status_funcionario
        )
    
    @display(description='Online', boolean=True)
    def online_badge(self, obj):
        return obj.is_online


@admin.register(Encarregado)
class EncarregadoAdmin(ModelAdmin):
    list_display = ['id_encarregado', 'nome_completo', 'email', 'total_educandos']
    search_fields = ['nome_completo', 'email']
    list_per_page = 20
    
    @display(description='Total de Educandos')
    def total_educandos(self, obj):
        total = AlunoEncarregado.objects.filter(id_encarregado=obj).count()
        return format_html('<span class="badge badge-primary">{}</span>', total)


@admin.register(Aluno)
class AlunoAdmin(ModelAdmin):
    list_display = ['id_aluno', 'foto_badge', 'nome_completo', 'numero_matricula', 'turma_badge', 
                    'get_ano_lectivo', 'status_badge', 'genero', 'online_badge']
    list_filter = ['id_turma__ano_lectivo', 'status_aluno', 'id_turma', 'genero']
    search_fields = ['nome_completo', 'numero_matricula', 'email']
    list_per_page = 20

    class MatriculaInline(admin.StackedInline):
        model = Matricula
        extra = 0
        autocomplete_fields = ['id_turma']
        verbose_name = "Histórico de Matrícula"
        verbose_name_plural = "Histórico de Matrículas"
        
        # Agrupar campos para não poluir o ecrã
        fieldsets = (
            ('Dados da Matrícula', {
                'fields': (
                    ('id_turma', 'tipo'),
                    ('status', 'ativo'),
                ),
                'classes': ('unfold-fieldset-compact',),
            }),
            ('Documentação (Opcional - Herda do ano passado)', {
                'fields': (
                    ('doc_certificado', 'status_certificado'),
                    ('doc_bi', 'status_bi'),
                ),
                'classes': ('collapse',), # Escondido por padrão para não confundir
                'description': 'Estes campos só precisam de ser preenchidos se quiser ATUALIZAR os documentos originais.'
            }),
        )
        
        readonly_fields = ['status_certificado', 'status_bi']

        def status_certificado(self, obj):
            if obj.doc_certificado:
                return format_html('<span style="color: #10b981; font-weight: bold;">✅ Arquivado</span>')
            return format_html('<span style="color: #94a3b8;">(Será herdado da matrícula anterior)</span>')
        status_certificado.short_description = "Estado do Certificado"

        def status_bi(self, obj):
            if obj.doc_bi:
                return format_html('<span style="color: #10b981; font-weight: bold;">✅ Arquivado</span>')
            return format_html('<span style="color: #94a3b8;">(Será herdado da matrícula anterior)</span>')
        status_bi.short_description = "Estado do BI"

    inlines = [MatriculaInline]
    
    # Organização em Abas (Unfold)
    tabs = [
        ("Dados Pessoais", ["pessoais", "contato"]),
        ("Localização", ["endereco"]),
        ("Académico", ["academico"]),
        ("Segurança & Foto", ["seguranca"]),
    ]

    fieldsets = (
        ('pessoais', {
            'fields': (
                ('nome_completo', 'genero'), 
                ('numero_bi', 'data_nascimento'), 
                ('nacionalidade', 'naturalidade', 'deficiencia'),
                'numero_matricula'
            ),
        }),
        ('contato', {
            'fields': (('email', 'telefone'),),
        }),
        ('endereco', {
            'fields': (
                ('provincia_residencia', 'municipio_residencia'), 
                ('bairro_residencia', 'numero_casa')
            ),
        }),
        ('academico', {
            'fields': (('id_turma', 'status_aluno'), 'modo_user'),
        }),
        ('seguranca', {
            'fields': (('senha_hash', 'is_online'), 'img_path'),
        }),
    )

    @display(description='Foto')
    def foto_badge(self, obj):
        if obj.img_path:
            return format_html(
                '<img src="{}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;" />',
                obj.img_path.url
            )
        return format_html('<div style="width: 40px; height: 40px; background-color: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #6b7280; font-weight: bold; font-size: 10px; border: 2px solid #e2e8f0;">N/A</div>')
    
    @display(description='Turma', ordering='id_turma__codigo_turma')
    def turma_badge(self, obj):
        if obj.id_turma:
            return format_html(
                '<span class="badge badge-info" style="padding: 5px 10px; border-radius: 6px;">{}</span>',
                obj.id_turma.codigo_turma
            )
        return format_html('<span style="color: #94a3b8 italic;">Sem Turma</span>')
    
    @display(description='Status', ordering='status_aluno')
    def status_badge(self, obj):
        colors = {
            'Activo': 'success',
            'Expulso': 'danger',
            'Transferido': 'warning',
            'Suspenso': 'dark'
        }
        color = colors.get(obj.status_aluno, 'secondary')
        return format_html(
            '<span class="badge badge-{}" style="padding: 5px 10px; border-radius: 6px;">{}</span>',
            color, obj.status_aluno
        )
    
    @display(description='Online', boolean=True)
    def online_badge(self, obj):
        return obj.is_online

    @display(description='Ano Lectivo', ordering='id_turma__ano_lectivo__nome')
    def get_ano_lectivo(self, obj):
        if obj.id_turma and obj.id_turma.ano_lectivo:
            return obj.id_turma.ano_lectivo.nome
        return "-"


@admin.register(Turma)
class TurmaAdmin(ModelAdmin):
    list_display = ['id_turma', 'codigo_turma', 'ano_lectivo_display', 'curso_badge', 'classe_badge', 'sala_badge', 
                    'periodo_badge', 'total_alunos', 'status_badge']
    list_filter = ['ano_lectivo', 'status', 'id_curso', 'id_classe', 'id_periodo', 'id_sala']
    search_fields = ['codigo_turma', 'id_curso__nome_curso', 'ano_lectivo__nome']
    list_per_page = 20
    
    @display(description='Estado', ordering='status')
    def status_badge(self, obj):
        colors = {
            'Ativa': 'success',
            'Concluida': 'secondary'
        }
        color = colors.get(obj.status, 'secondary')
        return format_html('<span class="badge badge-{}">{}</span>', color, obj.status)
    
    @display(description='Sala', ordering='id_sala__numero_sala')
    def sala_badge(self, obj):
        if obj.id_sala:
            return format_html('<span class="badge badge-warning">Sala {}</span>', obj.id_sala.numero_sala)
        return '-'
    
    @display(description='Curso', ordering='id_curso__nome_curso')
    def curso_badge(self, obj):
        if obj.id_curso:
            return format_html('<span class="badge badge-primary">{}</span>', obj.id_curso.nome_curso)
        return '-'
    
    @display(description='Classe', ordering='id_classe__nivel')
    def classe_badge(self, obj):
        if obj.id_classe:
            return format_html('<span class="badge badge-secondary">{}ª Classe</span>', obj.id_classe.nivel)
        return '-'
    
    @display(description='Período', ordering='id_periodo__periodo')
    def periodo_badge(self, obj):
        if obj.id_periodo:
            return format_html('<span class="badge badge-info">{}</span>', obj.id_periodo.periodo)
        return '-'
    
    @display(description='Total de Alunos')
    def total_alunos(self, obj):
        total = Aluno.objects.filter(id_turma=obj).count()
        return format_html('<span class="badge badge-success">{}</span>', total)

    @display(description='Ano Lectivo', ordering='ano_lectivo__nome')
    def ano_lectivo_display(self, obj):
        return obj.ano_lectivo.nome if obj.ano_lectivo else obj.ano


@admin.register(Curso)
class CursoAdmin(ModelAdmin):
    list_display = ['id_curso', 'nome_curso', 'coordenador_badge', 'area_badge', 'duracao', 'total_turmas']
    list_filter = ['id_area_formacao']
    search_fields = ['nome_curso', 'id_responsavel__nome_completo']
    
    @display(description='Área de Formação')
    def area_badge(self, obj):
        if obj.id_area_formacao:
            return format_html('<span class="badge badge-primary">{}</span>', obj.id_area_formacao.nome_area)
        return '-'
    
    @display(description='Total de Turmas')
    def total_turmas(self, obj):
        total = Turma.objects.filter(id_curso=obj).count()
        return format_html('<span class="badge badge-info">{}</span>', total)

    @display(description='Coordenador', ordering='id_responsavel__nome_completo')
    def coordenador_badge(self, obj):
        if obj.id_responsavel:
             return obj.id_responsavel.nome_completo
        return 'Sem Coordenador'


@admin.register(Disciplina)
class DisciplinaAdmin(ModelAdmin):
    list_display = ['id_disciplina', 'nome', 'tipo_badge', 'carga_horaria']
    list_filter = ['id_tipo_disciplina']
    search_fields = ['nome']
    
    @display(description='Tipo')
    def tipo_badge(self, obj):
        if obj.id_tipo_disciplina:
            return format_html('<span class="badge badge-secondary">{}</span>', obj.id_tipo_disciplina.nome_tipo)
        return '-'


@admin.register(Nota)
class NotaAdmin(ModelAdmin):
    list_display = ['id_nota', 'aluno_nome', 'disciplina_nome', 'tipo_avaliacao', 
                    'valor_badge', 'data_lancamento']
    list_filter = ['tipo_avaliacao', 'id_disciplina']
    search_fields = ['id_aluno__nome_completo']
    list_per_page = 20
    
    @display(description='Aluno', ordering='id_aluno__nome_completo')
    def aluno_nome(self, obj):
        return obj.id_aluno.nome_completo
    
    @display(description='Disciplina', ordering='id_disciplina__nome')
    def disciplina_nome(self, obj):
        return obj.id_disciplina.nome
    
    @display(description='Nota', ordering='valor')
    def valor_badge(self, obj):
        if obj.valor >= 14:
            color = 'success'
        elif obj.valor >= 10:
            color = 'warning'
        else:
            color = 'danger'
        return format_html('<span class="badge badge-{}">{}</span>', color, obj.valor)


@admin.register(SolicitacaoDocumento)
class SolicitacaoDocumentoAdmin(ModelAdmin):
    list_display = ['id_solicitacao', 'tipo_documento', 'aluno_nome', 'status_badge', 'data_solicitacao']
    list_filter = ['status_solicitacao', 'tipo_documento']
    search_fields = ['tipo_documento', 'id_aluno__nome_completo']
    list_per_page = 20
    
    @display(description='Aluno', ordering='id_aluno__nome_completo')
    def aluno_nome(self, obj):
        if obj.id_aluno:
            return obj.id_aluno.nome_completo
        return '-'
    
    @display(description='Status', ordering='status_solicitacao')
    def status_badge(self, obj):
        colors = {
            'pendente': 'warning',
            'aprovado': 'success',
            'rejeitado': 'danger',
            'pago': 'info'
        }
        color = colors.get(obj.status_solicitacao, 'secondary')
        return format_html('<span class="badge badge-{}">{}</span>', color, obj.status_solicitacao.title())


@admin.register(Fatura)
class FaturaAdmin(ModelAdmin):
    list_display = ['id_fatura', 'aluno_nome', 'descricao', 'total_badge', 'status_badge', 'data_vencimento']
    list_filter = ['status']
    search_fields = ['descricao', 'id_aluno__nome_completo']
    
    @display(description='Aluno', ordering='id_aluno__nome_completo')
    def aluno_nome(self, obj):
        if obj.id_aluno:
            return obj.id_aluno.nome_completo
        return '-'
    
    @display(description='Total', ordering='total')
    def total_badge(self, obj):
        return format_html('<span class="badge badge-primary">{:,.2f} Kz</span>', obj.total)
    
    @display(description='Status', ordering='status')
    def status_badge(self, obj):
        colors = {
            'pendente': 'warning',
            'paga': 'success',
            'cancelada': 'danger'
        }
        color = colors.get(obj.status, 'secondary')
        return format_html('<span class="badge badge-{}">{}</span>', color, obj.status.title())


# Registrar outros models sem customização
admin.site.register(CargoFuncionario, ModelAdmin)
admin.site.register(AlunoEncarregado, ModelAdmin)
@admin.register(Sala)
class SalaAdmin(ModelAdmin):
    list_display = ['id_sala', 'sala_nome', 'bloco', 'capacidade_alunos']
    search_fields = ['numero_sala', 'bloco']

    @display(description='Sala', ordering='numero_sala')
    def sala_nome(self, obj):
        return f"Sala {obj.numero_sala}"
admin.site.register(Classe, ModelAdmin)
admin.site.register(Departamento, ModelAdmin)
admin.site.register(Seccao, ModelAdmin)
admin.site.register(AreaFormacao, ModelAdmin)
admin.site.register(AnoLectivo, ModelAdmin)
admin.site.register(Periodo, ModelAdmin)
admin.site.register(TipoDisciplina, ModelAdmin)
admin.site.register(DisciplinaCurso, ModelAdmin)
admin.site.register(ProfessorDisciplina, ModelAdmin)
admin.site.register(FaltaAluno, ModelAdmin)
admin.site.register(Documento, ModelAdmin)
admin.site.register(Categoria, ModelAdmin)
admin.site.register(Livro, ModelAdmin)
admin.site.register(Pagamento, ModelAdmin)
admin.site.register(Inscricao, ModelAdmin)
from django import forms
from django.contrib import admin
from apis.models import Aluno, Matricula

class MatriculaAdminForm(forms.ModelForm):
    # Campos para criar aluno novo
    novo_aluno_nome = forms.CharField(label='Nome do Aluno', required=False)
    novo_aluno_bi = forms.CharField(label='Número do BI', required=False)
    novo_aluno_genero = forms.ChoiceField(choices=[('M', 'Masculino'), ('F', 'Feminino')], label='Género', required=False)
    novo_aluno_data_nascimento = forms.DateField(label='Data de Nascimento', required=False, widget=forms.DateInput(attrs={'type': 'date'}))
    novo_aluno_nacionalidade = forms.CharField(initial='Angolana', label='Nacionalidade', required=False)
    novo_aluno_naturalidade = forms.CharField(label='Naturalidade (Local de Nascimento)', required=False)
    novo_aluno_deficiencia = forms.ChoiceField(choices=[('Não', 'Não'), ('Sim', 'Sim')], label='Deficiência', initial='Não', required=False)
    novo_aluno_foto = forms.ImageField(label='Foto Tipo Passe', required=False)
    novo_aluno_email = forms.EmailField(label='Email', required=False)
    novo_aluno_telefone = forms.CharField(label='Telefone', initial='900000000', required=False)
    novo_aluno_provincia = forms.CharField(label='Província de Residência', required=False)
    novo_aluno_municipio = forms.CharField(label='Município de Residência', required=False)
    novo_aluno_bairro = forms.CharField(label='Bairro/Rua', required=False)
    novo_aluno_numero_casa = forms.CharField(label='Nº da Casa', required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk and self.instance.id_aluno:
            aluno = self.instance.id_aluno
            self.fields['novo_aluno_nome'].initial = aluno.nome_completo
            self.fields['novo_aluno_bi'].initial = aluno.numero_bi
            self.fields['novo_aluno_genero'].initial = aluno.genero
            self.fields['novo_aluno_data_nascimento'].initial = aluno.data_nascimento
            self.fields['novo_aluno_nacionalidade'].initial = aluno.nacionalidade
            self.fields['novo_aluno_naturalidade'].initial = aluno.naturalidade
            self.fields['novo_aluno_deficiencia'].initial = aluno.deficiencia
            self.fields['novo_aluno_email'].initial = aluno.email
            self.fields['novo_aluno_telefone'].initial = aluno.telefone
            self.fields['novo_aluno_provincia'].initial = aluno.provincia_residencia
            self.fields['novo_aluno_municipio'].initial = aluno.municipio_residencia
            self.fields['novo_aluno_bairro'].initial = aluno.bairro_residencia
            self.fields['novo_aluno_numero_casa'].initial = aluno.numero_casa
            
            # Se for edição, não tornamos obrigatório para não travar se o user não quiser mexer
            # mas na verdade eles já vêm preenchidos pelo initial.
            # O Django Admin as vezes reclama se required=True e o campo é virtual.
            for field in self.fields:
                if field.startswith('novo_aluno_'):
                    self.fields[field].required = False

    class Meta:
        model = Matricula
        exclude = ['id_aluno']

    def clean(self):
        cleaned_data = super().clean()
        return cleaned_data

@admin.register(Matricula)
class MatriculaAdmin(ModelAdmin):
    form = MatriculaAdminForm
    list_display = [
        'id_display', 'aluno_nome', 'ano_lectivo', 'classe_nome', 
        'curso_nome', 'sala_nome', 'turno_nome', 
        'status_badge', 'tipo', 'data_display'
    ]
    list_filter = ['ano_lectivo', 'status', 'tipo', 'ativo', 'id_turma__id_classe', 'id_turma__id_curso']
    search_fields = ['id_aluno__nome_completo', 'id_matricula']
    autocomplete_fields = ['id_turma'] # Removemos id_aluno daqui pois não será usado para seleção
    list_per_page = 20
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # O campo id_aluno foi ocultado.
        return form

    # Removemos 'id_aluno' dos fieldsets para sumir da tela
    fieldsets = (
        ('Dados Pessoais do Novo Aluno', {
            'fields': (
                'novo_aluno_nome', 
                ('novo_aluno_bi', 'novo_aluno_genero', 'novo_aluno_data_nascimento'),
                ('novo_aluno_nacionalidade', 'novo_aluno_naturalidade', 'novo_aluno_deficiencia'),
                'novo_aluno_foto'
            ),
            'description': 'Preencha os dados abaixo para registrar o aluno automaticamente.',
            'classes': ('wide',)
        }),
        ('Endereço e Contato', {
            'fields': (
                ('novo_aluno_email', 'novo_aluno_telefone'),
                ('novo_aluno_provincia', 'novo_aluno_municipio'),
                ('novo_aluno_bairro', 'novo_aluno_numero_casa')
            ),
            'classes': ('collapse',)
        }),
        ('Detalhes da Matrícula', {
            'fields': (
                ('id_turma', 'ano_lectivo'),
                ('tipo', 'status', 'ativo')
            ),
            'classes': ('wide',)
        }),
        ('Documentação Académica', {
            'fields': (
                'doc_certificado', 
                'doc_bi',
            ),
            'description': 'Caso o aluno já tenha sido matriculado anteriormente, estes campos podem ser deixados em branco para herdar os documentos da matrícula anterior.',
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        # Dados do formulário
        novo_nome = form.cleaned_data.get('novo_aluno_nome')
        novo_bi = form.cleaned_data.get('novo_aluno_bi')
        novo_genero = form.cleaned_data.get('novo_aluno_genero')
        novo_foto = form.cleaned_data.get('novo_aluno_foto')
        
        # Se estamos criando (não editando) ou se o obj não tem aluno (caso raro em edição)
        if not change or not obj.id_aluno_id:
            # Gerar numero de matricula sequencial
            import datetime
            year = datetime.datetime.now().year
            last = Aluno.objects.order_by('-id_aluno').first()
            if last and last.numero_matricula:
                 try:
                    last_mat_int = int(last.numero_matricula)
                    if str(last_mat_int).startswith(str(year)):
                         new_num = last_mat_int + 1
                    else:
                         new_num = int(f"{year}0001")
                 except:
                    new_num = int(f"{year}0001")
            else:
                 new_num = int(f"{year}0001")

            # Criar o Aluno com todos os campos
            aluno = Aluno.objects.create(
                nome_completo=novo_nome,
                numero_bi=novo_bi,
                genero=novo_genero,
                data_nascimento=form.cleaned_data.get('novo_aluno_data_nascimento'),
                nacionalidade=form.cleaned_data.get('novo_aluno_nacionalidade'),
                naturalidade=form.cleaned_data.get('novo_aluno_naturalidade'),
                deficiencia=form.cleaned_data.get('novo_aluno_deficiencia'),
                email=form.cleaned_data.get('novo_aluno_email'),
                telefone=form.cleaned_data.get('novo_aluno_telefone'),
                provincia_residencia=form.cleaned_data.get('novo_aluno_provincia'),
                municipio_residencia=form.cleaned_data.get('novo_aluno_municipio'),
                bairro_residencia=form.cleaned_data.get('novo_aluno_bairro'),
                numero_casa=form.cleaned_data.get('novo_aluno_numero_casa'),
                numero_matricula=new_num,
                status_aluno='Activo'
            )
            
            if novo_foto:
                aluno.img_path = novo_foto
                aluno.save()

            obj.id_aluno = aluno
            self.message_user(request, f"Aluno '{novo_nome}' registado e matriculado com sucesso!", level='SUCCESS')
        else:
            # ESTAMOS EDITANDO: Atualizar os dados do aluno vinculado
            aluno = obj.id_aluno
            aluno.nome_completo = novo_nome or aluno.nome_completo
            aluno.numero_bi = novo_bi or aluno.numero_bi
            aluno.genero = novo_genero or aluno.genero
            
            if form.cleaned_data.get('novo_aluno_data_nascimento'): 
                aluno.data_nascimento = form.cleaned_data.get('novo_aluno_data_nascimento')
            if form.cleaned_data.get('novo_aluno_nacionalidade'): 
                aluno.nacionalidade = form.cleaned_data.get('novo_aluno_nacionalidade')
            if form.cleaned_data.get('novo_aluno_naturalidade'): 
                aluno.naturalidade = form.cleaned_data.get('novo_aluno_naturalidade')
            if form.cleaned_data.get('novo_aluno_deficiencia'): 
                aluno.deficiencia = form.cleaned_data.get('novo_aluno_deficiencia')
            if form.cleaned_data.get('novo_aluno_email'): 
                aluno.email = form.cleaned_data.get('novo_aluno_email')
            if form.cleaned_data.get('novo_aluno_telefone'): 
                aluno.telefone = form.cleaned_data.get('novo_aluno_telefone')
            if form.cleaned_data.get('novo_aluno_provincia'): 
                aluno.provincia_residencia = form.cleaned_data.get('novo_aluno_provincia')
            if form.cleaned_data.get('novo_aluno_municipio'): 
                aluno.municipio_residencia = form.cleaned_data.get('novo_aluno_municipio')
            if form.cleaned_data.get('novo_aluno_bairro'): 
                aluno.bairro_residencia = form.cleaned_data.get('novo_aluno_bairro')
            if form.cleaned_data.get('novo_aluno_numero_casa'): 
                aluno.numero_casa = form.cleaned_data.get('novo_aluno_numero_casa')
            
            if novo_foto:
                aluno.img_path = novo_foto
                
            aluno.save()
            self.message_user(request, f"Dados de '{aluno.nome_completo}' atualizados com sucesso.", level='SUCCESS')
        
        super().save_model(request, obj, form, change)

    @display(description='Matrícula', ordering='id_matricula')
    def id_display(self, obj):
        return f"MAT-{obj.id_matricula}"

    @display(description='Nome Completo', ordering='id_aluno__nome_completo')
    def aluno_nome(self, obj):
        return obj.id_aluno.nome_completo

    @display(description='Ano Lectivo', ordering='id_turma__ano_lectivo__nome')
    def ano_lectivo(self, obj):
        if obj.id_turma and obj.id_turma.ano_lectivo:
            return obj.id_turma.ano_lectivo.nome
        return obj.id_turma.ano if obj.id_turma else "N/A"

    @display(description='Classe', ordering='id_turma__id_classe__nivel')
    def classe_nome(self, obj):
        if obj.id_turma and obj.id_turma.id_classe:
            return obj.id_turma.id_classe.descricao or f"{obj.id_turma.id_classe.nivel}ª Classe"
        return "N/A"

    @display(description='Curso', ordering='id_turma__id_curso__nome_curso')
    def curso_nome(self, obj):
        return obj.id_turma.id_curso.nome_curso if obj.id_turma and obj.id_turma.id_curso else "N/A"

    @display(description='Sala', ordering='id_turma__id_sala__numero_sala')
    def sala_nome(self, obj):
        return f"{obj.id_turma.id_sala.numero_sala}" if obj.id_turma and obj.id_turma.id_sala else "N/A"

    @display(description='Turno', ordering='id_turma__id_periodo__periodo')
    def turno_nome(self, obj):
        return obj.id_turma.id_periodo.periodo if obj.id_turma and obj.id_turma.id_periodo else "N/A"

    # Removed: 'turma_codigo' from display to match list_display length if needed but kept in list_display above

    @display(description='Estado', ordering='status')
    def status_badge(self, obj):
        colors = {
            'Ativo': 'success',
            'Pendente': 'warning',
            'Cancelado': 'danger',
            'Concluido': 'info'
        }
        color = colors.get(obj.status, 'secondary')
        return format_html('<span class="badge badge-{}">{}</span>', color, obj.status)

    @display(description='Data', ordering='data_matricula')
    def data_display(self, obj):
        return obj.data_matricula.strftime("%d/%m/%Y")
admin.site.register(Historico, ModelAdmin)
admin.site.register(HistoricoLogin, ModelAdmin)
