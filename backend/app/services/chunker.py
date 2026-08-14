def chunk_text(
    content: str,
    chunk_size: int = 1200,
    overlap: int = 200,
) -> list[str]:
    """Legacy function - returns only chunk content."""
    chunks_with_lines = chunk_text_with_line_ranges(
        content,
        chunk_size,
        overlap,
    )
    return [chunk["content"] for chunk in chunks_with_lines]


def chunk_text_with_line_ranges(
    content: str,
    chunk_size: int = 1200,
    overlap: int = 200,
) -> list[dict]:
    """
    Chunk text and return content with accurate line ranges.
    
    Returns list of dicts with:
    - content: the chunk text
    - start_line: 1-indexed start line number
    - end_line: 1-indexed end line number (inclusive)
    """
    if not content.strip():
        return []

    if overlap >= chunk_size:
        raise ValueError(
            "overlap must be smaller than chunk_size"
        )

    # Pre-calculate line number for each character position
    char_to_line = [1]  # Line number for position 0
    current_line = 1
    for i, char in enumerate(content):
        if char == '\n':
            current_line += 1
        char_to_line.append(current_line)

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

        chunk_content = content[start:end].strip()

        if chunk_content:
            # Calculate line numbers for this chunk
            # Find the start position (skip leading whitespace)
            chunk_start_pos = start
            while chunk_start_pos < end and content[chunk_start_pos].isspace():
                chunk_start_pos += 1
            
            # Find the end position (skip trailing whitespace)
            chunk_end_pos = end - 1
            while chunk_end_pos > chunk_start_pos and content[chunk_end_pos].isspace():
                chunk_end_pos -= 1

            # Get line numbers (ensure within bounds)
            start_line = char_to_line[min(chunk_start_pos, len(char_to_line) - 1)]
            end_line = char_to_line[min(chunk_end_pos, len(char_to_line) - 1)]

            chunks.append({
                "content": chunk_content,
                "start_line": start_line,
                "end_line": end_line,
            })

        if end >= content_length:
            break

        start = max(end - overlap, start + 1)

    return chunks