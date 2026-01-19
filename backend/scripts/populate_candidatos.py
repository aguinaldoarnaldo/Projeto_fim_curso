import os
import django
import random
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import Candidato, Curso

def create_mock_candidates():
    print("Fetching courses...")
    cursos = list(Curso.objects.all())
    if not cursos:
        # Create dummy if none
        from apis.models import AreaFormacao, Funcionario
        area, _ = AreaFormacao.objects.get_or_create(nome_area="Geral")
        # Ensure at least one curso
        c = Curso.objects.create(nome_curso="Informática", id_area_formacao=area)
        cursos = [c]

    print(f"Generating 150 candidates with {len(cursos)} courses available...")
    
    first_names = ["João", "Maria", "Pedro", "Ana", "Lucas", "Mariana", "Carlos", "Beatriz", "Paulo", "Fernanda", "Aguinaldo", "Teresa", "José", "Isabel"]
    last_names = ["Silva", "Santos", "Oliveira", "Costa", "Pereira", "Martins", "Ferreira", "Gomes", "Almeida", "Rodrigues", "Arnaldo", "Manuel", "Antonio"]
    
    statuses = ['Pendente', 'Confirmado', 'Pago', 'Agendado', 'Aprovado', 'Reprovado', 'Matriculado']
    
    candidates_to_create = []
    
    for i in range(150):
        nome = f"{random.choice(first_names)} {random.choice(last_names)}"
        genero = random.choice(['M', 'F'])
        year_birth = random.randint(2005, 2010)
        dob = datetime.date(year_birth, random.randint(1, 12), random.randint(1, 28))
        
        # Unique BI
        bi_num = str(random.randint(100000000, 999999999))
        bi_suffix = "LA0" + str(random.randint(10, 99))
        bi = bi_num + bi_suffix
        
        c1 = random.choice(cursos)
        c2 = random.choice(cursos) if random.random() > 0.3 else None
        
        c = Candidato(
            nome_completo=nome,
            genero=genero,
            data_nascimento=dob,
            numero_bi=bi,
            nacionalidade="Angolana",
            residencia="Luanda, Angola",
            telefone=f"9{random.randint(10000000, 99999999)}",
            email=f"cand{i}@test.com",
            escola_proveniencia="Escola Publica Teste",
            municipio_escola="Luanda",
            ano_conclusao=2025,
            media_final=random.uniform(10, 20),
            curso_primeira_opcao=c1,
            curso_segunda_opcao=c2,
            turno_preferencial=random.choice(['Manhã', 'Tarde', 'Noite']),
            nome_encarregado=f"Pai de {nome.split()[0]}",
            parentesco_encarregado="Pai",
            telefone_encarregado=f"9{random.randint(10000000, 99999999)}",
            status=random.choice(statuses)
        )
        candidates_to_create.append(c)

    # Use bulk_create for speed (ignore save signals for auto-number generation if logic is in save, 
    # BUT wait, the save method generates 'numero_inscricao'. bulk_create DOES NOT call save().
    # So I must iterate.
    
    saved_count = 0
    for cand in candidates_to_create:
        try:
            cand.save()
            saved_count += 1
        except Exception as e:
            print(f"Error saving candidate: {e}")
            
    print(f"Successfully created {saved_count} candidates.")

if __name__ == '__main__':
    create_mock_candidates()
