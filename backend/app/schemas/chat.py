from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    repository_id: int

    question: str = Field(
        min_length=1
    )

    conversation_id: int | None = None

    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
    )


class ChatSource(BaseModel):
    file_path: str | None = None

    content: str

    distance: float


class ChatResponse(BaseModel):
    conversation_id: int

    answer: str

    sources: list[ChatSource]


class ConversationSummary(BaseModel):
    id: int

    repository_id: int

    title: str

    created_at: datetime


class MessageResponse(BaseModel):
    id: int

    role: str

    content: str

    created_at: datetime

    sources: list[ChatSource] | None = None


class ConversationDetail(BaseModel):
    id: int

    repository_id: int

    title: str

    created_at: datetime

    messages: list[MessageResponse]