import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Aluno, AlunoEncarregado, Encarregado, Candidato

print("Starting data repair: Syncing guardian emails from Candidatos to Encarregados...")

count = 0
# Percorrer todos os candidatos que têm email do encarregado
candidatos = Candidato.objects.exclude(email_encarregado__isnull=True).exclude(email_encarregado='')

for cand in candidatos:
    # Tentar encontrar o aluno correspondente pelo BI
    aluno = Aluno.objects.filter(numero_bi=cand.numero_bi).first()
    if aluno:
        # Encontrar encarregados vinculados a este aluno
        vinculos = AlunoEncarregado.objects.filter(id_aluno=aluno).select_related('id_encarregado')
        for v in vinculos:
            enc = v.id_encarregado
            # Se o encarregado não tem email ou tem o email genérico, atualizar
            if not enc.email or enc.email == 'email@exemplo.com':
                print(f"Updating Encarregado {enc.nome_completo} (ID: {enc.id_encarregado}) with email: {cand.email_encarregado}")
                enc.email = cand.email_encarregado
                enc.save()
                count += 1

print(f"Repair finished. {count} records updated.")
