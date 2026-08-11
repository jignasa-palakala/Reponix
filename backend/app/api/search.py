from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.schemas.search import (
    SearchRequest,
    SearchResponse,
)
from app.services.search_service import search_repository


router = APIRouter(
    prefix="/api/search",
    tags=["Search"],
)


@router.post(
    "",
    response_model=SearchResponse,
)
def search(
    search_data: SearchRequest,
    user_id: int = Depends(get_current_user_id),
):
    results = search_repository(
        query=search_data.query,
        repository_id=search_data.repository_id,
        top_k=search_data.top_k,
    )

    return {
        "results": results,
    }