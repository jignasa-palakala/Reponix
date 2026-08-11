from app.services.embedding_service import generate_embedding
from app.services.vector_store import search_code


def search_repository(
    query: str,
    repository_id: int,
    top_k: int = 5,
):
    query_embedding = generate_embedding(query)

    results = search_code(
        query_embedding=query_embedding,
        repository_id=repository_id,
        top_k=top_k,
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    matches = []

    for document, metadata, distance in zip(
        documents,
        metadatas,
        distances,
    ):
        matches.append(
            {
                "content": document,
                "file_path": metadata.get("file_path"),
                "distance": distance,
            }
        )

    return matches