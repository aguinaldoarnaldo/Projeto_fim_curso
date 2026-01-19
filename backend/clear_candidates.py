import os
import django
import sys

# Add project root to path
# Assuming this file is in backend/ which is the root of django project
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'setup.settings')
django.setup()

from apis.models import Candidato

count = Candidato.objects.count()
print(f"Encontrados {count} candidatos no banco de dados.")
print("Removendo todos os candidatos...")
Candidato.objects.all().delete()
print("Todos os candidatos foram removidos com sucesso.")
