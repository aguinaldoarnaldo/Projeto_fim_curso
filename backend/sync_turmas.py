import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Matricula, Aluno

print("Starting Sync Script...")
matriculas = Matricula.objects.filter(ativo=True)
print(f"Found {matriculas.count()} active matriculas.")

count = 0
fixed_status = 0

for mat in matriculas:
    aluno = mat.id_aluno
    turma = mat.id_turma
    
    if not aluno or not turma:
        continue

    # Debug info for first few
    if count < 5:
        print(f"Checking Aluno {aluno.id_aluno} ({aluno.nome_completo}) - Turma {aluno.id_turma_id} vs Mat Turma {turma.id_turma}")

    updated = False
    
    # Check Turma Match
    if aluno.id_turma_id != turma.id_turma:
        print(f"Mismatch found! Aluno {aluno.nome_completo}: AlunoTurma={aluno.id_turma_id} vs MatTurma={turma.id_turma}")
        aluno.id_turma = turma
        updated = True
        count += 1
        
    # Check Status
    if aluno.status_aluno != 'Activo':
        print(f"Status mismatch! Aluno {aluno.nome_completo} is {aluno.status_aluno}, setting to Activo")
        aluno.status_aluno = 'Activo'
        updated = True
        fixed_status += 1

    if updated:
        aluno.save()

print(f"Synced Turmas for {count} students.")
print(f"Fixed Status for {fixed_status} students.")
