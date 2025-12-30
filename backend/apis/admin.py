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
    Sala, Classe, Departamento, Seccao, AreaFormacao, Curso, Periodo, Turma,
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
)


# =============================================================================
# DASHBOARD CALLBACK - Gráficos e Estatísticas
# =============================================================================

def dashboard_callback(request, context):
    """
    Callback para adicionar dados ao dashboard com visual premium
    """
    # Estatísticas gerais
    total_alunos = Aluno.objects.filter(status_aluno='Activo').count()
    total_funcionarios = Funcionario.objects.filter(status_funcionario='Activo').count()
    total_turmas = Turma.objects.count()
    total_cursos = Curso.objects.count()
    
    # Solicitações pendentes
    solicitacoes_pendentes = SolicitacaoDocumento.objects.filter(
        status_solicitacao='pendente'
    ).count()
    
    # Faturas pendentes
    faturas_pendentes = Fatura.objects.filter(status='pendente').count()
    total_pendente = Fatura.objects.filter(status='pendente').aggregate(
        total=Sum('total')
    )['total'] or 0
    
    # Média geral de notas
    media_geral = Nota.objects.aggregate(media=Avg('valor'))['media'] or 0
    
    # Online stats
    alunos_online = Aluno.objects.filter(is_online=True).count()
    func_online = Funcionario.objects.filter(is_online=True).count()
    
    context.update({
        'kpis': [
            {
                'title': 'Comunidade Escolar',
                'metric': f"{total_alunos + total_funcionarios}",
                'footer': f'<strong>{alunos_online + func_online}</strong> usuários online no momento',
                'icon': 'diversity_3',
                'color': 'primary',
            },
            {
                'title': 'Desempenho Académico',
                'metric': f"{media_geral:.1f}",
                'footer': 'Média global baseada em todas as avaliações',
                'icon': 'trending_up',
                'color': 'success' if media_geral >= 10 else 'danger',
            },
            {
                'title': 'Pendências de Documentação',
                'metric': solicitacoes_pendentes,
                'footer': 'Solicitações aguardando revisão da diretoria',
                'icon': 'description',
                'color': 'warning' if solicitacoes_pendentes > 0 else 'success',
            },
            {
                'title': 'Saúde Financeira',
                'metric': f"{total_pendente:,.2f} Kz",
                'footer': f'{faturas_pendentes} faturas pendentes de liquidação',
                'icon': 'account_balance_wallet',
                'color': 'info',
            },
        ],
    })
    
    return context


# =============================================================================
# ADMIN CLASSES PERSONALIZADAS
# =============================================================================

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
    list_display = ['id_aluno', 'nome_completo', 'numero_matricula', 'turma_badge', 
                    'status_badge', 'genero', 'online_badge']
    list_filter = ['status_aluno', 'id_turma', 'genero']
    search_fields = ['nome_completo', 'numero_matricula', 'email']
    list_per_page = 20
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome_completo', 'numero_bi', 'numero_matricula', 'genero')
        }),
        ('Contato', {
            'fields': ('email', 'telefone')
        }),
        ('Endereço', {
            'fields': ('provincia_residencia', 'municipio_residencia', 'bairro_residencia', 'numero_casa'),
            'classes': ('collapse',)
        }),
        ('Académico', {
            'fields': ('id_turma', 'status_aluno', 'modo_user')
        }),
        ('Segurança', {
            'fields': ('senha_hash', 'is_online', 'img_path'),
            'classes': ('collapse',)
        }),
    )
    
    @display(description='Turma', ordering='id_turma__codigo_turma')
    def turma_badge(self, obj):
        if obj.id_turma:
            return format_html(
                '<span class="badge badge-info">{}</span>',
                obj.id_turma.codigo_turma
            )
        return '-'
    
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
            '<span class="badge badge-{}">{}</span>',
            color, obj.status_aluno
        )
    
    @display(description='Online', boolean=True)
    def online_badge(self, obj):
        return obj.is_online


@admin.register(Turma)
class TurmaAdmin(ModelAdmin):
    list_display = ['id_turma', 'codigo_turma', 'curso_badge', 'classe_badge', 
                    'periodo_badge', 'total_alunos', 'ano']
    list_filter = ['id_curso', 'id_classe', 'id_periodo', 'ano']
    search_fields = ['codigo_turma']
    list_per_page = 20
    
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


@admin.register(Curso)
class CursoAdmin(ModelAdmin):
    list_display = ['id_curso', 'nome_curso', 'area_badge', 'duracao_meses', 'total_turmas']
    list_filter = ['id_area_formacao']
    search_fields = ['nome_curso']
    
    @display(description='Área de Formação')
    def area_badge(self, obj):
        if obj.id_area_formacao:
            return format_html('<span class="badge badge-primary">{}</span>', obj.id_area_formacao.nome_area)
        return '-'
    
    @display(description='Total de Turmas')
    def total_turmas(self, obj):
        total = Turma.objects.filter(id_curso=obj).count()
        return format_html('<span class="badge badge-info">{}</span>', total)


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
admin.site.register(Sala, ModelAdmin)
admin.site.register(Classe, ModelAdmin)
admin.site.register(Departamento, ModelAdmin)
admin.site.register(Seccao, ModelAdmin)
admin.site.register(AreaFormacao, ModelAdmin)
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
admin.site.register(Matricula, ModelAdmin)
admin.site.register(Historico, ModelAdmin)
admin.site.register(HistoricoLogin, ModelAdmin)
