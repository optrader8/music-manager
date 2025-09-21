#!/usr/bin/env python3
"""Quick test scan for 10 files"""

import os
import sys
from pathlib import Path

# Set database URL
backend_dir = Path(__file__).parent
os.environ['DATABASE_URL'] = f"sqlite:///{backend_dir}/music_manager.db"

sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.db.session import SessionLocal
from app.services.file_scanner_service import FileScannerService

def test_scan():
    print("🧪 Quick Test Scan - 10 files only")
    print(f"📂 Library: {settings.music_library_path}")
    print(f"💾 Database: {os.environ['DATABASE_URL']}")

    if not settings.music_library_path.exists():
        print(f"❌ Library not found: {settings.music_library_path}")
        return

    session = SessionLocal()
    try:
        scanner = FileScannerService(session, settings.music_library_path)

        # Test with just first 3 files for speed
        print("🎵 Testing with first 3 audio files...")

        files_found = 0
        for file_path in scanner.iter_audio_files(settings.music_library_path):
            files_found += 1
            print(f"   Found: {file_path}")
            if files_found >= 3:
                break

        if files_found == 0:
            print("❌ No audio files found!")
            return

        print(f"\n✅ Found {files_found} files. Testing scan...")
        result = scanner.scan(limit_files=3)

        print(f"\n📊 Results:")
        print(f"   📁 Scanned: {result.scanned_files}")
        print(f"   ➕ Created: {result.created_tracks}")
        print(f"   ⏭️  Skipped: {result.skipped_files}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    test_scan()