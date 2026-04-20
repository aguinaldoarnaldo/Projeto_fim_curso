import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apis.models import AnoLectivo, Matricula

def check_year_counts():
    years = AnoLectivo.objects.all().order_by('-data_inicio')
    for y in years:
        count = Matricula.objects.filter(ano_lectivo=y).count()
        print(f"{y.nome}: {count} matriculas, Status: {y.status}")

if __name__ == "__main__":
    check_year_counts()
