import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Classe, Periodo, Curso, Sala, Turma
from rest_framework.serializers import ValidationError

def check_dependencies():
    print("--- Checking Dependencies ---")
    classes = Classe.objects.all()
    print(f"Classes: {list(classes.values('id_classe', 'nivel'))}")
    
    periodos = Periodo.objects.all()
    print(f"Periodos: {list(periodos.values('id_periodo', 'periodo'))}")
    
    cursos = Curso.objects.all()
    print(f"Cursos: {list(cursos.values('id_curso', 'nome_curso'))}")
    
    salas = Sala.objects.all()
    print(f"Salas: {list(salas.values('id_sala', 'numero_sala'))}")

def try_create_turma():
    print("\n--- Trying to Create Dummy Turma ---")
    try:
        # Get valid IDs if they exist
        classe = Classe.objects.first()
        periodo = Periodo.objects.first()
        curso = Curso.objects.first()
        sala = Sala.objects.first()
        
        if not all([classe, periodo, curso, sala]):
            print("Missing dependencies (Classe, Periodo, Curso, or Sala). Cannot attempt creation.")
            return

        print(f"Using: Classe={classe.id_classe}, Periodo={periodo.id_periodo}, Curso={curso.id_curso}, Sala={sala.id_sala}")
        
        # Simulate Serializer Validation
        from apis.serializers import TurmaSerializer
        data = {
            'codigo_turma': 'TEST_TURMA_XX', # Providing a dummy code
            'id_classe': classe.id_classe,
            'id_periodo': periodo.id_periodo,
            'id_curso': curso.id_curso,
            'id_sala': sala.id_sala,
            'ano': '2024'
        }
        
        print(f"Payload: {data}")
        serializer = TurmaSerializer(data=data)
        if serializer.is_valid():
            print("Serializer Valid!")
            # Don't actually save to avoid polluting DB unless needed
            # instance = serializer.save()
            # print(f"Created Turma: {instance}")
        else:
            print(f"Serializer Errors: {serializer.errors}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == '__main__':
    check_dependencies()
    try_create_turma()
