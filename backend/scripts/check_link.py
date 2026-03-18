import os
import sys
import django

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Usuario
from django.contrib.auth.models import User

def check_link():
    email = 'aguinaldoarnaldo66@gmail.com'
    try:
        u = Usuario.objects.get(email=email)
        print(f"Usuario {email}:")
        print(f"  ID: {u.id_usuario}")
        print(f"  Senha Hash in DB: '{u.senha_hash}'")
        print(f"  Linked Django User: {u.user}")
        if u.user:
            print(f"  Django User ID: {u.user.id}")
            print(f"  Django User Password: {u.user.password[:20]}...")
    except Usuario.DoesNotExist:
        print(f"Usuario {email} not found.")

if __name__ == "__main__":
    check_link()
