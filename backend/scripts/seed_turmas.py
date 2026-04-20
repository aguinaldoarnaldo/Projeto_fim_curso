import os, django, random
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apis.models import Turma, Sala, Curso, Classe, Periodo, AnoLectivo, Funcionario

def create_more_turmas(count=40):
    active_year = AnoLectivo.get_active_year()
    if not active_year:
        print("Erro: Nenhum ano lectivo activo encontrado.")
        return

    salas = list(Sala.objects.all())
    cursos = list(Curso.objects.all())
    classes = list(Classe.objects.all())
    periodos = list(Periodo.objects.all())
    responsaveis = list(Funcionario.objects.all())

    if not all([salas, cursos, classes, periodos]):
        print("Erro: Certifique-se de que existem salas, cursos, classes e períodos cadastrados.")
        return

    created = 0
    start_num = Turma.objects.count() + 1
    
    for i in range(start_num, start_num + count):
        curso = random.choice(cursos)
        classe = random.choice(classes)
        periodo = random.choice(periodos)
        sala = random.choice(salas)
        responsavel = random.choice(responsaveis) if responsaveis else None
        
        # Use a capacity that fits the room
        capacidade = min(40, sala.capacidade_alunos)
        
        codigo = f"{curso.nome_curso[:3].upper()}-{classe.nivel}ª-{periodo.periodo[0].upper()}-T{i}"
        
        try:
            Turma.objects.create(
                codigo_turma=codigo,
                id_curso=curso,
                id_classe=classe,
                id_periodo=periodo,
                id_sala=sala,
                ano_lectivo=active_year,
                ano=active_year.nome,
                id_responsavel=responsavel,
                status='Ativa',
                capacidade=capacidade
            )
            created += 1
        except Exception as e:
            # Maybe the code already exists
            pass

    print(f"Sucesso: {created} novas turmas criadas!")

if __name__ == "__main__":
    create_more_turmas(40)
