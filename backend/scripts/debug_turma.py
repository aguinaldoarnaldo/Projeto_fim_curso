import os
import django
import sys
from pathlib import Path

# Adicionar o diretório do backend ao path
# Este script está em backend/scripts/, o BASE_DIR é o backend/
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from ..apis.models import Turma, Matricula, Aluno

# 1. Buscar a turma
codigo = '2IN10T27'
turma = Turma.objects.filter(codigo_turma=codigo).first()

if not turma:
    print(f"Turma '{codigo}' não encontrada.")
else:
    print(f"Turma: {turma.codigo_turma} (ID: {turma.id_turma})")
    
    # 2. Contar Matriculas
    m_count = Matricula.objects.filter(id_turma=turma).count()
    m_ativas = Matricula.objects.filter(id_turma=turma, status__in=['Ativa', 'Concluida']).count()
    print(f"Matriculas totais na turma: {m_count}")
    print(f"Matriculas Ativas/Concluidas: {m_ativas}")
    
    # 3. Listar Matriculas
    print("\n--- Alunos Matriculados nesta Turma ---")
    mats = Matricula.objects.filter(id_turma=turma)
    for m in mats:
        print(f"ID: {m.id_matricula} | Aluno: {m.id_aluno.nome_completo if m.id_aluno else 'N/A'} (ID: {m.id_aluno_id}) | Status: {m.status}")

    # 4. Verificar Alunos vinculados diretamente (legacy)
    a_count = Aluno.objects.filter(id_turma=turma).count()
    print(f"\nAlunos vinculados via Aluno.id_turma: {a_count}")
