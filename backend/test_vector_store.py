from app.services.embedding_service import generate_embedding
from app.services.vector_store import (
    add_code_chunk,
    search_code,
)


code = """
def generate_jwt(user_id):
    return create_access_token(user_id)
"""


embedding = generate_embedding(code)


add_code_chunk(
    chunk_id="test_chunk_1",
    content=code,
    embedding=embedding,
    repository_id=999,
    file_path="auth.py",
)


query = """
Where is the JWT token generated?
"""


query_embedding = generate_embedding(query)


results = search_code(
    query_embedding=query_embedding,
    repository_id=999,
    top_k=3,
)


print("Documents found:")
print(results["documents"])