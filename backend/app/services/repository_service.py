from pathlib import Path
import shutil

from git import Repo


PROJECT_ROOT = Path(__file__).resolve().parents[3]
REPOS_DIR = PROJECT_ROOT / "repos"


def clone_repository(
    repo_url: str,
    repository_id: int,
) -> Path:
    REPOS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    destination = REPOS_DIR / f"repo_{repository_id}"

    if destination.exists():
        shutil.rmtree(destination)

    Repo.clone_from(
        repo_url,
        destination,
    )

    return destination