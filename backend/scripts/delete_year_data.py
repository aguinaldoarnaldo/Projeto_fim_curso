import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.academico import AnoLectivo, Turma
from apis.models.matriculas import Matricula
from apis.models.candidatura import Candidato

# Identificar o ano 2025/2026 (ID 7 conforme debug anterior)
target_year = AnoLectivo.objects.filter(nome="2025/2026").first()

if not target_year:
    print("O ano lectivo 2025/2026 não foi encontrado ou já foi removido.")
else:
    print(f"Iniciando remoção segura de dados do ano {target_year.nome} (ID: {target_year.pk})...")
    
    # 1. Remover Matrículas vinculadas a este ano
    m_count = Matricula.objects.filter(ano_lectivo=target_year).count()
    if m_count > 0:
        Matricula.objects.filter(ano_lectivo=target_year).delete()
        print(f"- {m_count} matrículas removidas.")
    
    # 2. Remover Candidatos vinculados a este ano
    c_count = Candidato.objects.filter(ano_lectivo=target_year).count()
    if c_count > 0:
        Candidato.objects.filter(ano_lectivo=target_year).delete()
        print(f"- {c_count} candidatos removidos.")

    # 3. Remover Turmas vinculadas a este ano
    t_count = Turma.objects.filter(ano_lectivo=target_year).count()
    if t_count > 0:
        Turma.objects.filter(ano_lectivo=target_year).delete()
        print(f"- {t_count} turmas removidas.")

    # 4. Remover o Ano Lectivo
    year_name = target_year.nome
    target_year.delete()
    print(f"--- O Ano Lectivo {year_name} foi eliminado com sucesso! ---")
