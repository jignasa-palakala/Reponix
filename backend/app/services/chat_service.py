from app.services.llm_service import generate_answer
from app.services.search_service import search_repository


def chat_with_repository(
    question: str,
    repository_id: int,
    top_k: int = 5,
):
    results = search_repository(
        query=question,
        repository_id=repository_id,
        top_k=top_k,
    )

    context_parts = []

    for result in results:
        context_parts.append(
            f"FILE: {result['file_path']}\n"
            f"{result['content']}"
        )

    context = "\n\n---\n\n".join(context_parts)

    answer = generate_answer(
        question=question,
        context=context,
    )

    return {
        "answer": answer,
        "sources": results,
    }