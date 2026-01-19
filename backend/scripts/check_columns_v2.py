import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'curso';")
    rows = cursor.fetchall()
    print("COLUMNS IN CURSO:")
    for r in rows:
        print(r[0])
