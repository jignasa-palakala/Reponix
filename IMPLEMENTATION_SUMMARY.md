# Reponix Exact Source Line Navigation - Implementation Summary

## Overview

Implemented complete end-to-end exact source line navigation for Reponix. When the AI returns search results or chat sources, they now include precise line numbers (start_line and end_line), which are stored in Chroma metadata, returned through APIs, and used to highlight exact lines in the code viewer.

## Architecture

```
File Content
     ↓
Chunker (chunk_text_with_line_ranges) → Accurate line numbers (1-indexed)
     ↓
Indexing Service → Stores chunks with line metadata
     ↓
Vector Store (Chroma) → Persists start_line, end_line in metadata
     ↓
Search/Chat APIs → Returns line numbers in response
     ↓
Frontend → Displays line numbers and highlights in viewer
```

## Implementation Details

### 1. Line Number Calculation (Backend)

**Problem Solved**: The original implementation calculated line numbers by counting lines in the stripped chunk content, which didn't match the actual file line numbers because chunks are extracted by character positions with overlap.

**Solution**: Pre-calculate a character-to-line mapping for the entire file, then use it to accurately identify which lines a chunk spans.

```python
# Before (INCORRECT):
chunk_lines = chunk.splitlines()
start_line = current_line
end_line = current_line + len(chunk_lines) - 1
current_line = end_line + 1  # Accumulates errors!

# After (CORRECT):
# Map each character position to its line number
char_to_line = [1]  # Position 0 is line 1
for char in content:
    if char == '\n':
        current_line += 1
    char_to_line.append(current_line)

# Use this mapping to find exact line ranges
start_line = char_to_line[chunk_start_pos]
end_line = char_to_line[chunk_end_pos]
```

### 2. Data Flow

#### Backend Changes

1. **chunker.py** - Two functions now:
   - `chunk_text()` - Legacy, returns just content for backward compatibility
   - `chunk_text_with_line_ranges()` - Returns list of dicts with content + line numbers

2. **indexing_service.py**
   - Uses `chunk_text_with_line_ranges()` to get accurate line numbers
   - Passes `start_line` and `end_line` to `add_code_chunk()`

3. **chat_service.py**
   - Includes line numbers in LLM context (for better reasoning)
   - Saves `start_line` and `end_line` in source metadata

4. **vector_store.py**
   - Already storing line numbers in Chroma metadata
   - Added `delete_repository_chunks()` for safe re-indexing

5. **schemas** - Updated models:
   - `ChatSource`: Added `start_line` and `end_line` fields
   - `SearchResult`: Added `start_line` and `end_line` fields

6. **repositories.py** - New endpoint:
   - POST `/api/repositories/{repository_id}/reindex` 
   - Safely re-indexes with new metadata

#### Frontend (Already Supported!)

The frontend already has full integration:
- File viewer accepts `?start=X&end=Y` URL parameters
- Chat display shows "Lines X–Y" for each source
- Clicking a source navigates to file viewer with highlighting

## Testing & Verification

### Unit Tests

Run the test suite to verify:

```bash
cd backend
python test_chunker.py          # Line tracking
python test_integration.py      # End-to-end
```

Expected output: Chunks should have accurate line numbers that correspond to their position in the file.

### Integration Testing

1. **New Repository**: Creating a new repository will automatically index with correct line numbers
2. **Existing Repositories**: Call the re-index endpoint:
   ```bash
   curl -X POST http://localhost:8000/api/repositories/1/reindex \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Chat Flow**:
   - Ask a question about the repository
   - Sources in response should include `start_line` and `end_line`
   - Click a source should navigate to file viewer with lines highlighted

## API Changes

### Chat API Response (UPDATED)

```json
{
  "conversation_id": 1,
  "answer": "...",
  "sources": [
    {
      "file_path": "src/auth.py",
      "content": "...",
      "distance": 0.234,
      "start_line": 45,
      "end_line": 52
    }
  ]
}
```

### Search API Response (UPDATED)

```json
{
  "results": [
    {
      "content": "...",
      "file_path": "src/config.py",
      "distance": 0.189,
      "start_line": 10,
      "end_line": 18
    }
  ]
}
```

### Re-index Endpoint (NEW)

```
POST /api/repositories/{repository_id}/reindex

Response:
{
  "id": 1,
  "message": "Repository re-indexed successfully: 156 chunks",
  "total_chunks": 156
}
```

## Backward Compatibility

✅ All existing functionality preserved:
- Chat history stored as before (with added line metadata)
- File explorer works unchanged
- Code viewer works unchanged (enhanced with line highlighting)
- Legacy `chunk_text()` function still available
- Existing repositories can be re-indexed without data loss

## Line Number Format

- **1-indexed** (line 1 is the first line, matching editor conventions)
- **Inclusive ranges** (lines 45-52 includes both line 45 and line 52)
- **Accurate to actual file** (accounts for all newlines, not estimated from chunks)

## Files Modified

```
backend/app/services/chunker.py          ← Core line calculation fix
backend/app/services/indexing_service.py ← Use new chunker
backend/app/services/chat_service.py     ← Include line metadata
backend/app/services/vector_store.py     ← Add delete function
backend/app/schemas/chat.py              ← Schema update
backend/app/schemas/search.py            ← Schema update
backend/app/api/repositories.py          ← Re-index endpoint
backend/test_chunker.py                  ← Updated tests
backend/test_integration.py              ← New integration tests
```

## Migration for Existing Data

Existing chat messages will continue to work even if they don't have line numbers in their source metadata. New chats will have complete line information.

To update existing indexed data:
1. Call the re-index endpoint for each repository
2. This clears old chunks and re-chunks with accurate line numbers
3. Chat history is preserved (stored in PostgreSQL)

## Performance Considerations

- **Chunking overhead**: Minimal - pre-calculation of char_to_line map is O(n) and happens once per file
- **Storage**: Line numbers are small integers, negligible Chroma storage overhead
- **Search**: No impact - same Chroma queries, just more metadata returned
- **Display**: Frontend already handles line highlighting efficiently

## Next Steps (Optional Enhancements)

1. Add breadcrumb navigation in file viewer (e.g., "Class Config > __init__")
2. Add diff view when comparing multiple sources
3. Add code snippet preview in chat (showing context around highlighted lines)
4. Add line-level edit suggestions in chat (e.g., "modify lines 45-52")
