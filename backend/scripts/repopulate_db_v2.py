import os
import django
import random
import sys
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import (
    Cargo, Funcionario, Encarregado,
    Sala, Classe, Departamento, Seccao, AreaFormacao, Curso, Periodo, Turma,
    Aluno, AlunoEncarregado
)
from django.contrib.auth.hashers import make_password

def repopulate_database():
    print("--- INICIANDO POPULACAO V2 ---")
    
    try:
        # Limpeza
        print("Limpando dados antigos...")
        Aluno.objects.all().delete()
        Turma.objects.all().delete() 
        Curso.objects.all().delete()
    except Exception as e:
        print(f"Erro na limpeza (pode ser ignorado se for vazio): {e}")

    # 1. Cargos
    print("Criando Cargos...")
    cargos_nomes = ['Professor', 'Secretário', 'Diretor', 'Coordenador', 'Segurança', 'Limpeza']
    cargos_objs = {}
    for nome in cargos_nomes:
        c, _ = Cargo.objects.get_or_create(nome_cargo=nome)
        cargos_objs[nome] = c
    
    # 2. Funcionario
    print("Criando Funcionario...")
    prof_cargo = cargos_objs['Professor']
    prof, _ = Funcionario.objects.get_or_create(
        email='professor_demo_v2@escola.ao',
        defaults={
            'codigo_identificacao': 'PROF_V2',
            'nome_completo': 'Prof. Sebastião Manuel V2',
            'id_cargo': prof_cargo,
            'senha_hash': make_password('123456'),
            'status_funcionario': 'Activo'
        }
    )

    # 3. Academico
    print("Criando Classes/Salas/Periodos...")
    classes = []
    for n in [10, 11, 12, 13]:
        c, _ = Classe.objects.get_or_create(nivel=n, defaults={'descricao': f'{n}ª Classe'})
        classes.append(c)
        
    salas = []
    for n in range(1, 11):
        s, _ = Sala.objects.get_or_create(numero_sala=n, defaults={'capacidade_alunos': 40})
        salas.append(s)
        
    periodos = []
    for p in ['Manhã', 'Tarde', 'Noite']:
        per, _ = Periodo.objects.get_or_create(periodo=p)
        periodos.append(per)
        
    # 4. Curso
    print("Criando Cursos...")
    area, _ = AreaFormacao.objects.get_or_create(nome_area='Geral')
    cursos_nomes = ['Informática', 'Gestão', 'Direito', 'Enfermagem', 'Contabilidade']
    cursos_objs = []
    for c_nome in cursos_nomes:
        try:
            cur = Curso.objects.create(
                nome_curso=c_nome, 
                id_area_formacao=area, 
                duracao_meses=36, 
                id_responsavel=prof
            )
            cursos_objs.append(cur)
        except Exception as e:
            print(f"ERRO CRITICO AO CRIAR CURSO {c_nome}: {e}")
            # Try fallback without foreign keys if possible? No, they are required.
            # Maybe printing the error helps us debugging.

    # 5. Turmas
    print("Criando Turmas...")
    turmas_objs = []
    for i, curso in enumerate(cursos_objs):
        for classe in classes:
            cod = f"{curso.nome_curso[:3].upper()}{classe.nivel}{random.choice(['A','B'])}"
            if Turma.objects.filter(codigo_turma=cod).exists():
                cod += "X"
            
            if len(cursos_objs) > 0:
                t = Turma.objects.create(
                    codigo_turma=cod,
                    id_sala=random.choice(salas),
                    id_curso=curso,
                    id_classe=classe,
                    id_periodo=random.choice(periodos),
                    ano=2024,
                    id_responsavel=prof
                )
                turmas_objs.append(t)
            else:
                print("Skipping turmas creation because no courses available.")
                break

    # 6. Alunos
    print("Criando 100 Alunos...")
    first_names = ['Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Joana']
    last_names = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira']
    
    count = 0
    for i in range(100):
        nome = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"aluno_v2_{i}@escola.ao"
        
        # Ensure Turma
        turma = random.choice(turmas_objs)
        
        try:
             Aluno.objects.create(
                nome_completo=nome,
                email=email,
                numero_bi=f"00{i}V2BI{random.randint(100,999)}",
                numero_matricula=2024100 + i,
                senha_hash=make_password('123456'),
                status_aluno='Activo',
                id_turma=turma,
                is_online=False
            )
             count += 1
        except Exception as e:
            print(f"Erro ao criar aluno {i}: {e}")

    print(f"--- FIM. Criados {count} alunos. ---")

if __name__ == '__main__':
    repopulate_database()
