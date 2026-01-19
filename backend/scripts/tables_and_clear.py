import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

print("--- TABLES IN DATABASE ---")
with connection.cursor() as cursor:
    # Postgres specific query for tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    rows = cursor.fetchall()
    for row in rows:
        print(row[0])
print("--- END TABLES ---")

from apis.models import Candidato
print(f"Clearing {Candidato.objects.count()} candidates...")
Candidato.objects.all().delete()
print("Candidates cleared.")
