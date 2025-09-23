#!/usr/bin/env python3
"""
Create analysis tables directly in the database
This is a fallback script if Alembic is not configured
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import engine
from app.db.models.scan_log import ScanLog, DuplicateFile
from app.db.base import Base

def create_tables():
    """Create the analysis tables in the database"""
    print("Creating analysis tables...")

    try:
        # Create tables
        Base.metadata.create_all(bind=engine, tables=[ScanLog.__table__, DuplicateFile.__table__])
        print("✅ Analysis tables created successfully!")
        print("   - scan_logs")
        print("   - duplicate_files")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_tables()