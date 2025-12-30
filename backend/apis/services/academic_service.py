from django.db.models import Avg
from apis.models import Nota, FaltaAluno, Aluno

class AcademicService:
    """
    Serviço para gestão de notas, faltas e desempenho académico
    """
    
    @staticmethod
    def calcular_media_disciplina(aluno_id, disciplina_id):
        """
        Calcula a média de um aluno em uma disciplina específica
        """
        notas = Nota.objects.filter(id_aluno_id=aluno_id, id_disciplina_id=disciplina_id)
        if not notas.exists():
            return 0
            
        media = notas.aggregate(Avg('valor'))['valor__avg']
        return round(media, 2)

    @staticmethod
    def obter_resumo_academico(aluno_id):
        """
        Retorna um resumo completo do desempenho do aluno
        """
        aluno = Aluno.objects.get(id_aluno=aluno_id)
        notas = Nota.objects.filter(id_aluno=aluno)
        faltas = FaltaAluno.objects.filter(id_aluno=aluno).count()
        
        media_geral = notas.aggregate(Avg('valor'))['valor__avg'] or 0
        
        # Agrupar por disciplina
        disciplinas_stats = {}
        for nota in notas:
            disc_nome = nota.id_disciplina.nome
            if disc_nome not in disciplinas_stats:
                disciplinas_stats[disc_nome] = []
            disciplinas_stats[disc_nome].append(float(nota.valor))
            
        resumo_disciplinas = [
            {
                'disciplina': nome,
                'media': round(sum(vals)/len(vals), 2),
                'total_avaliacoes': len(vals)
            }
            for nome, vals in disciplinas_stats.items()
        ]
        
        return {
            'aluno': aluno.nome_completo,
            'media_geral': round(media_geral, 2),
            'total_faltas': faltas,
            'desempenho_por_disciplina': resumo_disciplinas,
            'situacao': 'Aprovado' if media_geral >= 10 else 'Reprovado' # Lógica simplificada
        }

    @staticmethod
    def registrar_falta_lote(aluno_ids, disciplina_id, turma_id, data_falta, justificativa=None):
        """
        Registra faltas para vários alunos ao mesmo tempo
        """
        faltas_criadas = []
        for a_id in aluno_ids:
            falta = FaltaAluno.objects.create(
                id_aluno_id=a_id,
                id_disciplina_id=disciplina_id,
                id_turma_id=turma_id,
                data_falta=data_falta,
                observacao=justificativa
            )
            faltas_criadas.append(falta)
        return len(faltas_criadas)
