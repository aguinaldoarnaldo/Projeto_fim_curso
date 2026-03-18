import os
import sys
import django

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Usuario, Aluno

def sync_it():
    email = 'aguinaldoarnaldo5@gmail.com'
    try:
        u = Usuario.objects.get(email__iexact=email)
        a = Aluno.objects.get(email__iexact=email)
        
        # Syncing Usuario to Aluno's password hash (assuming Aluno is the one they usually use)
        # Actually, let's sync both to a common one if we knew it, 
        # but the safest is to make them identical.
        u.senha_hash = a.senha_hash
        u.save()
        
        # Also sync Django User if linked
        if u.user:
            u.user.password = a.senha_hash
            u.user.save()
            
        print(f"Successfully synced passwords for {email} across Usuario, Aluno and Auth User.")
    except Exception as e:
        print(f"Sync failed: {e}")

if __name__ == "__main__":
    sync_it()
