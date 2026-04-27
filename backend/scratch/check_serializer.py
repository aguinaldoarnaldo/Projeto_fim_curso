import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.alunos import Aluno
from apis.serializers.aluno_serializers import AlunoListSerializer

print("Checking AlunoListSerializer for Manuel Gones...")
aluno = Aluno.objects.filter(nome_completo__icontains='Manuel Gones').first()
if aluno:
    serializer = AlunoListSerializer(aluno)
    print("Email Aluno:", serializer.data.get('email'))
    print("Encarregado Principal Data:")
    import json
    print(json.dumps(serializer.data.get('encarregado_principal'), indent=2))
else:
    print("Manuel Gones not found.")
