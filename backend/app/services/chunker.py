def chunk_text(
    content: str,
    chunk_size: int = 1200,
    overlap: int = 200,
) -> list[str]:
    if not content.strip():
        return []

    if overlap >= chunk_size:
        raise ValueError(
            "overlap must be smaller than chunk_size"
        )

    chunks = []

    start = 0
    content_length = len(content)

    while start < content_length:
        end = min(
            start + chunk_size,
            content_length,
        )

        # Try to end the chunk at a natural boundary.
        if end < content_length:
            boundary = content.rfind("\n", start, end)

            if boundary > start:
                end = boundary

        chunk = content[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= content_length:
            break

        start = max(end - overlap, start + 1)

    return chunks