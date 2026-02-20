import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.matriculas import Matricula

mats = Matricula.objects.filter(ano_lectivo__id_ano=1)
for m in mats[:5]:
    print(f"Matricula ID: {m.pk}, Aluno: {m.id_aluno.nome_completo if m.id_aluno else 'None'}, Turma: {m.id_turma.codigo_turma if m.id_turma else 'None'}")
