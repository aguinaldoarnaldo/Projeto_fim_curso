import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.academico import AnoLectivo, Sala, Curso
from django.db.models import Count

def check_duplicates(model, field):
    print(f"Checking {model.__name__}.{field}...")
    duplicates = model.objects.values(field).annotate(count=Count('pk')).filter(count__gt=1)
    if duplicates.exists():
        print(f"  FOUND DUPLICATES in {model.__name__} for field {field}:")
        for d in duplicates:
            print(f"    - {field}: {d[field]}, count: {d['count']}")
    else:
        print(f"  Result: OK (no duplicates)")

check_duplicates(AnoLectivo, 'nome')
check_duplicates(Sala, 'numero_sala')
check_duplicates(Curso, 'nome_curso')
