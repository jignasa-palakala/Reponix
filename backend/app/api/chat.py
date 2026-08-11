from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.schemas.chat import ChatRequest, ChatResponse
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
):
    return chat_with_repository(
        question=chat_data.question,
        repository_id=chat_data.repository_id,
        top_k=chat_data.top_k,
    )