import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.alunos import Aluno
from apis.models.matriculas import Matricula
from apis.models.academico import Turma, AnoLectivo

def update_statuses():
    print("Iniciando atualização de estados para 'Ativo'...")
    
    # 1. Alunos
    count_alunos = Aluno.objects.filter(status_aluno__in=['Activo', 'Ativa']).update(status_aluno='Ativo')
    print(f"Alunos atualizados: {count_alunos}")
    
    # 2. Matrículas
    count_matriculas = Matricula.objects.filter(status__in=['Activa', 'Ativo', 'Activo']).update(status='Ativa')
    print(f"Matrículas atualizadas: {count_matriculas}")
    
    # 3. Turmas
    count_turmas = Turma.objects.filter(status__in=['Activa', 'Ativo', 'Activo']).update(status='Ativa')
    print(f"Turmas atualizadas: {count_turmas}")
    
    # 4. Anos Lectivos
    count_anos = AnoLectivo.objects.filter(status__in=['Activo', 'Ativa']).update(status='Ativo')
    print(f"Anos Lectivos atualizados: {count_anos}")
    
    print("Atualização concluída com sucesso!")

if __name__ == "__main__":
    update_statuses()
