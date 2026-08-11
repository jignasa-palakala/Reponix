from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.database.connection import get_db
from app.models.repository import Repository
from app.schemas.repository import (
    RepositoryCreate,
    RepositoryResponse,
)
from app.services.file_scanner import save_repository_files
from app.services.indexing_service import index_repository
from app.services.repository_service import clone_repository


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
        # 1. Clone repository
        repo_path = clone_repository(
            str(repository_data.repo_url),
            repository.id,
        )

        # 2. Scan and save files to PostgreSQL
        save_repository_files(
            repo_path,
            repository.id,
            db,
        )

        # 3. Start indexing
        repository.status = "indexing"
        db.commit()
        db.refresh(repository)

        # 4. Chunk → embed → ChromaDB
        total_chunks = index_repository(
            repo_path,
            repository.id,
            db,
        )

        # 5. Indexing completed
        repository.status = "ready"
        db.commit()
        db.refresh(repository)

        print(
            f"Repository {repository.id} indexed "
            f"successfully: {total_chunks} chunks"
        )

    except Exception as exc:
        repository.status = "failed"
        db.commit()

        print(
            "REPOSITORY ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

    return repository