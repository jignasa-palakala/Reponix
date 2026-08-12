from app.models.conversation import Conversation
from app.models.message import Message
from app.services.llm_service import generate_answer
from app.services.search_service import search_repository


def chat_with_repository(
    question: str,
    repository_id: int,
    user_id: int,
    conversation_id: int | None,
    db,
    top_k: int = 5,
):
    # --------------------------------------------------
    # Create or load conversation
    # --------------------------------------------------

    if conversation_id is None:
        conversation = Conversation(
            user_id=user_id,
            repository_id=repository_id,
            title=question[:255],
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        conversation_id = conversation.id

    else:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
                Conversation.repository_id == repository_id,
            )
            .first()
        )

        if conversation is None:
            raise ValueError("Conversation not found")

    # --------------------------------------------------
    # Save user message
    # --------------------------------------------------

    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=question,
        sources=None,
    )

    db.add(user_message)
    db.commit()

    # --------------------------------------------------
    # Search repository
    # --------------------------------------------------

    results = search_repository(
        query=question,
        repository_id=repository_id,
        top_k=top_k,
    )

    # --------------------------------------------------
    # Build LLM context
    # --------------------------------------------------

    context_parts = []

    for result in results:
        context_parts.append(
            f"FILE: {result['file_path']}\n"
            f"{result['content']}"
        )

    context = "\n\n---\n\n".join(context_parts)

    # --------------------------------------------------
    # Generate AI answer
    # --------------------------------------------------

    answer = generate_answer(
        question=question,
        context=context,
    )

    # --------------------------------------------------
    # Prepare sources for database
    # --------------------------------------------------

    saved_sources = []

    for result in results:
        saved_sources.append(
            {
                "file_path": result.get("file_path"),
                "content": result.get("content", ""),
                "distance": float(
                    result.get("distance", 0)
                ),
            }
        )

    # --------------------------------------------------
    # Save AI message + sources
    # --------------------------------------------------

    assistant_message = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=answer,
        sources=saved_sources,
    )

    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    # --------------------------------------------------
    # Return response
    # --------------------------------------------------

    return {
        "conversation_id": conversation_id,
        "answer": answer,
        "sources": saved_sources,
    }