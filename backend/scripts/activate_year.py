import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apis.models import AnoLectivo

def activate_correct_year():
    # Encontrar o ano 2027/2028
    try:
        y = AnoLectivo.objects.get(nome='2027/2028')
        print(f"Setando {y.nome} como Activo...")
        y.status = 'Activo'
        y.save() # Isso dispara a automação que fecha os outros e ativa os alunos dele
        print("Sucesso! Ano lectivo 2027/2028 activado.")
    except AnoLectivo.DoesNotExist:
        print("Erro: Ano 2027/2028 não encontrado.")

if __name__ == "__main__":
    activate_correct_year()
