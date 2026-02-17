import os
import sys
import django
import random
import time
from concurrent.futures import ThreadPoolExecutor
from django.core.files.base import ContentFile

# Adicionar o diretorio raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Aluno, Matricula, Turma, AnoLectivo

def create_single_matricula(aluno, turma, ano, dummy_content):
    try:
        # Limpar matriculas anteriores do aluno para este ano se existirem
        Matricula.objects.filter(id_aluno=aluno, ano_lectivo=ano).delete()
        
        m = Matricula(
            id_aluno=aluno,
            id_turma=turma,
            ano_lectivo=ano,
            tipo='Novo'
        )
        # Adicionar documentos dummy
        m.doc_bi.save('dummy_bi.pdf', ContentFile(dummy_content), save=False)
        m.doc_certificado.save('dummy_cert.pdf', ContentFile(dummy_content), save=False)
        
        m.save()
        return True
    except Exception as e:
        print(f"Erro ao matricular {aluno.nome_completo}: {e}")
        return False

def run_stress_test(count=20):
    print(f"Iniciando Teste de Stress: {count} Matriculas simultaneas...")
    
    # Setup Data
    ano = AnoLectivo.objects.filter(activo=True).first()
    if not ano:
        ano = AnoLectivo.objects.create(nome="TESTE 2026", activo=True)
        print("Criado Ano Lectivo de Teste.")
        
    turma = Turma.objects.filter(ano_lectivo=ano).first()
    if not turma:
        turma = Turma.objects.first()
        if turma:
            turma.ano_lectivo = ano
            turma.save()
        else:
            print("Nenhuma turma disponivel para o teste.")
            return
            
    # Alunos
    alunos = list(Aluno.objects.all()[:count])
    if len(alunos) < count:
        for i in range(count - len(alunos)):
            a = Aluno.objects.create(
                nome_completo=f"Aluno Stress {i}",
                numero_bi=f"STRESS{random.randint(10000000, 99999999)}",
                genero='M'
            )
            alunos.append(a)

    dummy_content = b"PDF dummy content"
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(lambda a: create_single_matricula(a, turma, ano, dummy_content), alunos))
        
    end_time = time.time()
    success_count = results.count(True)
    
    print("\n--- Resultado do Teste ---")
    print(f"Total: {count}")
    print(f"Sucesso: {success_count}")
    print(f"Falhas: {count - success_count}")
    print(f"Tempo Total: {end_time - start_time:.2f}s")
    
    if success_count == count:
        print("\nTESTE PASSOU: Fluxo ponta-a-ponta robusto. Nenhum conflito detectado.")
    else:
        print("\nTESTE COMPLETADO COM AVISOS: Algumas falhas ocorreram.")

if __name__ == "__main__":
    run_stress_test(20)
