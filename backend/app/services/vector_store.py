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
):
    collection.add(
        ids=[chunk_id],
        documents=[content],
        embeddings=[embedding],
        metadatas=[
            {
                "repository_id": repository_id,
                "file_path": file_path,
            }
        ],
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