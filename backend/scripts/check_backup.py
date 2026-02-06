import zipfile
import os

backup_dir = 'backups'
files = [f for f in os.listdir(backup_dir) if f.endswith('.zip')]

for f in files:
    path = os.path.join(backup_dir, f)
    print(f"Checking {path}...")
    with zipfile.ZipFile(path, 'r') as z:
        for info in z.infolist():
            print(f"  {info.filename}: {info.file_size} bytes")
