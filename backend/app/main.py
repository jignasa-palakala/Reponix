from fastapi import FastAPI
from sqlalchemy import text

from app.database.connection import engine
from app.api.auth import router as auth_router
from app.api.repositories import router as repositories_router
app = FastAPI(title="Reponix API")
app.include_router(auth_router)
app.include_router(repositories_router)

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