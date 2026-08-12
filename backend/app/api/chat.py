from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user_id
from app.database.connection import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetail,
    ConversationSummary,
    MessageResponse,
    ChatSource,
)
from app.services.chat_service import chat_with_repository


router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)


@router.post(
    "",
    response_model=ChatResponse,
)
def chat(
    chat_data: ChatRequest,
    user_id: int = Depends(get_current_user_id),
    db=Depends(get_db),
):
    try:
        return chat_with_repository(
            question=chat_data.question,
            repository_id=chat_data.repository_id,
            user_id=user_id,
            conversation_id=chat_data.conversation_id,
            db=db,
            top_k=chat_data.top_k,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )


@router.get(
    "/conversations",
    response_model=list[ConversationSummary],
)
def get_conversations(
    user_id: int = Depends(get_current_user_id),
    db=Depends(get_db),
):
    return (
        db.query(Conversation)
        .filter(
            Conversation.user_id == user_id
        )
        .order_by(
            Conversation.created_at.desc()
        )
        .all()
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetail,
)
def get_conversation(
    conversation_id: int,
    user_id: int = Depends(get_current_user_id),
    db=Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        .first()
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    return {
        "id": conversation.id,
        "repository_id": conversation.repository_id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "messages": conversation.messages,
    }