import os, django, random, datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apis.models import Candidato, Curso, AnoLectivo

def create_more_candidates(count=50):
    active_year = AnoLectivo.get_active_year()
    if not active_year:
        print("Erro: Nenhum ano lectivo activo encontrado.")
        return

    cursos = list(Curso.objects.all())
    if not cursos:
        print("Erro: Nenhum curso cadastrado.")
        return

    nomes_m = ["João", "António", "Manuel", "Francisco", "José", "Carlos", "Paulo", "Pedro", "Lucas", "Mateus", "Gabriel", "Rafael"]
    nomes_f = ["Maria", "Ana", "Isabel", "Teresa", "Cláudia", "Marta", "Sara", "Beatriz", "Letícia", "Daniela", "Sílvia", "Márcia"]
    apelidos = ["Arnaldo", "Silva", "Santos", "Oliveira", "Pereira", "Costa", "Rodrigues", "Martins", "Gonçalves", "Gomes", "Lopes", "Marques"]

    created = 0
    for i in range(count):
        genero = random.choice(['M', 'F'])
        nome = f"{random.choice(nomes_m if genero == 'M' else nomes_f)} {random.choice(apelidos)} {random.choice(apelidos)}"
        
        # Unique BI logic
        bi_num = f"{random.randint(100000000, 999999999)}LA{random.randint(100, 999)}"
        
        data_nasc = datetime.date(random.randint(2005, 2010), random.randint(1, 12), random.randint(1, 28))
        
        try:
            Candidato.objects.create(
                nome_completo=nome,
                genero=genero,
                data_nascimento=data_nasc,
                numero_bi=bi_num,
                residencia="Bairro " + random.choice(["Benfica", "Cazenga", "Viana", "Samba", "Talatona"]),
                telefone=f"923{random.randint(100000, 999999)}",
                escola_proveniencia="Escola Primária " + random.choice(["A", "B", "C", "D"]),
                municipio_escola=random.choice(["Luanda", "Belas", "Cazenga"]),
                ano_conclusao=random.randint(2021, 2024),
                media_final=random.uniform(10.0, 20.0),
                curso_primeira_opcao=random.choice(cursos),
                curso_segunda_opcao=random.choice(cursos),
                nome_encarregado=f"{random.choice(nomes_m)} {random.choice(apelidos)}",
                parentesco_encarregado=random.choice(["Pai", "Mãe", "Tio", "Irmão"]),
                telefone_encarregado=f"923{random.randint(100000, 999999)}",
                ano_lectivo=active_year,
                status='INSCRITO'
            )
            created += 1
        except Exception as e:
            print(f"Erro ao criar candidato {nome}: {e}")

    print(f"Sucesso: {created} novos candidatos criados!")

if __name__ == "__main__":
    create_more_candidates(50)
