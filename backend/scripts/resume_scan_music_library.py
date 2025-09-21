#!/usr/bin/env python3
"""
Resume music library scanning script.
Only processes files that are not already in the database.
"""

import logging
import sys
from pathlib import Path

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import get_session
from app.services.file_scanner_service import FileScannerService

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("music_scan_resume.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


def main():
    """Resume scanning music library, skipping already processed files."""

    # Configuration
    library_path = Path("/mnt/nas-music")

    if not library_path.exists():
        logger.error(f"❌ Library path does not exist: {library_path}")
        return 1

    logger.info("🎵 Starting resumed music library scan...")
    logger.info(f"📁 Library path: {library_path}")

    try:
        # Create database session
        session = get_session()

        # Create scanner service
        scanner = FileScannerService(session, library_path)

        # Scan library (will skip existing files automatically)
        result = scanner.scan()

        # Print results
        logger.info("\n📊 Resume Scan Results:")
        logger.info(f"  📂 Files scanned: {result.scanned_files:,}")
        logger.info(f"  ➕ New tracks created: {result.created_tracks:,}")
        logger.info(f"  🔄 Tracks updated: {result.updated_tracks:,}")
        logger.info(f"  ⏭️  Files skipped: {result.skipped_files:,}")
        logger.info(f"  🔄 Duplicates found: {len(result.duplicates):,}")

        if result.duplicates:
            logger.info("\n🔄 Duplicate files detected:")
            for i, dup in enumerate(result.duplicates[:10]):  # Show first 10
                logger.info(f"  {i+1}. Original: {dup.existing_path}")
                logger.info(f"     Duplicate: {dup.duplicate_path}")

            if len(result.duplicates) > 10:
                logger.info(f"  ... and {len(result.duplicates) - 10} more duplicates")

        logger.info(f"\n✅ Resume scan completed!")
        return 0

    except KeyboardInterrupt:
        logger.info("\n⚠️  Scan interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"❌ Error during scan: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        try:
            session.close()
        except:
            pass


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)