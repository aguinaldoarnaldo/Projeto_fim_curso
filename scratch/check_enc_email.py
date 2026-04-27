import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.projeto_fim_curso.settings')
django.setup()

from apis.models import Aluno, AlunoEncarregado
from apis.serializers.aluno_serializers import AlunoListSerializer

# Get a student that has an encarregado
ae = AlunoEncarregado.objects.select_related('id_aluno', 'id_encarregado').first()
if ae:
    aluno = ae.id_aluno
    serializer = AlunoListSerializer(aluno)
    print("Encarregado Principal Data:")
    print(serializer.data['encarregado_principal'])
else:
    print("No AlunoEncarregado relationship found.")
