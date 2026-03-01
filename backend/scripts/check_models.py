
import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import HistoricoEscolar, Matricula, AnoLectivo

print("Checking HistoricoEscolar fields:")
for field in HistoricoEscolar._meta.fields:
    print(f"  {field.name}: {type(field)}")

print("\nChecking Matricula fields:")
for field in Matricula._meta.fields:
    print(f"  {field.name}: {type(field)}")

print("\nChecking AnoLectivo fields:")
for field in AnoLectivo._meta.fields:
    print(f"  {field.name}: {type(field)}")
