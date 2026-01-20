
import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings') # Assuming backend.settings
django.setup()

print("Attempting to import serializers...")
try:
    from apis.serializers import AnoLectivoSerializer
    print("SUCCESS: Imported AnoLectivoSerializer from apis.serializers")
except Exception as e:
    print(f"FAILURE: Could not import AnoLectivoSerializer: {e}")

print("Attempting to import views...")
try:
    from apis.views import AnoLectivoViewSet
    print("SUCCESS: Imported AnoLectivoViewSet from apis.views")
except Exception as e:
    print(f"FAILURE: Could not import AnoLectivoViewSet: {e}")
