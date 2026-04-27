import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.usuarios import Encarregado

print("Listing all Encarregados with their emails:")
for e in Encarregado.objects.all():
    print(f"ID: {e.id_encarregado}, Nome: {e.nome_completo}, Email: {e.email!r}")
