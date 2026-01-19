import os
import sys
import django

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Curso, AreaFormacao
from datetime import date

def create_default_courses():
    area, _ = AreaFormacao.objects.get_or_create(nome_area="Ciências Tecnológicas")

    default_courses = [
        ("Informática", "Curso Técnico de Informática"),
        ("Gestão", "Curso Técnico de Gestão Empresarial"),
        ("Análises Clínicas", "Curso Técnico de Análises Clínicas"),
        ("Enfermagem", "Curso Técnico de Enfermagem"),
        ("Eletricidade", "Curso Técnico de Energia e Instalações Elétricas")
    ]

    for nome, desc in default_courses:
        if not Curso.objects.filter(nome_curso=nome).exists():
            Curso.objects.create(
                nome_curso=nome,
                descricao=desc,
                id_area_formacao=area,
                duracao=4, # 4 anos
                mensalidade=25000.00
            )
            print(f"Criado curso: {nome}")
        else:
            print(f"Curso existente: {nome}")

if __name__ == "__main__":
    create_default_courses()
