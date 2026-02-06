import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Classe, Periodo, Curso

def seed_data():
    print("Seeding Basic Academic Data...")
    
    # 1. Classes (10ª, 11ª, 12ª, 13ª)
    classes_data = [
        {'nivel': 10, 'descricao': '10ª Classe'},
        {'nivel': 11, 'descricao': '11ª Classe'},
        {'nivel': 12, 'descricao': '12ª Classe'},
        {'nivel': 13, 'descricao': '13ª Classe'},
    ]
    
    for c_data in classes_data:
        obj, created = Classe.objects.get_or_create(
            nivel=c_data['nivel'],
            defaults={'descricao': c_data['descricao']}
        )
        if created:
            print(f"Created Classe: {obj}")
        else:
            print(f"Classe exists: {obj}")

    # 2. Periodos (Manhã, Tarde, Noite)
    # Using explicit IDs to match frontend hardcoded values if possible, but AutoField handles IDs.
    # Frontend sends 1, 2, 3. We must ensure IDs match or Frontend uses dynamic IDs.
    # Best practice: Frontend fetches Periodos. But Frontend currently hardcodes values="1", "2", "3".
    # We will try to update existing or create.
    
    periodos_data = ['Manhã', 'Tarde', 'Noite']
    for p_name in periodos_data:
        obj, created = Periodo.objects.get_or_create(periodo=p_name)
        print(f"{'Created' if created else 'Exists'} Periodo: {obj} (ID: {obj.id_periodo})")

    # 3. Check Cursos (Need at least one)
    if Curso.objects.count() == 0:
        print("Warning: No Cursos found. Please create a Curso via Admin or API.")
    else:
        print(f"Cursos count: {Curso.objects.count()}")

if __name__ == '__main__':
    seed_data()
