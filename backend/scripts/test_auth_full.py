import os
import sys
import django

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.services.auth_service import AuthService

def test_full_auth():
    email = 'aguinaldoarnaldo5@gmail.com'
    password = 'Admin@123'
    
    print(f"Testing FULL auth for {email}")
    
    try:
        user, data = AuthService.authenticate_user(email, password, 'usuario')
        print("[+] SUCCESS")
        print(f"User: {user}")
        print(f"Data: {data}")
    except Exception as e:
        print(f"[-] FAILED with: {type(e).__name__}: {str(e)}")

        import traceback
        traceback.print_exc(limit=4)

if __name__ == "__main__":
    test_full_auth()
