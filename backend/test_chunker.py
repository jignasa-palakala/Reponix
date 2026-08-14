from app.services.chunker import chunk_text, chunk_text_with_line_ranges


text = """
Authentication begins when the user submits their email
and password. The server validates the credentials against
the database. If the credentials are valid, the server
generates a JWT token. The token is returned to the client
and used for protected requests.
"""


print("Testing chunk_text (legacy - content only):")
chunks = chunk_text(
    text,
    chunk_size=100,
    overlap=20,
)

for index, chunk in enumerate(chunks):
    print(f"\n--- CHUNK {index} ---")
    print(chunk)


print("\n" + "="*60)
print("Testing chunk_text_with_line_ranges (with line numbers):")
chunks_with_ranges = chunk_text_with_line_ranges(
    text,
    chunk_size=100,
    overlap=20,
)

for index, chunk_data in enumerate(chunks_with_ranges):
    print(f"\n--- CHUNK {index} ---")
    print(f"Lines: {chunk_data['start_line']} - {chunk_data['end_line']}")
    print(f"Content:\n{chunk_data['content']}")