from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.database.connection import get_db
from app.models.repository import Repository
from app.services.repository_service import clone_repository
from app.schemas.repository import (
    RepositoryCreate,
    RepositoryResponse,
)
from app.services.file_scanner import save_repository_files


router = APIRouter(
    prefix="/api/repositories",
    tags=["Repositories"],
)


@router.post(
    "",
    response_model=RepositoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_repository(
    repository_data: RepositoryCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    parsed_url = urlparse(str(repository_data.repo_url))

    if parsed_url.hostname != "github.com":
        raise HTTPException(
            status_code=400,
            detail="Only GitHub repositories are supported",
        )

    path_parts = [
        part
        for part in parsed_url.path.strip("/").split("/")
        if part
    ]

    if len(path_parts) < 2:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub repository URL",
        )

    owner = path_parts[0]
    repo_name = path_parts[1]

    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]

    repository = Repository(
        user_id=user_id,
        repo_name=repo_name,
        repo_url=str(repository_data.repo_url),
        status="pending",
    )

    db.add(repository)
    db.commit()
    db.refresh(repository)

    try:
        repo_path = clone_repository(
            str(repository_data.repo_url),
            repository.id,
        )

        save_repository_files(
            repo_path,
            repository.id,
            db,
        )

        repository.status = "cloned"
        db.commit()
        db.refresh(repository)

    except Exception:
        repository.status = "failed"
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Failed to clone or scan repository",
        )

    return repository