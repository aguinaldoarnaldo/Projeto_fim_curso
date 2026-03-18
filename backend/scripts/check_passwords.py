import os
import sys
import django

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Usuario, Aluno
from django.contrib.auth.hashers import check_password

def check_passwords():
    email = 'aguinaldoarnaldo5@gmail.com'
    password = 'the_password_the_user_might_be_using' # We can't know, but we can check if they are the same hash
    
    u = Usuario.objects.get(email__iexact=email)
    a = Aluno.objects.get(email__iexact=email)
    
    print(f"Usuario Password Hash: {u.senha_hash[:30]}...")
    print(f"Aluno Password Hash:   {a.senha_hash[:30]}...")
    
    if u.senha_hash == a.senha_hash:
        print("Passwords are IDENTICAL.")
    else:
        print("Passwords are DIFFERENT.")

if __name__ == "__main__":
    check_passwords()
