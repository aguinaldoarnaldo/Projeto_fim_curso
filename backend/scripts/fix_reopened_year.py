
import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Matricula, AnoLectivo

def fix_reopened_year_enrollments():
    # 1. Find all ACTIVE academic years
    active_years = AnoLectivo.objects.filter(activo=True)
    
    if not active_years.exists():
        print("No active academic years found.")
        return

    print(f"Found {active_years.count()} active academic years: {[y.nome for y in active_years]}")

    # 2. Find 'Concluida' enrollments in these active years
    # We assume that if the year is active, students shouldn't be marked as 'Concluida' yet (unless specific cases, but for this bulk fix we assume rollback)
    enrollments_to_fix = Matricula.objects.filter(
        ano_lectivo__in=active_years,
        status='Concluida'
    )

    count = enrollments_to_fix.count()
    
    if count == 0:
        print("No 'Concluida' enrollments found in active years.")
        return

    print(f"Found {count} enrollments with status 'Concluida' in currently active years.")
    
    # 3. Update them back to 'Ativa'
    updated_count = enrollments_to_fix.update(status='Ativa')
    
    print(f"Successfully updated {updated_count} enrollments back to 'Ativa'.")

if __name__ == '__main__':
    fix_reopened_year_enrollments()
