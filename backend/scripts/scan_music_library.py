#!/usr/bin/env python3
"""
High-performance music library scanner for /mnt/nas-music
Optimized for large libraries with duplicate detection
"""

import logging
import sys
import time
from pathlib import Path
from typing import List, Set

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.db.session import SessionLocal
from app.services import FileScannerService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("music_scan.log")
    ]
)
logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".mp3", ".flac", ".aac", ".ogg", ".m4a", ".wav"}

def count_audio_files(library_path: Path) -> int:
    """Quick count of audio files for progress tracking."""
    logger.info("Counting audio files...")
    count = 0
    try:
        for ext in SUPPORTED_EXTENSIONS:
            # Use glob for faster counting
            count += len(list(library_path.rglob(f"*{ext}")))
    except Exception as e:
        logger.warning(f"Error counting files: {e}")
        return 0

    logger.info(f"Found approximately {count} audio files")
    return count

def scan_library_optimized():
    """Optimized library scan with progress tracking."""
    library_path = settings.music_library_path

    # Verify library path exists
    if not library_path.exists():
        logger.error(f"Library path does not exist: {library_path}")
        print(f"❌ Library path not found: {library_path}")
        return False

    if not library_path.is_dir():
        logger.error(f"Library path is not a directory: {library_path}")
        return False

    # Quick size check
    logger.info(f"📁 Scanning library: {library_path}")
    print(f"📁 Music library: {library_path}")

    # Show folder structure
    try:
        folders = [d for d in library_path.iterdir() if d.is_dir()]
        print(f"📂 Found {len(folders)} main folders:")
        for folder in sorted(folders)[:10]:  # Show first 10 folders
            print(f"   - {folder.name}")
        if len(folders) > 10:
            print(f"   ... and {len(folders) - 10} more folders")
    except Exception as e:
        logger.warning(f"Could not list folders: {e}")

    # Count files for progress
    total_files = count_audio_files(library_path)
    if total_files == 0:
        print("⚠️  No audio files found!")
        return False

    session = SessionLocal()
    start_time = time.time()

    try:
        logger.info("🎵 Starting music library scan...")
        print(f"🎵 Starting scan of ~{total_files:,} audio files...")

        scanner = FileScannerService(session, library_path)
        result = scanner.scan()

        elapsed = time.time() - start_time

        # Display results
        print(f"\n✅ Scan completed in {elapsed:.1f} seconds!")
        print(f"📊 Scan Results:")
        print(f"   📁 Files scanned: {result.scanned_files:,}")
        print(f"   ➕ Tracks created: {result.created_tracks:,}")
        print(f"   ♻️  Tracks updated: {result.updated_tracks:,}")
        print(f"   ⏭️  Files skipped: {result.skipped_files:,}")
        print(f"   🔄 Duplicates found: {len(result.duplicates):,}")

        if result.duplicates:
            print(f"\n⚠️  Duplicate files detected:")
            for i, dup in enumerate(result.duplicates[:5], 1):  # Show first 5 duplicates
                print(f"   {i}. Original: {dup.existing_path}")
                print(f"      Duplicate: {dup.duplicate_path}")

            if len(result.duplicates) > 5:
                print(f"   ... and {len(result.duplicates) - 5} more duplicates")

            print(f"\n💡 Tip: Review duplicates in music_scan.log")

        # Performance stats
        if result.scanned_files > 0:
            rate = result.scanned_files / elapsed
            print(f"⚡ Processing rate: {rate:.1f} files/second")

        logger.info(f"Scan completed successfully in {elapsed:.1f}s")
        logger.info(f"Created: {result.created_tracks}, Updated: {result.updated_tracks}")

        return True

    except KeyboardInterrupt:
        print(f"\n⏹️  Scan interrupted by user")
        logger.info("Scan interrupted by user")
        session.rollback()
        return False

    except Exception as e:
        logger.error(f"Scan failed: {e}", exc_info=True)
        print(f"❌ Scan failed: {e}")
        session.rollback()
        return False

    finally:
        session.close()

def main():
    """Main entry point."""
    print("🎼 Music Manager - Library Scanner")
    print("=" * 50)

    # Check dependencies
    try:
        import mutagen
        logger.info(f"Mutagen version: {mutagen.version_string}")
    except ImportError:
        print("❌ Mutagen library not found. Please install requirements.txt")
        return 1

    # Run the scan
    success = scan_library_optimized()

    if success:
        print(f"\n🎉 Database successfully populated!")
        print(f"🌐 You can now start the API server:")
        print(f"   cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        return 0
    else:
        print(f"\n❌ Scan failed. Check music_scan.log for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())