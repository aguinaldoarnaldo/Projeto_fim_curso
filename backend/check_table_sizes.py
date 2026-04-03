import os
import django
import sys
from django.db import connection

# Configure Django
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def get_table_sizes():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT relname AS "relation",
                   pg_size_pretty(pg_total_relation_size(C.oid)) AS "total_size"
            FROM pg_class C
            LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
            WHERE nspname NOT IN ('pg_catalog', 'information_schema')
              AND C.relkind <> 'i'
              AND nspname !~ '^pg_toast'
            ORDER BY pg_total_relation_size(C.oid) DESC
            LIMIT 20;
        """)
        rows = cursor.fetchall()
        for row in rows:
            print(f"{row[0]}: {row[1]}")

if __name__ == "__main__":
    get_table_sizes()
