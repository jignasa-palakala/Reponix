from pathlib import Path

from app.services.file_reader import read_file_content


repo_path = Path("../repos/repo_2")

content = read_file_content(
    repo_path,
    "README",
)

print("----- FILE CONTENT -----")
print(content)
print("------------------------")