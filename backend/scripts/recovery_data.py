import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.academico import AnoLectivo, Turma
from apis.models.matriculas import Matricula

# 1. Identificar o ano real (2026/2027 - ID 1)
real_year = AnoLectivo.objects.filter(pk=1).first()

if not real_year:
    print("ERRO: Ano 2026/2027 não encontrado!")
else:
    print(f"Restaurando o ano: {real_year.nome}...")
    
    # 2. Remover anos de teste vazios (IDs > 7, criados recentemente)
    # Vou remover apenas os que não têm turmas para ser seguro
    test_years = AnoLectivo.objects.filter(id_ano__gt=1).exclude(id_ano=7) 
    for ty in test_years:
        t_count = Turma.objects.filter(ano_lectivo=ty).count()
        m_count = Matricula.objects.filter(ano_lectivo=ty).count()
        if t_count == 0 and m_count == 0:
            print(f"Removendo ano de teste vazio: {ty.nome} (ID {ty.pk})")
            ty.delete()
        else:
            # Se tiver dados, apenas desativa
            print(f"Desativando ano com dados: {ty.nome} (ID {ty.pk})")
            ty.status = 'Encerrado'
            ty.activo = False
            ty.save()

    # 3. Reativar o ano real
    # Usamos update para não disparar o save() que fecharia outros anos ainda
    AnoLectivo.objects.filter(pk=1).update(status='Activo', activo=True)
    
    # 4. Restaurar Turmas
    t_updated = Turma.objects.filter(ano_lectivo=real_year).update(status='Ativa')
    print(f"{t_updated} turmas restauradas para 'Ativa'.")
    
    # 5. Restaurar Matrículas
    m_updated = Matricula.objects.filter(ano_lectivo=real_year).update(status='Ativa')
    print(f"{m_updated} matrículas restauradas para 'Ativa'.")
    
    print("\n--- RESTAURO CONCLUÍDO ---")
