import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.alunos import Aluno, AlunoEncarregado

print("Searching for Manuel Gones...")
alunos = Aluno.objects.filter(nome_completo__icontains='Manuel Gones')
for a in alunos:
    print(f"Aluno ID: {a.id_aluno}, Nome: {a.nome_completo}, Email: {a.email!r}")
    ae_list = AlunoEncarregado.objects.filter(id_aluno=a).select_related('id_encarregado')
    for ae in ae_list:
        e = ae.id_encarregado
        print(f"  Encarregado: {e.nome_completo}, ID: {e.id_encarregado}, Email: {e.email!r}")
