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

def fix_passwords():
    print("--- Fixing Passwords ---")
    
    tables = {
        'Usuario': Usuario,
        'Funcionario': Funcionario,
        'Aluno': Aluno,
        'Encarregado': Encarregado
    }
    
    for name, model in tables.items():
        users = model.objects.all()
        print(f"\nProcessing {name}...")
        count = 0
        for u in users:
            h = u.senha_hash
            if h and not (h.startswith('pbkdf2_sha256$') or h.startswith('bcrypt$') or h.startswith('argon2$')):
                # It's plaintext!
                print(f"  [!] Hashing plaintext password for {getattr(u, 'email', 'unknown user')}")
                u.senha_hash = make_password(h)
                u.save()
                count += 1
                
                # If it's a Usuario linked to a Django User, sync it too if not already synced
                if name == 'Usuario' and u.user:
                    # We don't know the raw password here, so we set a random one or keep as is?
                    # Actually, if the Usuario table has the plaintext, we probably want the Django User to have it too.
                    # But we only have the raw password 'h' BEFORE we hashed it.
                    u.user.set_password(h)
                    u.user.save()
                    print(f"    [+] Synced with Django User: {u.user.username}")
        
        print(f"  Fixed {count} {name} records.")

if __name__ == "__main__":
    fix_passwords()
