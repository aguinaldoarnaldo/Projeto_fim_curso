import os
import django
import sys

# Setup Django
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Aluno, Matricula

def fix_data():
    print("Iniciando reparação de dados de matrícula...")
    mats = Matricula.objects.filter(numero_matricula__isnull=True).order_by('id_matricula')
    print(f"Encontradas {mats.count()} matrículas sem número.")
    
    count = 0
    for m in mats:
        try:
            # Ao chamar o save(), a lógica que definimos no model será disparada:
            # 1. Gerar numero_matricula (2026XXXX)
            # 2. Sincronizar turma e status no Aluno
            m.save()
            count += 1
            if count % 10 == 0:
                print(f"Processadas {count} matrículas...")
        except Exception as e:
            print(f"Erro ao processar matrícula {m.id_matricula}: {e}")
            
    print(f"\nSucesso! {count} matrículas foram atualizadas e sincronizadas.")

    # Verificação final
    print("\nVerificando Alunos novamente:")
    for aluno in Aluno.objects.all():
        num = aluno.matricula_set.order_by('-data_matricula').first()
        num_val = num.numero_matricula if num else "N/A"
        print(f"Aluno: {aluno.nome_completo} -> Matrícula: {num_val} | Turma: {aluno.id_turma}")

if __name__ == "__main__":
    fix_data()
