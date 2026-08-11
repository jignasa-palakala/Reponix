from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    repository_id: int
    question: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=10)


class ChatSource(BaseModel):
    file_path: str | None
    content: str
    distance: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]