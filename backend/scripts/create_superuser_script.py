import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from apis.models import Usuario

def create_admin():
    username = 'admin'
    email = 'admin@escola.com'
    password = 'admin'
    
    # Check by username or email
    if User.objects.filter(username=username).exists():
        print(f"Superusuário '{username}' já existe.")
        u = User.objects.get(username=username)
        u.set_password(password)
        u.save()
        print(f"Senha redefinida para: {password}")
    else:
        u = User.objects.create_superuser(username, email, password)
        print(f"Superusuário '{username}' criado com sucesso.")
        print(f"Email: {email}")
        print(f"Senha: {password}")

    # Ensure Profile
    if not Usuario.objects.filter(user=u).exists():
        # Check if profile exists by email to avoid dupes
        if Usuario.objects.filter(email=email).exists():
             profile = Usuario.objects.get(email=email)
             profile.user = u
             profile.is_superuser = True
             profile.papel = 'Admin'
             profile.save()
             print("Perfil de Usuario existente vinculado ao Django User.")
        else:
            Usuario.objects.create(
                user=u,
                email=email,
                nome_completo="Administrador Geral",
                papel="Admin",
                is_superuser=True,
                permissoes=[],
                senha_hash=u.password
            )
            print("Perfil de Usuario criado.")
    else:
        # Update existing profile
        p = Usuario.objects.get(user=u)
        p.is_superuser = True
        p.papel = 'Admin'
        p.save()
        print("Perfil de Usuario atualizado para Admin.")

if __name__ == "__main__":
    create_admin()
