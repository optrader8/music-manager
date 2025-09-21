#!/usr/bin/env python3
"""Script to perform initial scan of the music library."""

import logging
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.db.session import SessionLocal
from app.services import FileScannerService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def run_initial_scan():
    """Run the initial music library scan."""
    # Check if music library path exists
    if not settings.music_library_path.exists():
        logger.error(f"Music library path does not exist: {settings.music_library_path}")
        print(f"❌ Music library path not found: {settings.music_library_path}")
        print("Please ensure the path is mounted and accessible.")
        sys.exit(1)

    # Check if directory is readable
    if not settings.music_library_path.is_dir():
        logger.error(f"Music library path is not a directory: {settings.music_library_path}")
        sys.exit(1)

    session = SessionLocal()
    try:
        logger.info(f"Starting initial library scan of: {settings.music_library_path}")
        print(f"🎵 Starting scan of: {settings.music_library_path}")

        scanner = FileScannerService(session, settings.music_library_path)
        result = scanner.scan()

        print(f"\n✅ Scan completed successfully!")
        print(f"📊 Scan Results:")
        print(f"   Files scanned: {result.scanned_files}")
        print(f"   Tracks created: {result.created_tracks}")
        print(f"   Tracks updated: {result.updated_tracks}")
        print(f"   Files skipped: {result.skipped_files}")
        print(f"   Duplicates found: {len(result.duplicates)}")

        if result.duplicates:
            print(f"\n⚠️  Duplicate files found:")
            for i, dup in enumerate(result.duplicates, 1):
                print(f"   {i}. Original: {dup.existing_path}")
                print(f"      Duplicate: {dup.duplicate_path}")

        logger.info("Initial scan completed successfully")

    except KeyboardInterrupt:
        print(f"\n⏹️  Scan interrupted by user")
        session.rollback()
        sys.exit(0)

    except Exception as e:
        logger.error(f"Scan failed: {e}", exc_info=True)
        print(f"❌ Scan failed: {e}")
        session.rollback()
        sys.exit(1)

    finally:
        session.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Scan music library and populate database")
    parser.add_argument(
        "--path",
        help="Override music library path",
        type=Path,
    )

    args = parser.parse_args()

    if args.path:
        # Override the config path temporarily
        settings.music_library_path = args.path
        print(f"Using custom path: {args.path}")

    run_initial_scan()