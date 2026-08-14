import chromadb


CHROMA_PATH = "chroma_data"


client = chromadb.PersistentClient(
    path=CHROMA_PATH
)


collection = client.get_or_create_collection(
    name="reponix_code",
)


def add_code_chunk(
    chunk_id: str,
    content: str,
    embedding: list[float],
    repository_id: int,
    file_path: str,
    start_line: int,
    end_line: int,
):
    collection.add(
        ids=[chunk_id],
        documents=[content],
        embeddings=[embedding],
        metadatas=[
            {
                "repository_id": repository_id,
                "file_path": file_path,
                "start_line": start_line,
                "end_line": end_line,
            }
        ],
    )


def delete_repository_chunks(
    repository_id: int,
):
    """Delete all chunks for a repository."""
    collection.delete(
        where={
            "repository_id": repository_id,
        }
    )


def search_code(
    query_embedding: list[float],
    repository_id: int,
    top_k: int = 5,
):
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={
            "repository_id": repository_id,
        },
    )

    return results