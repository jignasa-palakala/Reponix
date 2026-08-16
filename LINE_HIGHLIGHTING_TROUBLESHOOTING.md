# Line Highlighting Not Working - Diagnosis & Fix

## The Problem

No lines are highlighted in the source files when you click on a source in the chat. This happens because:

**Root Cause**: Your repositories were indexed BEFORE the line-number feature was added. The chunks stored in Chroma don't have `start_line` and `end_line` metadata yet.

## How Line Highlighting Works

```
1. User asks a question
   ↓
2. Backend searches Chroma for relevant code chunks
   ↓
3. Chroma returns chunks WITH metadata (start_line, end_line)
   ↓
4. Backend includes line numbers in API response
   ↓
5. Frontend displays "Lines X–Y" in source card
   ↓
6. User clicks source → navigates to file viewer with ?start=X&end=Y
   ↓
7. File viewer highlights those specific lines
```

## Why It's Not Working Now

Your Chroma database has chunks WITHOUT line metadata because they were created before the code changes. When searching, the results don't include line numbers.

## The Fix: Re-Index Your Repositories

### Option 1: Automatic Re-Indexing (Recommended)

**In the backend directory, with your virtual environment activated:**

```bash
cd c:\Users\Jignasa\REPONIX\Reponix\backend

# Activate venv first (if not already active)
.venv\Scripts\activate.bat

# Run the re-indexing script
python reindex_repositories.py
```

This will:
- Find all your repositories
- Delete old chunks from Chroma
- Re-chunk files with accurate line numbers
- Update Chroma metadata
- Preserve all chat history

### Option 2: Via API (For Individual Repositories)

If you only want to re-index one repository:

```bash
# Make sure your backend is running
curl -X POST http://localhost:8000/api/repositories/1/reindex \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Replace `1` with your repository ID and `YOUR_ACCESS_TOKEN` with a valid auth token.

## Verification

After re-indexing:

1. **Start a new chat** (don't load old conversations)
2. **Ask a question** about the repository
3. **Check the response** - sources should show "Lines X–Y"
4. **Click a source** to navigate to the file viewer
5. **Verify** - the specified lines should be highlighted in blue

## Why Old Conversations Don't Show Line Numbers

Old chat messages (created before re-indexing) were saved without line numbers. They'll still work fine - they just won't have the line highlighting. New chats after re-indexing will have complete line information.

If you want old conversations to have line numbers:
1. Re-index the repository (see above)
2. The old messages will remain unchanged (by design - preserves history)
3. Ask the same question again in a new chat
4. The new response will have line numbers

## Database & Chroma Status

| Component | Status | What It Contains |
|-----------|--------|------------------|
| PostgreSQL | OK | Chat history, user data, file metadata |
| Chroma | Needs Update | Code chunks with/without line metadata |
| Frontend | OK | Already supports line highlighting |

## If Re-Indexing Fails

**Error: "Repository directory not found"**
- Your repository was cloned and stored in `repos/repo_N/`
- If it's missing, re-create the repository from the dashboard UI

**Error: Database connection failed**
- Check your `.env` file has correct `DATABASE_URL`
- Ensure PostgreSQL is running
- Check the connection string

**Error: Chroma permission denied**
- Check that `chroma_data/` directory exists and is writable
- Delete `chroma_data/` and restart (will lose old chunks, keeping chat history)

## Testing Without Re-Indexing

To test that line highlighting works WITHOUT re-indexing:

1. Create a simple Python script with test code
2. Save it as `test_lines.py` in your repository
3. Add it to your repository via the file scanner
4. Index just that file manually (requires backend code modification)
5. Ask about it in chat
6. Check if line numbers appear

But realistically, the quickest way is to **re-index all repositories** using the script above.

## Next Steps

1. Run `python reindex_repositories.py` with venv activated
2. Wait for completion (time depends on repository size)
3. Start a new chat and ask a question
4. Click a source to see line highlighting in action ✨

---

**Need help?** Check `IMPLEMENTATION_SUMMARY.md` for technical details about how line tracking works.
