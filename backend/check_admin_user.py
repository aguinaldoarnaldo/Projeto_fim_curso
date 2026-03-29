import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

print("Recent users:")
for u in User.objects.all().order_by('-date_joined')[:5]:
    print(f"User ID: {u.id}, Username: {u.username}, Superuser: {u.is_superuser}")
    
    if hasattr(u, 'funcionario_perfil'):
        f = u.funcionario_perfil
        cargo_name = f.id_cargo.nome_cargo if f.id_cargo else 'None'
        print(f" -> Funcionario: {f.nome_completo}, Cargo Real: {cargo_name}, Papel?: {getattr(f, 'papel', 'N/A')}, Perms: {f.permissoes_adicionais}")
    
    if hasattr(u, 'profile'):
        p = u.profile
        profile_cargo = p.cargo.nome_cargo if getattr(p, 'cargo', None) else 'None'
        print(f" -> Profile: Papel={p.papel}, Cargo={profile_cargo}, Perms={p.permissoes}")
        
    print("---")
