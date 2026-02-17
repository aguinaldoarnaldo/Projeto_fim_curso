
import os
import django
import sys
from django.db import connection

# Setup Django environment
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def check_db_column():
    with connection.cursor() as cursor:
        print("Checking historico_escolar table columns:")
        cursor.execute("PRAGMA table_info(historico_escolar)")
        rows = cursor.fetchall()
        for row in rows:
            print(f"  Field: {row[1]}, Type: {row[2]}")
            
        print("\nChecking matricula table columns:")
        cursor.execute("PRAGMA table_info(matricula)")
        rows = cursor.fetchall()
        for row in rows:
            print(f"  Field: {row[1]}, Type: {row[2]}")

if __name__ == '__main__':
    check_db_column()
