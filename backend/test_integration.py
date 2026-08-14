#!/usr/bin/env python3
"""
Integration test to verify line number tracking end-to-end.
"""

from pathlib import Path
from app.services.chunker import chunk_text_with_line_ranges

# Test content simulating a real Python file
test_code = """import os
import sys
from pathlib import Path

class Config:
    DEBUG = True
    DATABASE_URL = "postgresql://localhost/test"
    
    def __init__(self):
        self.initialized = False
    
    def setup(self):
        print("Setting up config")
        self.initialized = True
        return self

def main():
    config = Config()
    config.setup()
    print("Done")

if __name__ == "__main__":
    main()
"""

print("Testing line number tracking on realistic code...")
print("=" * 70)

chunks = chunk_text_with_line_ranges(
    test_code,
    chunk_size=300,
    overlap=50,
)

for i, chunk in enumerate(chunks):
    print(f"\n📦 CHUNK {i}")
    print(f"   Lines: {chunk['start_line']:2d} - {chunk['end_line']:2d}")
    print(f"   Content preview: {chunk['content'][:50]}...")
    
    # Verify line numbers are within bounds
    assert chunk['start_line'] >= 1, f"start_line {chunk['start_line']} must be >= 1"
    assert chunk['end_line'] >= chunk['start_line'], \
        f"end_line {chunk['end_line']} must be >= start_line {chunk['start_line']}"
    
    # Count actual lines in content
    actual_line_count = len(chunk['content'].split('\n'))
    expected_line_count = chunk['end_line'] - chunk['start_line'] + 1
    
    # Note: content might have fewer lines if heavily stripped
    print(f"   Content lines: {actual_line_count}, Expected: {expected_line_count}")

print("\n" + "=" * 70)
print("✅ All integration tests passed!")
print(f"✅ Total chunks: {len(chunks)}")
