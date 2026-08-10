from app.services.chunker import chunk_text


text = """
Authentication begins when the user submits their email
and password. The server validates the credentials against
the database. If the credentials are valid, the server
generates a JWT token. The token is returned to the client
and used for protected requests.
"""


chunks = chunk_text(
    text,
    chunk_size=100,
    overlap=20,
)

for index, chunk in enumerate(chunks):
    print(f"\n--- CHUNK {index} ---")
    print(chunk)