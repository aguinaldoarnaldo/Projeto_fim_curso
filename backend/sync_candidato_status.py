import os
import django
import sys

# Adicionar o diretório atual ao sys.path para que o core possa ser encontrado
sys.path.append(os.getcwd())

# Configurar ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Candidato, Matricula, Aluno

def reconcile_candidate_status():
    print("Iniciando reconciliação de status de candidatos...")
    # Buscar todos os candidatos que estão como 'Aprovado'
    approved_candidates = Candidato.objects.filter(status='Aprovado')
    
    count = 0
    for cand in approved_candidates:
        # Verificar se existe um Aluno com o mesmo BI
        aluno = Aluno.objects.filter(numero_bi=cand.numero_bi).first()
        if aluno:
            # Verificar se existe uma Matrícula ativa para este Aluno
            matricula = Matricula.objects.filter(id_aluno=aluno, status='Ativo').exists()
            if matricula:
                print(f"Ajustando status para {cand.nome_completo} (BI: {cand.numero_bi}) -> Matriculado")
                cand.status = 'Matriculado'
                cand.save()
                count += 1
                
    print(f"Concluído. {count} candidatos foram atualizados para 'Matriculado'.")

if __name__ == "__main__":
    reconcile_candidate_status()
