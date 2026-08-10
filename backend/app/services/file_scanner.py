from pathlib import Path


IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "dist",
    "build",
    "coverage",
    "__pycache__",
    ".next",
    "out",
}

SPECIAL_FILES = {
    "README": "markdown",
    "README.md": "markdown",
    "Dockerfile": "dockerfile",
    "Makefile": "makefile",
    "requirements.txt": "text",
    "package.json": "json",
    "tsconfig.json": "json",
}

SUPPORTED_EXTENSIONS = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
    ".go": "go",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".c": "c",
    ".h": "c",
    ".hpp": "cpp",
    ".md": "markdown",
    ".html": "html",
    ".css": "css",
}


def scan_repository(repo_path: Path) -> list[dict]:
    files = []

    for path in repo_path.rglob("*"):
        if not path.is_file():
            continue

        relative_path = path.relative_to(repo_path)

        if any(
            part in IGNORED_DIRECTORIES
            for part in relative_path.parts
        ):
            continue

        language = SPECIAL_FILES.get(path.name)

        if language is None:
            language = SUPPORTED_EXTENSIONS.get(
                path.suffix.lower()
            )

        if language is None:
            continue

        files.append(
            {
                "file_name": path.name,
                "file_path": str(relative_path),
                "language": language,
                "size": path.stat().st_size,
            }
        )

    return files

from sqlalchemy.orm import Session

from app.models.repository_file import RepositoryFile


def save_repository_files(
    repo_path: Path,
    repository_id: int,
    db: Session,
) -> list[RepositoryFile]:
    scanned_files = scan_repository(repo_path)

    saved_files = []

    for file_data in scanned_files:
        repository_file = RepositoryFile(
            repository_id=repository_id,
            file_name=file_data["file_name"],
            file_path=file_data["file_path"],
            language=file_data["language"],
            size=file_data["size"],
        )

        db.add(repository_file)
        saved_files.append(repository_file)

    db.commit()

    for repository_file in saved_files:
        db.refresh(repository_file)

    return saved_files