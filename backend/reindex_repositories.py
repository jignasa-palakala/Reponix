#!/usr/bin/env python3
"""
Script to re-index all repositories with line number metadata.
Run this after the line-number feature is installed.
"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.models.repository import Repository
from app.services.indexing_service import index_repository
from app.services.vector_store import delete_repository_chunks

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost/reponix"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def main():
    print("=" * 70)
    print("REPONIX REPOSITORY RE-INDEXING")
    print("=" * 70)
    print()
    print("This script will re-index all repositories with line number metadata.")
    print("Old chunks in Chroma will be cleared and recreated.")
    print()
    
    # Get all repositories
    repositories = db.query(Repository).all()
    
    if not repositories:
        print("❌ No repositories found in database.")
        return
    
    print(f"Found {len(repositories)} repository(ies) to re-index:")
    print()
    
    for repo in repositories:
        print(f"  • {repo.id}: {repo.repo_name} ({repo.status})")
    
    print()
    response = input("Continue with re-indexing? (yes/no): ").strip().lower()
    
    if response not in ("yes", "y"):
        print("Cancelled.")
        return
    
    print()
    print("=" * 70)
    
    success_count = 0
    failed_count = 0
    
    for repo in repositories:
        print(f"\nRe-indexing repository {repo.id}: {repo.repo_name}...")
        
        try:
            # Get repository directory
            repos_directory = (
                Path(__file__).resolve().parents[0].parent / "repos"
            )
            repo_path = (repos_directory / f"repo_{repo.id}").resolve()
            
            if not repo_path.is_dir():
                print(f"  ⚠️  Repository directory not found: {repo_path}")
                print(f"     Skipping...")
                failed_count += 1
                continue
            
            # Update status
            repo.status = "indexing"
            db.commit()
            
            # Delete old chunks
            print(f"  Clearing old chunks from Chroma...")
            delete_repository_chunks(repo.id)
            
            # Re-index
            print(f"  Indexing files with line numbers...")
            total_chunks = index_repository(repo_path, repo.id, db)
            
            # Mark as complete
            repo.status = "ready"
            db.commit()
            
            print(f"  ✅ Re-indexed successfully: {total_chunks} chunks")
            success_count += 1
            
        except Exception as exc:
            repo.status = "failed"
            db.commit()
            
            print(f"  ❌ Error: {exc}")
            failed_count += 1
    
    print()
    print("=" * 70)
    print(f"✅ Re-indexing complete!")
    print(f"   Success: {success_count}")
    print(f"   Failed:  {failed_count}")
    print("=" * 70)
    print()
    print("Your repositories now have line number metadata.")
    print("Try asking a question in the chat - line numbers should now appear!")
    
    db.close()

if __name__ == "__main__":
    main()
