import os
import sys
import django

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.services.auth_service import AuthService

def test_auth():
    email = 'aguinaldoarnaldo5@gmail.com'
    password = 'Admin@123'
    
    print(f"Testing auth for {email}")
    
    for user_type in ['funcionario', 'usuario', 'aluno', 'encarregado']:
        print(f"\n--- Trying _perform_auth as {user_type} ---")
        try:
            user, data = AuthService._perform_auth(email, password, user_type)
            print("[+] SUCCESS")
            print(f"User: {user}")
            print(f"Data: {data}")
        except Exception as e:
            print(f"[-] FAILED with: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc(limit=2)

if __name__ == "__main__":
    test_auth()
