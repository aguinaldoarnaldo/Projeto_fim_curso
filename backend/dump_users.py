import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

with open('output.txt', 'w') as f:
    f.write("Recent users:\n")
    for u in User.objects.all().order_by('-date_joined')[:5]:
        f.write(f"User ID: {u.id}, Username: {u.username}, Superuser: {u.is_superuser}\n")
        
        if hasattr(u, 'funcionario_perfil'):
            fp = u.funcionario_perfil
            cargo_name = fp.id_cargo.nome_cargo if fp.id_cargo else 'None'
            f.write(f" -> Funcionario: {fp.nome_completo}, Cargo Real: {cargo_name}, Papel?: {getattr(fp, 'papel', 'N/A')}, Perms: {fp.permissoes_adicionais}\n")
        
        if hasattr(u, 'profile'):
            p = u.profile
            profile_cargo = p.cargo.nome_cargo if getattr(p, 'cargo', None) else 'None'
            f.write(f" -> Profile: Papel={p.papel}, Cargo={profile_cargo}, Perms={p.permissoes}\n")
            
        f.write("---\n")
