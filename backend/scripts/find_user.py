import os
import sys
import django

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Usuario, Funcionario, Aluno, Encarregado

def find_user_everywhere():
    email = 'aguinaldoarnaldo5@gmail.com'
    tables = {
        'Usuario': Usuario,
        'Funcionario': Funcionario,
        'Aluno': Aluno,
        'Encarregado': Encarregado
    }
    
    for name, model in tables.items():
        try:
            u = model.objects.get(email__iexact=email)
            print(f"Found in {name}: ID={u.pk}, Password='{u.senha_hash[:10]}...'")
        except model.DoesNotExist:
            pass

if __name__ == "__main__":
    find_user_everywhere()
