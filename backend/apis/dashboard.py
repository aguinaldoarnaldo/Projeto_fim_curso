
from django.db.models import Count, Avg, Sum
from apis.models import (
    Aluno, Funcionario, Turma, Curso, Fatura, Nota
)

def dashboard_callback(request, context):
    """
    Callback para popular o dashboard do Django Unfold.
    """
    try:
        # Estatísticas gerais
        total_alunos = Aluno.objects.filter(status_aluno='Activo').count()
        total_funcionarios = Funcionario.objects.filter(status_funcionario='Activo').count()
        total_turmas = Turma.objects.count()
        total_cursos = Curso.objects.count()
        
        # Faturas pendentes
        faturas_pendentes = Fatura.objects.filter(status='pendente').count()
        total_pendente = Fatura.objects.filter(status='pendente').aggregate(total=Sum('total'))['total'] or 0
        
        # Média geral de notas # CORRIGIDO: filter(valor__isnull=False) para evitar erros
        media_geral = Nota.objects.filter(valor__isnull=False).aggregate(media=Avg('valor'))['media'] or 0

        # Alunos por curso
        alunos_por_curso = Aluno.objects.values('id_turma__id_curso__nome_curso').annotate(total=Count('id_aluno'))
        labels_cursos = [x['id_turma__id_curso__nome_curso'] for x in alunos_por_curso if x['id_turma__id_curso__nome_curso']] # Filter None
        data_cursos = [x['total'] for x in alunos_por_curso if x['id_turma__id_curso__nome_curso']]

        # Média por turma
        media_por_turma = Nota.objects.values('id_aluno__id_turma__codigo_turma').annotate(media=Avg('valor'))
        labels_turmas = [x['id_aluno__id_turma__codigo_turma'] for x in media_por_turma if x['id_aluno__id_turma__codigo_turma']] # Filter None
        data_medias = [x['media'] for x in media_por_turma if x['id_aluno__id_turma__codigo_turma']]

        print(f"DEBUG DASHBOARD: Alunos={total_alunos}, Func={total_funcionarios}")
        print(f"DEBUG DASHBOARD: Labels Cursos={labels_cursos}")
        print(f"DEBUG DASHBOARD: Data Cursos={data_cursos}")

        # KPIs do dashboard
        context.update({
            "kpis": [
                {
                    'title': 'Comunidade Escolar',
                    'metric': f"{total_alunos + total_funcionarios}",
                    'footer': f"{total_alunos + total_funcionarios} usuários",
                    'icon': 'diversity_3',
                    'color': 'primary',
                },
                {
                    'title': 'Desempenho Académico',
                    'metric': f"{media_geral:.1f}",
                    'footer': 'Média geral das avaliações',
                    'icon': 'trending_up',
                    'color': 'success' if media_geral >= 10 else 'danger',
                },
                {
                    'title': 'Saúde Financeira',
                    'metric': f"{total_pendente:,.2f} Kz",
                    'footer': f'{faturas_pendentes} faturas pendentes',
                    'icon': 'account_balance_wallet',
                    'color': 'info',
                },
            ],
            # Dados para gráficos no Unfold
            "charts": [
                {
                    "title": "Alunos por Curso",
                    "type": "bar",
                    "labels": labels_cursos,
                    "datasets": [
                        {
                            "label": "Alunos",
                            "data": data_cursos,
                            "backgroundColor": "rgba(16, 185, 129, 0.7)"
                        }
                    ]
                },
                {
                    "title": "Média de Notas por Turma",
                    "type": "line",
                    "labels": labels_turmas,
                    "datasets": [
                        {
                            "label": "Média",
                            "data": data_medias,
                            "borderColor": "rgba(52, 211, 153, 1)",
                            "fill": False
                        }
                    ]
                }
            ]
        })
    except Exception as e:
        print(f"ERRO DASHBOARD: {e}")
        # Retornar contexto limpo/seguro em caso de erro
        context.update({"kpis": [], "charts": []})
    
    return context
