from datetime import datetime

from pydantic import BaseModel, HttpUrl


class RepositoryCreate(BaseModel):
    repo_url: HttpUrl


class RepositoryResponse(BaseModel):
    id: int
    repo_name: str
    repo_url: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True