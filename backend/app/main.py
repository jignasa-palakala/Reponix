from fastapi import FastAPI

app = FastAPI(title="Reponix API")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Reponix API"
    }