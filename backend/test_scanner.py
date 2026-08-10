from pathlib import Path

from app.services.file_scanner import scan_repository


repo_path = Path("../repos/repo_2")

files = scan_repository(repo_path)

print(f"Found {len(files)} supported files.")

for file in files[:20]:
    print(file)