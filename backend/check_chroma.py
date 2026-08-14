#!/usr/bin/env python3
"""
Diagnostic script to check if Chroma has line number metadata.
"""

import chromadb

CHROMA_PATH = "chroma_data"

client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(name="reponix_code")

# Get some sample chunks
results = collection.get(limit=5)

print("=" * 70)
print("CHROMA METADATA DIAGNOSTIC")
print("=" * 70)

if not results or not results.get("metadatas"):
    print("❌ No chunks found in Chroma!")
else:
    total_chunks = collection.count()
    print(f"✅ Total chunks in collection: {total_chunks}")
    print()
    
    for i, (doc_id, metadata) in enumerate(zip(results.get("ids", []), results.get("metadatas", []))):
        print(f"Sample Chunk {i + 1}: {doc_id}")
        print(f"  Metadata: {metadata}")
        
        if "start_line" in metadata and "end_line" in metadata:
            print(f"  ✅ Has line numbers: {metadata['start_line']} - {metadata['end_line']}")
        else:
            print(f"  ❌ MISSING line numbers")
        print()

print("=" * 70)
print("RECOMMENDATION:")
print("=" * 70)

# Check if ANY chunk has line numbers
if results and results.get("metadatas"):
    has_any_line_numbers = any(
        "start_line" in meta and "end_line" in meta 
        for meta in results.get("metadatas", [])
    )
    
    if has_any_line_numbers:
        print("✅ Some chunks have line numbers. Your new data is working.")
        print("   Old indexed repositories need to be re-indexed:")
        print("   POST /api/repositories/{repo_id}/reindex")
    else:
        print("❌ No chunks have line numbers yet.")
        print("   Repositories haven't been indexed since the line number feature was added.")
        print("   To enable line highlighting:")
        print("   1. Add a new repository via the UI, or")
        print("   2. Re-index existing repositories:")
        print("      POST /api/repositories/{repo_id}/reindex")
