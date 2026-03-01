
import os
import django
import sys
from django.db import connection

# Setup Django environment
sys.path.append(r'c:\Users\Aguinaldo Arnaldo\Documents\Meus_projetos\Projeto_fim_curso\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def check_db_column():
    with open('db_scrapped.txt', 'w') as f:
        with connection.cursor() as cursor:
            f.write("Checking historico_escolar table columns:\n")
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'historico_escolar'
                ORDER BY column_name;
            """)
            rows = cursor.fetchall()
            for row in rows:
                f.write(f"COL: {row[0]} | TYPE: {row[1]}\n")
                
            f.write("\nChecking matricula table columns:\n")
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'matricula'
                ORDER BY column_name;
            """)
            rows = cursor.fetchall()
            for row in rows:
                f.write(f"COL: {row[0]} | TYPE: {row[1]}\n")

if __name__ == '__main__':
    check_db_column()
