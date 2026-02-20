import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.academico import AnoLectivo, Turma

print("--- TURMAS AND THEIR YEARS ---")
turmas = Turma.objects.all()
for t in turmas:
    print(f"Turma: {t.codigo_turma}, ID: {t.pk}, Status: {t.status}, Ano Lectivo: {t.ano_lectivo.nome if t.ano_lectivo else 'None'} (ID: {t.ano_lectivo.pk if t.ano_lectivo else 'None'})")
