import os
import django
import sys
from django.conf import settings
from django.apps import apps
from django.db.models import FileField, ImageField

# Configure Django
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def clean_orphan_files():
    print("Iniciando busca por arquivos orfaos (arquivos no disco sem registro no Banco de Dados)...")
    
    media_root = os.path.normpath(str(settings.MEDIA_ROOT))
    print(f"  Looking in {media_root}...")
    if not os.path.exists(media_root):
        print("Pasta media nao encontrada. Abortando.")
        return

    # 1. Coletar todos os arquivos referenciados no banco de dados
    db_files = set()
    all_models = apps.get_models()
    
    for model in all_models:
        print(f"  Analysing model: {model.__name__} from {model._meta.app_label}")
        file_fields = [f for f in model._meta.fields if isinstance(f, (FileField, ImageField))]
        if not file_fields:
            continue
            
        print(f"  Checking model {model.__name__} for fields: {[f.name for f in file_fields]}")
        # Para cada campo de arquivo desse modelo, pegar os valores não nulos
        for field in file_fields:
            # Pegar todos os valores únicos desse campo
            values = model.objects.values_list(field.name, flat=True).exclude(**{f"{field.name}__in": ['', None]})
            for val in values:
                if val:
                    norm_val = os.path.normpath(str(val))
                    db_files.add(norm_val)
                    print(f"    In DB: {norm_val}")

    print(f"Encontrados {len(db_files)} arquivos validos referenciados no banco.")

    # 2. Percorrer a pasta media e identificar o que não está no set db_files
    orphans = []
    total_size = 0
    
    # Lista de pastas para ignorar (ex: backups se estivessem dentro de media, o que não é o caso aqui, mas por segurança)
    ignore_dirs = ['backups', 'temp_restore', 'staticfiles']

    for root, dirs, files in os.walk(media_root):
        # Filtrar diretórios ignorados
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            full_path = os.path.join(root, file)
            # Obter caminho relativo ao MEDIA_ROOT para comparar com o BD
            relative_path = os.path.relpath(full_path, media_root)
            norm_rel_path = os.path.normpath(relative_path)
            
            # if norm_rel_path not in db_files: # Debug purposes
            if norm_rel_path not in db_files:
                # É um órfão!
                orphans.append(full_path)
                total_size += os.path.getsize(full_path)

    if not orphans:
        print("Nenhum arquivo orfao encontrado. Seu sistema esta limpo!")
        return

    print(f"Encontrados {len(orphans)} arquivos orfaos!")
    print(f"Espaco total a ser recuperado: {total_size / (1024*1024):.2f} MB")
    
    # Automatic deletion
    for file_path in orphans:
        try:
            os.remove(file_path)
            # Opcional: remover pastas vazias
        except Exception as e:
            print(f"Erro ao apagar {file_path}: {e}")
    print("Limpeza concluida!")

if __name__ == "__main__":
    clean_orphan_files()
