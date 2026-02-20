import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.matriculas import Matricula
from django.db.models import Count

print("--- MATRICULAS PER YEAR ---")
stats = Matricula.objects.values('ano_lectivo__nome', 'ano_lectivo__id_ano').annotate(total=Count('id_matricula'))
for s in stats:
    print(f"Ano: {s['ano_lectivo__nome']} (ID: {s['ano_lectivo__id_ano']}) tem {s['total']} matriculas.")

null_mat = Matricula.objects.filter(ano_lectivo__isnull=True).count()
print(f"Matriculas sem ano lectivo: {null_mat}")
