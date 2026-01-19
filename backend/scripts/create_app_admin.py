import os
import sys
import django

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Funcionario, Cargo

def create_admin():
    cargo, _ = Cargo.objects.get_or_create(nome_cargo="Administrador")
    
    email = "admin@school.com"
    if not Funcionario.objects.filter(email=email).exists():
        Funcionario.objects.create(
            nome_completo="Administrador do Sistema",
            email=email,
            senha_hash="Aguinaldo", 
            id_cargo=cargo,
            codigo_identificacao="ADM001",
            status_funcionario="Activo"
        )
        print(f"SUCESSO: Usuario criado!")
        print(f"Email: {email}")
        print(f"Senha: Aguinaldo")
    else:
        # Reset password to ensure it works
        f = Funcionario.objects.get(email=email)
        f.senha_hash = "Aguinaldo"
        f.save()
        print(f"ATUALIZADO: Usuario {email} senha redefinida para 'Aguinaldo'")

if __name__ == "__main__":
    create_admin()
