
import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Matricula

# Check for Telma's enrollment details
print("Checking Telma João...")
matriculas = Matricula.objects.filter(id_aluno__nome_completo__icontains='Telma João')

for m in matriculas:
    ano_status = "ATIVO" if m.ano_lectivo.activo else "INATIVO/ENCERRADO"
    print(f"ID: {m.id_matricula}, Status: {m.status}, Ano Lectivo: {m.ano_lectivo.nome} ({ano_status})")
