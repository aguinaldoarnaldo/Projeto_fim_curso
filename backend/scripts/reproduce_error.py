import os
import django
import sys
from datetime import date

# Add project root to path
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import AnoLectivo

try:
    print("Tentando criar um novo Ano Lectivo...")
    ano = AnoLectivo(
        nome="2026/2027",
        data_inicio=date(2026, 9, 1),
        data_fim=date(2027, 6, 30),
        status="Planeado" # Ou Activo
    )
    ano.save()
    print(f"Sucesso! Criado: {ano}")
except Exception as e:
    import traceback
    traceback.print_exc()
