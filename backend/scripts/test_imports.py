import os
import sys
import django

# Add the current directory to sys.path
sys.path.append(os.getcwd())

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

try:
    from apis.models import Aluno, Matricula, Turma, Encarregado, AlunoEncarregado
    print("SUCCESS: apis.models imported correctly at runtime!")
    print(f"Imported Aluno: {Aluno}")
except ImportError as e:
    print(f"FAILED: {e}")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"ERROR: {e}")
