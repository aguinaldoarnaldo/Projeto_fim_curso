import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from apis.models import Curso
print(f"Total Cursos: {Curso.objects.count()}")
for c in Curso.objects.all():
    print(f"- {c.nome_curso} ({c.duracao_meses} meses)")
