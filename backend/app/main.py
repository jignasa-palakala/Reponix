from fastapi import FastAPI
from sqlalchemy import text
from app.api.search import router as search_router
from app.database.connection import engine
from app.api.auth import router as auth_router
from app.api.repositories import router as repositories_router
from app.api.chat import router as chat_router

app = FastAPI(title="Reponix API")
app.include_router(auth_router)
app.include_router(repositories_router)
app.include_router(search_router)
app.include_router(chat_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Reponix API",
    }


@app.get("/health/database")
def database_health_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
        "result": result.scalar(),
    }