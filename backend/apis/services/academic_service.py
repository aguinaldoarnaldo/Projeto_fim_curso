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
    def determinar_tipo_matricula(aluno_id):
        """
        Determina o tipo de matrícula sugerido com base nas notas do aluno no ano anterior.
        """
        from apis.models import Matricula, Nota
        
        # 1. Obter a última matrícula ativa concluída ou do ano anterior
        ultima_matricula = Matricula.objects.filter(id_aluno_id=aluno_id).order_by('-ano_lectivo__data_fim').first()
        
        if not ultima_matricula:
            return 'Novo'
        
        # 2. Verificar desempenho no ano dessa última matrícula
        ano_anterior = ultima_matricula.ano_lectivo
        turma_anterior = ultima_matricula.id_turma
        
        if not ano_anterior or not turma_anterior:
            return 'Confirmacao'

        # Obter disciplinas daquele curso/classe (ou simplesmente as que ele tem nota)
        notas = Nota.objects.filter(id_aluno_id=aluno_id, id_turma=turma_anterior)
        
        if not notas.exists():
            return 'Confirmacao' # Sem notas registradas, assume progressão normal

        # Lógica de aprovação: Agrupar por disciplina e calcular média
        desempenho = {}
        for n in notas:
            if n.id_disciplina_id not in desempenho:
                desempenho[n.id_disciplina_id] = []
            desempenho[n.id_disciplina_id].append(float(n.valor))
            
        disciplinas_reprovadas = 0
        for disc_id, vals in desempenho.items():
            media = sum(vals) / len(vals)
            if media < 10:
                disciplinas_reprovadas += 1
        
        # 3. Decidir tipo
        if disciplinas_reprovadas == 0:
            return 'Confirmacao'
        elif disciplinas_reprovadas <= 2:
            return 'Reenquadramento'
        else:
            return 'Repetente'

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
