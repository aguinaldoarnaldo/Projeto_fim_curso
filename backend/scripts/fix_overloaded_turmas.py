import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.academico import Turma, AnoLectivo
from apis.models.matriculas import Matricula
from apis.models.alunos import Aluno

def fix_capacities():
    active_year = AnoLectivo.get_active_year()
    if not active_year:
        print("No active year found.")
        return

    turmas = Turma.objects.filter(status='Ativa', ano_lectivo=active_year)
    for turma in turmas:
        capacidade = turma.capacidade # Use custom capacity, not sala capacity
        
        matriculas = list(Matricula.objects.filter(
            id_turma=turma,
            status__in=['Ativa', 'Concluida']
        ).order_by('id_matricula'))
        
        count = len(matriculas)
        if count > capacidade:
            excess = count - capacidade
            print(f"--- Turma {turma.codigo_turma} has {count}/{capacidade} Matriculas. Moving {excess} students ---")
            
            excess_matriculas = matriculas[-excess:]
            
            for m in excess_matriculas:
                # We will just un-enroll them from this turma to fix the capacity.
                # In real life, they need to be manually re-enrolled or distributed again.
                Matricula.objects.filter(pk=m.pk).update(id_turma=None)
                if m.id_aluno.id_turma_id == turma.pk:
                    Aluno.objects.filter(pk=m.id_aluno.pk).update(id_turma=None, status_aluno='Concluido')
                print(f" Removed turma for {m.id_aluno.nome_completo}.")
                
        # Now fix Alunos count specifically (since user frontend is still querying Alunos)
        alunos = list(Aluno.objects.filter(id_turma=turma, status_aluno__in=['Activo', 'Ativo']).order_by('id_aluno'))
        a_count = len(alunos)
        if a_count > capacidade:
            a_excess = a_count - capacidade
            print(f"--- Turma {turma.codigo_turma} has {a_count}/{capacidade} Alunos. Un-linking {a_excess} students ---")
            excess_alunos = alunos[-a_excess:]
            for aln in excess_alunos:
                Aluno.objects.filter(pk=aln.pk).update(id_turma=None, status_aluno='Concluido')
                print(f" Unlinked Aluno {aln.nome_completo}.")

if __name__ == '__main__':
    fix_capacities()
    print("Done redistributing.")
