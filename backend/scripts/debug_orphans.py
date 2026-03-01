import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.matriculas import Matricula

total = Matricula.objects.count()
null_turma = Matricula.objects.filter(id_turma__isnull=True).count()
print(f"Total matriculas: {total}")
print(f"Matriculas sem turma: {null_turma}")
