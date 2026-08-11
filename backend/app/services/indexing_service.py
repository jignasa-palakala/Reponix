from pathlib import Path

from sqlalchemy.orm import Session

from app.models.repository_file import RepositoryFile
from app.services.chunker import chunk_text
from app.services.embedding_service import generate_embedding
from app.services.file_reader import read_file_content
from app.services.vector_store import add_code_chunk


def index_repository(
    repo_path: Path,
    repository_id: int,
    db: Session,
) -> int:

    files = (
        db.query(RepositoryFile)
        .filter(
            RepositoryFile.repository_id == repository_id
        )
        .all()
    )

    total_chunks = 0

    for repository_file in files:

        content = read_file_content(
            repo_path,
            repository_file.file_path,
        )

        chunks = chunk_text(content)

        for chunk_index, chunk in enumerate(chunks):

            embedding = generate_embedding(chunk)

            chunk_id = (
                f"repo_{repository_id}_"
                f"file_{repository_file.id}_"
                f"chunk_{chunk_index}"
            )

            add_code_chunk(
                chunk_id=chunk_id,
                content=chunk,
                embedding=embedding,
                repository_id=repository_id,
                file_path=repository_file.file_path,
            )

            total_chunks += 1

    return total_chunks