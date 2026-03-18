import os
import sys
import django

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Usuario, Aluno, Funcionario
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

def reset_test_user():
    email = 'aguinaldoarnaldo5@gmail.com'
    new_pass = 'Admin@123'
    hashed = make_password(new_pass)
    
    print(f"--- Resetting password for {email} to '{new_pass}' ---")
    
    # Reset in Usuario
    try:
        u = Usuario.objects.get(email__iexact=email)
        u.senha_hash = hashed
        if u.user:
            u.user.set_password(new_pass)
            u.user.save()
            print(f"  [+] Updated Django User: {u.user.username}")
        u.save()
        print("  [+] Updated Usuario table.")
    except Usuario.DoesNotExist:
        print("  [!] Usuario not found.")

    # Reset in Aluno
    try:
        a = Aluno.objects.get(email__iexact=email)
        a.senha_hash = hashed
        Aluno.objects.filter(pk=a.pk).update(senha_hash=hashed)
        print("  [+] Updated Aluno table.")
    except Aluno.DoesNotExist:
        print("  [!] Aluno not found.")

    # Also check aguinaldoarnaldo66@gmail.com which had empty password
    email2 = 'aguinaldoarnaldo66@gmail.com'
    try:
        u2 = Usuario.objects.get(email__iexact=email2)
        u2.senha_hash = hashed
        if u2.user:
            u2.user.set_password(new_pass)
            u2.user.save()
        u2.save()
        print(f"  [+] Reset {email2} password to '{new_pass}' as well.")
    except: pass

if __name__ == "__main__":
    reset_test_user()
