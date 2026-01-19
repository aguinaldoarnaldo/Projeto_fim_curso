import os
import django
from django.db import connection

# Configurar o ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def reset_apis_migrations():
    """
    Remove registros de migração do app 'apis' e deleta a tabela roommodel
    para permitir que as novas migrações sejam aplicadas.
    """
    with connection.cursor() as cursor:
        print("--- Iniciando limpeza de migrações obsoletas ---")
        
        # 1. Deletar registros de migração do app 'apis'
        print("Limpando registros na tabela django_migrations para o app 'apis'...")
        cursor.execute("DELETE FROM django_migrations WHERE app = 'apis';")
        
        # 2. Deletar a tabela roommodel órfã (e outras se existirem)
        print("Deletando tabela 'apis_roommodel' órfã...")
        try:
            cursor.execute("DROP TABLE IF EXISTS apis_roommodel CASCADE;")
            print("Tabela 'apis_roommodel' removida.")
        except Exception as e:
            print(f"Erro ao remover apis_roommodel: {e}")

        # 3. Listar tabelas restantes para conferência
        print("\nTabelas restantes no esquema public:")
        cursor.execute("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';")
        tables = cursor.fetchall()
        for table in tables:
            print(f"- {table[0]}")
            
        print("\n--- Limpeza concluída! ---")
        print("Agora você pode rodar: python manage.py migrate")

if __name__ == "__main__":
    reset_apis_migrations()
