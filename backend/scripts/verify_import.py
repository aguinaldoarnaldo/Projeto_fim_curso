import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import django
import csv
import io
# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User

from apis.models import Aluno, Matricula, Turma, AnoLectivo, Funcionario
from apis.views.matricula_views import MatriculaViewSet

def test_csv_import():
    print("--- Iniciando Teste de Importação CSV ---")
    
    # 1. Setup Data
    ano, _ = AnoLectivo.objects.get_or_create(nome="2026/TEST", defaults={'activo': True, 'data_inicio': '2026-01-01', 'data_fim': '2026-12-31'})
    # Ensure it's active
    AnoLectivo.objects.filter(pk=ano.pk).update(activo=True)
    
    turma, _ = Turma.objects.get_or_create(codigo_turma="TEST101", defaults={'ano': 2026})
    
    # User for auth
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        user = User.objects.create_superuser('admin_test', 'admin@test.com', 'admin123')

    # 2. Create CSV Content
    csv_content = (
        "nome_completo,numero_bi,data_nascimento,genero,turma_codigo\n"
        "Aluno Teste Import,999999999LA99,2005-01-01,M,TEST101\n"
        "Maria Teste Import,888888888LA88,2006-02-02,F,TEST101"
    )
    
    csv_file = SimpleUploadedFile("test.csv", csv_content.encode('utf-8'), content_type="text/csv")

    # 3. Call ViewSet
    factory = APIRequestFactory()
    view = MatriculaViewSet.as_view({'post': 'importar_csv'})
    
    request = factory.post('/api/matriculas/importar_csv/', {'arquivo_csv': csv_file}, format='multipart')
    force_authenticate(request, user=user)
    
    response = view(request)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.data}")

    # 4. Verify Results
    if response.status_code == 200:
        a1 = Aluno.objects.filter(numero_bi='999999999LA99').first()
        a2 = Aluno.objects.filter(numero_bi='888888888LA88').first()
        
        if a1 and a2:
            print("SUCESSO: Alunos criados!")
            m1 = Matricula.objects.filter(id_aluno=a1, ano_lectivo=ano).exists()
            m2 = Matricula.objects.filter(id_aluno=a2, ano_lectivo=ano).exists()
            if m1 and m2:
                print("SUCESSO: Matrículas vinculadas!")
            else:
                print("FALHA: Matrículas não encontradas.")
        else:
            print("FALHA: Alunos não encontrados no DB.")
    else:
        print("FALHA: Resposta da API não foi 200.")

if __name__ == '__main__':
    test_csv_import()
