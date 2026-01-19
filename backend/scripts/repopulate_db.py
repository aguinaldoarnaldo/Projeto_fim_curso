import os
import django
import random
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
    print("--- INICIANDO POPULACAO FORCE BRUTE ---")
    
    # Limpar dados existentes (Opcional, mas bom para garantir consistencia)
    print("Limpando dados academicos antigos (Alunos, Turmas, Cursos)...")
    Aluno.objects.all().delete()
    Turma.objects.all().delete()
    Curso.objects.all().delete()
    # Nao deletamos funcionarios/admin para nao travar o login do usuario
    
    # 1. Cargos
    print("Criando Cargos...")
    cargos_nomes = ['Professor', 'Secretário', 'Diretor', 'Coordenador', 'Segurança', 'Limpeza']
    cargos = {}
    for nome in cargos_nomes:
        c, _ = Cargo.objects.get_or_create(nome_cargo=nome)
        cargos[nome] = c
    
    # 2. Funcionarios (Garante pelo menos 1 professor)
    print("Garantindo Funcionarios...")
    prof_cargo = cargos['Professor']
    prof, _ = Funcionario.objects.get_or_create(
        email='professor_demo@escola.ao',
        defaults={
            'codigo_identificacao': 'PROF_DEMO_001',
            'nome_completo': 'Prof. Sebastião Manuel',
            'id_cargo': prof_cargo,
            'senha_hash': make_password('123456'),
            'status_funcionario': 'Activo',
            'genero': 'M'
        }
    )

    # 3. Academico Basico
    print("Criando Estrutura Academica...")
    classes = []
    for nivel in [10, 11, 12, 13]:
        c, _ = Classe.objects.get_or_create(nivel=nivel, defaults={'descricao': f'{nivel}ª Classe'})
        classes.append(c)
        
    salas = []
    for num in range(1, 15):
        s, _ = Sala.objects.get_or_create(
            numero_sala=num, 
            defaults={'capacidade_alunos': 35}
        )
        salas.append(s)

    periodos_choices = ['Manhã', 'Tarde', 'Noite']
    periodos = []
    for p_nome in periodos_choices:
        p, _ = Periodo.objects.get_or_create(periodo=p_nome)
        periodos.append(p)

    # 4. Cursos
    print("Criando Cursos...")
    area_ti, _ = AreaFormacao.objects.get_or_create(nome_area='Tecnologias de Informação')
    area_saude, _ = AreaFormacao.objects.get_or_create(nome_area='Saúde')
    area_juridica, _ = AreaFormacao.objects.get_or_create(nome_area='Ciências Jurídicas')
    area_economica, _ = AreaFormacao.objects.get_or_create(nome_area='Ciências Econômicas')

    cursos_data = [
        ('Informática de Gestão', area_ti),
        ('Técnico de Informática', area_ti),
        ('Enfermagem', area_saude),
        ('Análises Clínicas', area_saude),
        ('Direito e Legislação', area_juridica),
        ('Contabilidade', area_economica),
        ('Gestão Empresarial', area_economica),
    ]
    cursos = []
    for nome, area in cursos_data:
        cur, created = Curso.objects.get_or_create(
            nome_curso=nome,
            defaults={
                'id_area_formacao': area, 
                'duracao_meses': 36,
                'id_responsavel': prof
            }
        )
        cursos.append(cur)

    # 5. Turmas
    print("Criando Turmas...")
    turmas = []
    # Criar pelo menos uma turma para cada curso em cada classe
    for curso in cursos:
        for classe in classes:
            # Pula algumas combinacoes para parecer natural
            if random.random() > 0.7: continue
            
            periodo = random.choice(periodos)
            letra = random.choice(['A', 'B', 'C'])
            # Codigo: INF10A
            prefixo = curso.nome_curso[:3].upper()
            codigo = f"{prefixo}{classe.nivel}{letra}"
            
            # Evitar duplicata de codigo
            if Turma.objects.filter(codigo_turma=codigo).exists():
                codigo = f"{codigo}-{random.randint(1,99)}"

            t, _ = Turma.objects.get_or_create(
                codigo_turma=codigo,
                defaults={
                    'id_sala': random.choice(salas),
                    'id_curso': curso,
                    'id_classe': classe,
                    'id_periodo': periodo,
                    'ano': 2024,
                    'id_responsavel': prof
                }
            )
            turmas.append(t)
    
    if not turmas:
        print("AVISO: Nenhuma turma gerada aleatoriamente. Forcando criacao...")
        t, _ = Turma.objects.get_or_create(codigo_turma="GERAL10A", defaults={
             'id_sala': salas[0], 'id_curso': cursos[0], 'id_classe': classes[0], 
             'id_periodo': periodos[0], 'ano': 2024, 'id_responsavel': prof
        })
        turmas.append(t)

    # 6. Alunos
    print("Inserindo 120 Alunos...")
    nomes_primeiros = ['José', 'João', 'António', 'Francisco', 'Paulo', 'Pedro', 'Manuel', 'Maria', 'Ana', 'Isabel', 'Teresa', 'Sofia', 'Beatriz', 'Francisca']
    sobrenomes = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes', 'Gonçalves']
    
    avatar_bases = [
        "https://randomuser.me/api/portraits/men/",
        "https://randomuser.me/api/portraits/women/"
    ]

    for i in range(120):
        prim_nome = random.choice(nomes_primeiros)
        ult_nome = random.choice(sobrenomes)
        meio_nome = random.choice(sobrenomes)
        nome_completo = f"{prim_nome} {meio_nome} {ult_nome}"
        
        genero = 'M' if prim_nome in ['José', 'João', 'António', 'Francisco', 'Paulo', 'Pedro', 'Manuel'] else 'F'
        
        # Gerar foto aleatoria
        img_id = random.randint(1, 90)
        base_url = avatar_bases[0] if genero == 'M' else avatar_bases[1]
        foto_url = f"{base_url}{img_id}.jpg"

        turma = random.choice(turmas)
        
        num_bi = f"{random.randint(100000000, 999999999)}LA{random.randint(10, 99)}"
        # Check BI
        while Aluno.objects.filter(numero_bi=num_bi).exists():
             num_bi = f"{random.randint(100000000, 999999999)}LA{random.randint(10, 99)}"

        Aluno.objects.create(
            nome_completo=nome_completo,
            email=f"aluno{i}_{random.randint(1000,9999)}@escola.ao", # Email ultra unico
            numero_bi=num_bi,
            numero_matricula=20240000 + i,
            telefone=[f"923{random.randint(100000,999999)}"],
            provincia_residencia='Luanda',
            municipio_residencia=random.choice(['Belas', 'Viana', 'Cacuaco', 'Cazenga', 'Luanda']),
            senha_hash=make_password('123456'),
            genero=genero,
            status_aluno=random.choice(['Activo', 'Activo', 'Activo', 'Suspenso', 'Inadimplente']), # Mais ativos
            id_turma=turma,
            img_path=foto_url,
            is_online=random.choice([True, False]),
            criado_em=date.today() - timedelta(days=random.randint(0, 100))
        )

    # 7. Atualizar contagem
    print(f"--- DADOS FINAIS ---")
    print(f"Alunos: {Aluno.objects.count()}")
    print(f"Turmas: {Turma.objects.count()}")
    print(f"Cursos: {Curso.objects.count()}")
    print("--- CONCLUIDO ---")

if __name__ == '__main__':
    repopulate_database()
