import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'curso';")
    columns = [row[0] for row in cursor.fetchall()]
    print(f"Columns in 'curso': {columns}")

    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'turma';")
    columns_turma = [row[0] for row in cursor.fetchall()]
    print(f"Columns in 'turma': {columns_turma}")
