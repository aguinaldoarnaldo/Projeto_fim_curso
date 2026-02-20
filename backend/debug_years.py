import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.academico import AnoLectivo, Turma

print("--- ANOS LECTIVOS ---")
anos = AnoLectivo.objects.all().order_by('-id_ano')
for a in anos:
    print(f"ID: {a.pk}, Nome: {a.nome}, Status: {a.status}, Activo: {a.activo}")

print("\n--- TURMAS COUNT ---")
for a in anos:
    count = Turma.objects.filter(ano_lectivo=a).count()
    print(f"Ano {a.nome} (ID {a.pk}) tem {count} turmas.")
