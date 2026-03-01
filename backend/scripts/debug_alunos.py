import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.alunos import Aluno

print("--- ALUNO TURMA LINK ---")
total = Aluno.objects.count()
sem_turma = Aluno.objects.filter(id_turma__isnull=True).count()
print(f"Total alunos: {total}")
print(f"Alunos sem turma: {sem_turma}")

if sem_turma > 0:
    ex = Aluno.objects.filter(id_turma__isnull=True)[:5]
    for a in ex:
        print(f"  {a.nome_completo} (ID: {a.pk})")
