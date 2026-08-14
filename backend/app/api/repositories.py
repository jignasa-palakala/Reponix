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
from app.services.vector_store import delete_repository_chunks
from pathlib import Path
from urllib.parse import unquote

from app.models.repository_file import RepositoryFile

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

@router.get(
    "",
    response_model=list[RepositoryResponse],
)
def get_repositories(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return (
        db.query(Repository)
        .filter(Repository.user_id == user_id)
        .order_by(Repository.id.desc())
        .all()
    )

@router.get("/{repository_id}/file")
def get_repository_file(
    repository_id: int,
    path: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    repository = (
        db.query(Repository)
        .filter(
            Repository.id == repository_id,
            Repository.user_id == user_id,
        )
        .first()
    )

    if repository is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    file_path = unquote(path)

    repository_file = (
        db.query(RepositoryFile)
        .filter(
            RepositoryFile.repository_id == repository_id,
            RepositoryFile.file_path == file_path,
        )
        .first()
    )

    if repository_file is None:
        raise HTTPException(
            status_code=404,
            detail="File not found",
        )

    repos_directory = (
        Path(__file__).resolve().parents[2].parent / "repos"
    )

    repo_directory = (
        repos_directory / f"repo_{repository_id}"
    ).resolve()

    actual_file = (
        repo_directory / file_path
    ).resolve()

    # Security: prevent ../ path traversal
    try:
        actual_file.relative_to(repo_directory)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file path",
        )

    if not actual_file.is_file():
        raise HTTPException(
            status_code=404,
            detail="File does not exist",
        )

    try:
        content = actual_file.read_text(
            encoding="utf-8",
            errors="replace",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to read file: {exc}",
        )

    return {
        "id": repository_file.id,
        "file_name": repository_file.file_name,
        "file_path": repository_file.file_path,
        "language": repository_file.language,
        "size": repository_file.size,
        "content": content,
    }

@router.get("/{repository_id}/files")
def get_repository_files(
    repository_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    repository = (
        db.query(Repository)
        .filter(
            Repository.id == repository_id,
            Repository.user_id == user_id,
        )
        .first()
    )

    if repository is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    files = (
        db.query(RepositoryFile)
        .filter(
            RepositoryFile.repository_id == repository_id
        )
        .order_by(RepositoryFile.file_path)
        .all()
    )

    return files


@router.post("/{repository_id}/reindex")
def reindex_repository(
    repository_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Re-index an existing repository.
    Useful for updating metadata (e.g., line numbers) after code changes.
    """
    repository = (
        db.query(Repository)
        .filter(
            Repository.id == repository_id,
            Repository.user_id == user_id,
        )
        .first()
    )

    if repository is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    try:
        # Get repository path
        repos_directory = (
            Path(__file__).resolve().parents[2].parent / "repos"
        )
        repo_path = (
            repos_directory / f"repo_{repository_id}"
        ).resolve()

        if not repo_path.is_dir():
            raise HTTPException(
                status_code=400,
                detail="Repository directory not found",
            )

        # Update status
        repository.status = "indexing"
        db.commit()
        db.refresh(repository)

        # Delete old chunks from vector store
        delete_repository_chunks(repository_id)

        # Re-index
        total_chunks = index_repository(
            repo_path,
            repository.id,
            db,
        )

        # Mark as complete
        repository.status = "ready"
        db.commit()
        db.refresh(repository)

        return {
            "id": repository.id,
            "message": f"Repository re-indexed successfully: {total_chunks} chunks",
            "total_chunks": total_chunks,
        }

    except Exception as exc:
        repository.status = "failed"
        db.commit()

        print("REINDEX ERROR:", repr(exc))

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )