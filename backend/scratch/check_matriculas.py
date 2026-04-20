import os
import django
import sys

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Aluno, Matricula

def check_data():
    print("Contagem de Alunos:", Aluno.objects.count())
    print("Contagem de Matrículas:", Matricula.objects.count())
    
    print("\nExemplo de 5 Alunos e suas Matrículas:")
    for aluno in Aluno.objects.all()[:5]:
        mats = aluno.matricula_set.all()
        print(f"Aluno: {aluno.nome_completo} (ID: {aluno.id_aluno})")
        print(f"  Turma no Aluno: {aluno.id_turma}")
        print(f"  Matrículas encontradas: {mats.count()}")
        for m in mats:
            print(f"    - ID: {m.id_matricula}, Nº: {m.numero_matricula}, Turma: {m.id_turma}")

if __name__ == "__main__":
    check_data()
