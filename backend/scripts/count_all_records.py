import os
import django
import sys
from django.apps import apps

# Configure Django
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def count_all_apis_models():
    apis_app = apps.get_app_config('apis')
    for model in apis_app.get_models():
        print(f"{model.__name__}: {model.objects.count()}")

if __name__ == "__main__":
    count_all_apis_models()
