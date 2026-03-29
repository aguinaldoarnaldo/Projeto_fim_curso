import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

import json
from django.contrib.auth.models import User

results = []
for u in User.objects.all().order_by('-date_joined')[:5]:
    user_data = {
        "User ID": u.id,
        "Username": u.username,
        "Superuser": u.is_superuser,
        "Funcionario": None,
        "Profile": None
    }
    
    if hasattr(u, 'funcionario_perfil'):
        fp = u.funcionario_perfil
        cargo_name = fp.id_cargo.nome_cargo if fp.id_cargo else 'None'
        user_data["Funcionario"] = {
            "Nome": fp.nome_completo,
            "Cargo": cargo_name,
            "Papel": getattr(fp, 'papel', 'N/A'),
            "Permissoes": fp.permissoes_adicionais
        }
    
    if hasattr(u, 'profile'):
        p = u.profile
        profile_cargo = p.cargo.nome_cargo if getattr(p, 'cargo', None) else 'None'
        user_data["Profile"] = {
            "Papel": p.papel,
            "Cargo": profile_cargo,
            "Permissoes": p.permissoes
        }
        
    results.append(user_data)

with open('output.json', 'w') as f:
    json.dump(results, f, indent=4)
