import os
import django
import sys

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    django.setup()
    print("Django setup successful")
except Exception as e:
    print(f"Django setup failed: {e}")
    sys.exit(1)

from apis.models import Aluno, Turma

try:
    print(f"Count before: {Aluno.objects.count()}")
    
    # Create simple backup objects
    t, _ = Turma.objects.get_or_create(codigo_turma="TESTE_123")
    
    for i in range(10):
        a = Aluno.objects.create(nome_completo=f"Aluno Teste Rapido {i}", numero_matricula=999000+i)
        print(f"Created {a}")
        
    print(f"Count after: {Aluno.objects.count()}")
    
except Exception as e:
    print(f"Error during population: {e}")
