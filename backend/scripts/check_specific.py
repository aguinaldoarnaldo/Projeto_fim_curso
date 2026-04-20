import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apis.models import Matricula, Aluno

def check_specific():
    names = ['Maria Teste Import', 'Aluno Teste Import', 'Aguinaldo Arnaldo', 'Henriques Silva', 'Aguinaldo Programador', 'Aguinaldo Victoriano José Arnaldo']
    print("Verificando alunos específicos:")
    for name in names:
        a = Aluno.objects.filter(nome_completo__icontains=name).first()
        if a:
            print(f"- Aluno: {a.nome_completo} | Status Aluno: {a.status_aluno}")
            # Get latest matricula
            m = Matricula.objects.filter(id_aluno=a).order_by('-id_matricula').first()
            if m:
                print(f"  Última Matrícula: {m.ano_lectivo.nome} | Status Matricula: {m.status}")
        else:
            print(f"- Aluno {name}: NÃO ENCONTRADO")

if __name__ == "__main__":
    check_specific()
