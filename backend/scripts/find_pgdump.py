import os
import subprocess

print("OS:", os.name)
print("PATH:", os.environ.get('PATH', ''))

# Try to find pg_dump using different methods
try:
    res = subprocess.run(['where', 'pg_dump'], capture_output=True, text=True)
    print("WHERE pg_dump result:", res.stdout if res.returncode == 0 else "Not found via where")
except Exception as e:
    print("Error running where:", e)

# Search common paths manually
common_paths = [
    r"C:\Program Files\PostgreSQL",
    r"C:\Program Files (x86)\PostgreSQL",
]

for base in common_paths:
    if os.path.exists(base):
        print(f"Found base path: {base}")
        for version in os.listdir(base):
            bin_path = os.path.join(base, version, "bin")
            if os.path.exists(bin_path):
                print(f"Found bin path: {bin_path}")
                if "pg_dump.exe" in os.listdir(bin_path):
                    print(f"FOUND pg_dump.exe at {os.path.join(bin_path, 'pg_dump.exe')}")

# Check if maybe it's pg_dump (without .exe) or something else
