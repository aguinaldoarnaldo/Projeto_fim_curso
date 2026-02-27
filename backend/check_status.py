
import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Matricula

# Check for statuses
print("Checking Matricula statuses...")
matriculas = Matricula.objects.all()
for m in matriculas:
    if m.status not in ['Ativa', 'Concluida', 'Desistente', 'Transferido']:
        print(f"ID: {m.id_matricula}, Aluno: {m.id_aluno.nome_completo}, Status Found: '{m.status}' (Invalid/Old)")
    elif m.id_aluno.nome_completo.lower().startswith('telma'):
        print(f"ID: {m.id_matricula}, Aluno: {m.id_aluno.nome_completo}, Status Found: '{m.status}'")

print("Done.")
