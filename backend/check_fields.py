
import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import HistoricoEscolar, Matricula

print("Checking specific fields:")
try:
    f = HistoricoEscolar._meta.get_field('ano_lectivo')
    print(f"HistoricoEscolar.ano_lectivo: {type(f)} - internal_type={f.get_internal_type()}")
except Exception as e:
    print(f"HistoricoEscolar.ano_lectivo error: {e}")

try:
    f = Matricula._meta.get_field('ano_lectivo')
    print(f"Matricula.ano_lectivo: {type(f)} - internal_type={f.get_internal_type()}")
except Exception as e:
    print(f"Matricula.ano_lectivo error: {e}")
