from app.services.embedding_service import generate_embedding


text = """
def generate_jwt(user_id):
    return create_access_token(user_id)
"""


embedding = generate_embedding(text)

print("Embedding dimensions:", len(embedding))
print("First 10 values:", embedding[:10])