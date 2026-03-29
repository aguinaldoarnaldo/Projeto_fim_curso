import os, django, time
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apis.models import Aluno, Matricula, Turma

try:
    User = get_user_model()
    user = User.objects.first()

    client = APIClient()
    client.force_authenticate(user=user)
    
    for endpoint in ['alunos', 'matriculas', 'turmas', 'cursos']:
        response = client.get(f'/api/v1/{endpoint}/?page_size=5000')
        if response.status_code == 200:
            data = response.data
            count = data.get('count', len(data))
            results = data.get('results', data)
            print(f"Endpoint: {endpoint}")
            print(f"  Total DB/Count: {count}")
            print(f"  Results length: {len(results)}")
            print(f"  Next: {data.get('next') if isinstance(data, dict) else 'N/A'}")
        else:
            print(f"Endpoint {endpoint} error: {response.status_code}")

except Exception as e:
    import traceback
    traceback.print_exc()
