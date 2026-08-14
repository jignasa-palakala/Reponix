from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    repository_id: int
    query: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResult(BaseModel):
    content: str
    file_path: str | None
    distance: float
    start_line: int | None = None
    end_line: int | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]