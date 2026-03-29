import os, django, time
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apis.models import Turma

try:
    User = get_user_model()
    user = User.objects.first()

    client = APIClient()
    client.force_authenticate(user=user)
    
    # 1. Total no banco de dados
    db_count = Turma.objects.count()
    print(f"Total de Turmas no BD: {db_count}")

    # 2. Total retornado pela API com page_size=50
    response = client.get('/api/v1/turmas/?page_size=50')
    if response.status_code == 200:
        api_data = response.data
        if isinstance(api_data, dict):
            print(f"API Count Field: {api_data.get('count')}")
            print(f"API Results Length: {len(api_data.get('results', []))}")
            print(f"API Next: {api_data.get('next')}")
            print(f"API Previous: {api_data.get('previous')}")
        else:
            print(f"API results as array: {len(api_data)}")

except Exception as e:
    import traceback
    traceback.print_exc()
