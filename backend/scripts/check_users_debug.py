import os
import sys
import django

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Usuario, Funcionario, Aluno, Encarregado
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, is_password_usable

def check_users():
    print("--- User Check Report ---")
    
    tables = {
        'Usuario': Usuario,
        'Funcionario': Funcionario,
        'Aluno': Aluno,
        'Encarregado': Encarregado
    }
    
    for name, model in tables.items():
        users = model.objects.all()
        print(f"\n{name} count: {users.count()}")
        for u in users:
            email = getattr(u, 'email', 'N/A') or 'EMPTY'
            h = getattr(u, 'senha_hash', None)
            
            if h is None:
                print(f"  [!] {name} ({email}): HASH IS NULL")
                continue
                
            if h == "":
                print(f"  [!] {name} ({email}): HASH IS EMPTY STRING")
                continue
                
            is_valid_hash = h.startswith('pbkdf2_sha256$') or h.startswith('bcrypt$') or h.startswith('argon2$')
            
            if not is_valid_hash:
                print(f"  [!] {name} ({email}): HASH IS INVALID/PLAINTEXT: '{h}'")

if __name__ == "__main__":
    check_users()
