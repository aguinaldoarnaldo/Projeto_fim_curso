import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Sala
from apis.serializers import SalaSerializer
from rest_framework.renderers import JSONRenderer

try:
    count = Sala.objects.count()
    print(f"Total Salas in DB: {count}")

    if count == 0:
        print("Creating a sample Sala...")
        Sala.objects.create(numero_sala=101, capacidade_alunos=30, bloco='A')
        Sala.objects.create(numero_sala=102, capacidade_alunos=35, bloco='B')
        print("Sample Salas created.")

    salas = Sala.objects.all()
    serializer = SalaSerializer(salas, many=True)
    json_data = JSONRenderer().render(serializer.data)
    print("Serialized Data Preview:")
    print(json_data.decode('utf-8'))
    
except Exception as e:
    print(f"Error: {e}")
