from pathlib import Path


MAX_FILE_SIZE = 1_000_000  # 1 MB


def read_file_content(
    repo_path: Path,
    file_path: str,
) -> str:
    full_path = repo_path / file_path

    if not full_path.exists():
        raise FileNotFoundError(
            f"File not found: {file_path}"
        )

    if full_path.stat().st_size > MAX_FILE_SIZE:
        raise ValueError(
            f"File is too large: {file_path}"
        )

    try:
        return full_path.read_text(
            encoding="utf-8",
            errors="ignore",
        )
    except OSError as exc:
        raise ValueError(
            f"Could not read file: {file_path}"
        ) from exc