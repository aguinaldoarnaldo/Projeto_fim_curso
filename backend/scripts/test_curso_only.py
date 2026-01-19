import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Curso, AreaFormacao, Funcionario

try:
    print("Testing Curso Creation or Fetching...")
    
    # Check Area
    area, _ = AreaFormacao.objects.get_or_create(nome_area='TesteArea')
    print(f"Area: {area}, ID: {area.pk}")
    
    # Check Funcionario
    prof = Funcionario.objects.first()
    if not prof:
        print("No funcionario found. Creating dummy.")
        from apis.models import Cargo
        c, _ = Cargo.objects.get_or_create(nome_cargo="Dummy")
        prof = Funcionario.objects.create(nome_completo="Dummy", id_cargo=c, codigo_identificacao="DUMMY")
    print(f"Prof: {prof}, ID: {prof.pk}")
    
    # Create Curso
    print("Attempting to create Curso...")
    c = Curso.objects.create(
        nome_curso="Curso Teste Debug",
        id_area_formacao=area,
        duracao_meses=12,
        id_responsavel=prof
    )
    print(f"Curso created: {c}, ID: {c.pk}")
    
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
