
import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Matricula, AnoLectivo

def fix_enrollments():
    # 1. Find all closed academic years
    closed_years = AnoLectivo.objects.filter(activo=False)
    
    if not closed_years.exists():
        print("No closed academic years found.")
        return

    print(f"Found {closed_years.count()} closed academic years: {[y.nome for y in closed_years]}")

    # 2. Find Active/Confirmed enrollments in these years
    active_statuses = ['Ativa', 'Confirmada']
    enrollments_to_fix = Matricula.objects.filter(
        ano_lectivo__in=closed_years,
        status__in=active_statuses
    )

    count = enrollments_to_fix.count()
    
    if count == 0:
        print("No active enrollments found in closed years.")
        return

    print(f"Found {count} enrollments with status 'Ativa' or 'Confirmada' in closed years.")
    
    # 3. Update them to 'Concluida'
    # Using bulk update for efficiency
    updated_count = enrollments_to_fix.update(status='Concluida')
    
    print(f"Successfully updated {updated_count} enrollments to 'Concluida'.")

if __name__ == '__main__':
    fix_enrollments()
