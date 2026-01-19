import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

username = 'admin'
email = 'aguinaldoarnaldo5@gmail.com'
password = 'Aguinaldo'

print(f"--- Verificando credenciais ---")
print(f"Tentando buscar usuario por username: {username}")
try:
    u = User.objects.get(username=username)
    print(f"Usuario encontrado: {u.username}, email: {u.email}, is_active: {u.is_active}")
    print(f"Verificando senha '{password}'...")
    if u.check_password(password):
        print("SENHA CORRETA (via check_password)")
    else:
        print("SENHA INCORRETA (via check_password)")
        
    user_auth = authenticate(username=username, password=password)
    if user_auth:
        print("Autenticacao OK (via authenticate)")
    else:
        print("Autenticacao FALHOU (via authenticate)")

except User.DoesNotExist:
    print("Usuario 'admin' nao encontrado.")

print(f"--- Fim ---")
