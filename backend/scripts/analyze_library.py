#!/usr/bin/env python3
"""
Music Library Analysis Script

This script analyzes the music library to identify:
- Skipped files and their reasons
- Duplicate files based on hash comparison
- Metadata extraction errors
- Unsupported file formats

Results are saved to database and exported as JSON reports.
"""

import argparse
import logging
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.session import SessionLocal
from app.services.analysis_service import AnalysisService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Analyze music library for skipped and duplicate files")
    parser.add_argument(
        "--library-path",
        type=str,
        default="/mnt/nas-music",
        help="Path to music library (default: /mnt/nas-music)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="./analysis_reports",
        help="Directory to save analysis reports (default: ./analysis_reports)"
    )
    parser.add_argument(
        "--skip-db",
        action="store_true",
        help="Skip saving results to database (only export files)"
    )

    args = parser.parse_args()

    library_path = Path(args.library_path)
    output_dir = Path(args.output_dir)

    if not library_path.exists():
        logger.error(f"Library path does not exist: {library_path}")
        sys.exit(1)

    logger.info(f"🎵 Music Library Analysis")
    logger.info(f"📁 Library path: {library_path}")
    logger.info(f"📊 Output directory: {output_dir}")
    logger.info(f"🗃️  Database saving: {'Disabled' if args.skip_db else 'Enabled'}")

    start_time = datetime.now()

    try:
        # Create database session
        session = SessionLocal()

        # Initialize analysis service
        analysis_service = AnalysisService(session, library_path)

        # Run analysis
        logger.info("🔍 Starting library analysis...")
        result = analysis_service.analyze_library()

        # Export reports
        logger.info("📁 Exporting analysis reports...")
        analysis_service.export_analysis_report(result, output_dir)

        # Print summary
        print("\n" + "="*60)
        print("📊 ANALYSIS SUMMARY")
        print("="*60)
        print(f"📂 Total files found: {result.total_files_found:,}")
        print(f"✅ Processed files: {result.processed_files:,}")
        print(f"⏭️  Skipped files: {len(result.skipped_files):,}")
        print(f"🔄 Duplicate files: {len(result.duplicate_files):,}")
        print(f"❌ Metadata errors: {len(result.metadata_errors):,}")

        if result.unsupported_extensions:
            print(f"\n🚫 Unsupported file extensions:")
            for ext, count in sorted(result.unsupported_extensions.items()):
                print(f"   {ext}: {count:,} files")

        if result.skipped_files:
            print(f"\n⏭️  Skip reasons breakdown:")
            skip_reasons = {}
            for skip_info in result.skipped_files:
                reason = skip_info.reason
                skip_reasons[reason] = skip_reasons.get(reason, 0) + 1

            for reason, count in sorted(skip_reasons.items()):
                print(f"   {reason}: {count:,} files")

        # Show some examples
        if result.duplicate_files:
            print(f"\n🔄 Example duplicate files:")
            for i, dup in enumerate(result.duplicate_files[:5]):
                print(f"   {i+1}. Original: {Path(dup.original_path).name}")
                print(f"      Duplicate: {dup.duplicate_path}")
                if dup.original_bitrate and dup.duplicate_bitrate:
                    print(f"      Bitrates: {dup.original_bitrate} vs {dup.duplicate_bitrate}")
                print()

        if result.metadata_errors:
            print(f"\n❌ Example metadata errors:")
            for i, error in enumerate(result.metadata_errors[:3]):
                print(f"   {i+1}. File: {Path(error.file_path).name}")
                print(f"      Error: {error.error_message}")
                print()

        elapsed_time = datetime.now() - start_time
        print(f"\n⏱️  Analysis completed in {elapsed_time.total_seconds():.2f} seconds")
        print(f"📁 Reports saved to: {output_dir.resolve()}")

        session.close()

    except KeyboardInterrupt:
        logger.info("⏹️  Analysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()