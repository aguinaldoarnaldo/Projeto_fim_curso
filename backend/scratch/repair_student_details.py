import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Aluno, Candidato

print("Starting data repair: Syncing missing student details from Candidatos to Alunos...")

count = 0
# Percorrer todos os alunos
alunos = Aluno.objects.all()

for aluno in alunos:
    # Se algum campo estiver vazio ou com valor default que queremos sobrepor
    if not aluno.naturalidade or aluno.nacionalidade == 'Angolana' or aluno.deficiencia == 'Não':
        # Tentar encontrar o candidato correspondente pelo BI
        if aluno.numero_bi:
            cand = Candidato.objects.filter(numero_bi=aluno.numero_bi).first()
            if cand:
                updated = False
                if not aluno.naturalidade and cand.naturalidade:
                    aluno.naturalidade = cand.naturalidade
                    updated = True
                
                if (not aluno.nacionalidade or aluno.nacionalidade == 'Angolana') and cand.nacionalidade and cand.nacionalidade != 'Angolana':
                    aluno.nacionalidade = cand.nacionalidade
                    updated = True
                    
                if (not aluno.deficiencia or aluno.deficiencia == 'Não') and cand.deficiencia and cand.deficiencia != 'Não':
                    aluno.deficiencia = cand.deficiencia
                    updated = True

                if updated:
                    print(f"Updating Aluno {aluno.nome_completo} (ID: {aluno.id_aluno}) with details from Candidato")
                    aluno.save()
                    count += 1

print(f"Repair finished. {count} student records updated.")
