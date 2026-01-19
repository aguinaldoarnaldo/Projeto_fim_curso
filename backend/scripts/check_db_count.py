import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Aluno, Turma, Curso, Funcionario

print(f"Alunos count: {Aluno.objects.count()}")
print(f"Turmas count: {Turma.objects.count()}")
print(f"Cursos count: {Curso.objects.count()}")
print(f"Funcionarios count: {Funcionario.objects.count()}")
