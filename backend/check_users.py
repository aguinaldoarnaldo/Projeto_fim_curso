import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Funcionario

for f in Funcionario.objects.all():
    print(f"Nome: {f.nome_completo}")
    print(f"Cargo: {f.id_cargo.nome_cargo if f.id_cargo else 'Nenhum'}")
    print(f"Permissões: {f.permissoes_adicionais}")
    print("---")
