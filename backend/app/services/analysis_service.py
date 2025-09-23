from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import mutagen
from sqlalchemy.orm import Session

from app.db.models import DuplicateFile, ScanLog, Track


@dataclass
class SkippedFileInfo:
    file_path: str
    reason: str
    error_message: str | None = None
    file_size: int | None = None
    file_hash: str | None = None


@dataclass
class DuplicateFileInfo:
    original_path: str
    duplicate_path: str
    file_hash: str
    original_size: int | None = None
    duplicate_size: int | None = None
    original_bitrate: int | None = None
    duplicate_bitrate: int | None = None


@dataclass
class AnalysisResult:
    total_files_found: int
    processed_files: int
    skipped_files: List[SkippedFileInfo]
    duplicate_files: List[DuplicateFileInfo]
    unsupported_extensions: Dict[str, int]
    metadata_errors: List[SkippedFileInfo]


class AnalysisService:
    SUPPORTED_EXTENSIONS = {".mp3", ".flac", ".aac", ".ogg", ".m4a"}

    def __init__(self, session: Session, library_path: Path):
        self.session = session
        self.library_path = Path(library_path)

    def analyze_library(self) -> AnalysisResult:
        """Analyze the music library for skipped and duplicate files"""
        print("🔍 Starting library analysis...")

        skipped_files = []
        duplicate_files = []
        unsupported_extensions = {}
        metadata_errors = []
        total_files_found = 0
        processed_files = 0

        # Get all processed files from database
        processed_paths = set()
        processed_hashes = {}  # hash -> track info

        for track in self.session.query(Track).all():
            processed_paths.add(track.file_path)
            if track.file_hash:
                processed_hashes[track.file_hash] = {
                    'path': track.file_path,
                    'id': track.id,
                    'bitrate': track.bit_rate
                }

        processed_files = len(processed_paths)
        print(f"📊 Found {processed_files} processed files in database")

        # Scan all files in library
        print("🔍 Scanning library directory...")
        for file_path in self._iter_all_files(self.library_path):
            total_files_found += 1

            if total_files_found % 1000 == 0:
                print(f"📂 Scanned {total_files_found:,} files...")

            file_path_str = str(file_path)
            file_extension = file_path.suffix.lower()

            # Check if file is in supported formats
            if file_extension not in self.SUPPORTED_EXTENSIONS:
                if file_extension not in unsupported_extensions:
                    unsupported_extensions[file_extension] = 0
                unsupported_extensions[file_extension] += 1
                continue

            # Check if file was processed
            if file_path_str in processed_paths:
                continue  # This file was successfully processed

            # File was not processed - analyze why
            try:
                file_size = file_path.stat().st_size
                file_hash = self._calculate_file_hash(file_path)

                # Check if it's a duplicate by hash
                if file_hash in processed_hashes:
                    original_info = processed_hashes[file_hash]

                    # Get bitrate info for comparison
                    duplicate_bitrate = self._get_file_bitrate(file_path)

                    duplicate_info = DuplicateFileInfo(
                        original_path=original_info['path'],
                        duplicate_path=file_path_str,
                        file_hash=file_hash,
                        original_size=None,  # We'd need to check file system
                        duplicate_size=file_size,
                        original_bitrate=original_info.get('bitrate'),
                        duplicate_bitrate=duplicate_bitrate
                    )
                    duplicate_files.append(duplicate_info)

                    # Save to database
                    self._save_duplicate_to_db(duplicate_info)
                    continue

                # Check if metadata can be extracted
                try:
                    audio = mutagen.File(file_path, easy=True)
                    if audio is None:
                        raise Exception("Could not read audio metadata")

                    # If we get here, it's unclear why it was skipped
                    skipped_info = SkippedFileInfo(
                        file_path=file_path_str,
                        reason="unknown_skip",
                        error_message="File not in database but metadata readable",
                        file_size=file_size,
                        file_hash=file_hash
                    )
                    skipped_files.append(skipped_info)

                except Exception as meta_error:
                    # Metadata extraction failed
                    skipped_info = SkippedFileInfo(
                        file_path=file_path_str,
                        reason="metadata_error",
                        error_message=str(meta_error),
                        file_size=file_size,
                        file_hash=file_hash
                    )
                    metadata_errors.append(skipped_info)
                    skipped_files.append(skipped_info)

                # Save skipped file to database
                self._save_skip_to_db(skipped_files[-1])

            except Exception as e:
                # File system error (permissions, corrupted file, etc.)
                skipped_info = SkippedFileInfo(
                    file_path=file_path_str,
                    reason="file_system_error",
                    error_message=str(e),
                    file_size=None,
                    file_hash=None
                )
                skipped_files.append(skipped_info)
                self._save_skip_to_db(skipped_info)

        # Commit all database changes
        self.session.commit()

        result = AnalysisResult(
            total_files_found=total_files_found,
            processed_files=processed_files,
            skipped_files=skipped_files,
            duplicate_files=duplicate_files,
            unsupported_extensions=unsupported_extensions,
            metadata_errors=metadata_errors
        )

        print(f"✅ Analysis complete!")
        print(f"📊 Total files found: {total_files_found:,}")
        print(f"✅ Processed files: {processed_files:,}")
        print(f"⏭️  Skipped files: {len(skipped_files):,}")
        print(f"🔄 Duplicate files: {len(duplicate_files):,}")
        print(f"❌ Metadata errors: {len(metadata_errors):,}")

        return result

    def _iter_all_files(self, root: Path):
        """Iterate through all files in directory"""
        try:
            for path in root.rglob("*"):
                if path.is_file():
                    yield path
        except (PermissionError, OSError) as e:
            print(f"⚠️  Warning: Could not access {root}: {e}")

    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of file"""
        hasher = hashlib.sha256()
        try:
            with file_path.open("rb") as file_obj:
                for chunk in iter(lambda: file_obj.read(8192), b""):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception:
            return ""

    def _get_file_bitrate(self, file_path: Path) -> Optional[int]:
        """Get bitrate from audio file"""
        try:
            audio = mutagen.File(file_path)
            if audio and hasattr(audio, 'info'):
                bitrate = getattr(audio.info, 'bitrate', None)
                return int(bitrate) if bitrate else None
        except Exception:
            return None

    def _save_skip_to_db(self, skip_info: SkippedFileInfo):
        """Save skipped file info to database"""
        scan_log = ScanLog(
            file_path=skip_info.file_path,
            status="skipped",
            reason=skip_info.reason,
            error_message=skip_info.error_message,
            file_size=skip_info.file_size,
            file_hash=skip_info.file_hash
        )
        self.session.add(scan_log)

    def _save_duplicate_to_db(self, duplicate_info: DuplicateFileInfo):
        """Save duplicate file info to database"""
        duplicate_file = DuplicateFile(
            original_path=duplicate_info.original_path,
            duplicate_path=duplicate_info.duplicate_path,
            file_hash=duplicate_info.file_hash,
            original_size=duplicate_info.original_size,
            duplicate_size=duplicate_info.duplicate_size,
            original_bitrate=duplicate_info.original_bitrate,
            duplicate_bitrate=duplicate_info.duplicate_bitrate
        )
        self.session.add(duplicate_file)

    def export_analysis_report(self, result: AnalysisResult, output_dir: Path):
        """Export analysis results to files"""
        output_dir = Path(output_dir)
        output_dir.mkdir(exist_ok=True)

        # Export skipped files
        skipped_file = output_dir / "skipped_files.json"
        with skipped_file.open("w") as f:
            json.dump([{
                "file_path": item.file_path,
                "reason": item.reason,
                "error_message": item.error_message,
                "file_size": item.file_size,
                "file_hash": item.file_hash
            } for item in result.skipped_files], f, indent=2)

        # Export duplicate files
        duplicates_file = output_dir / "duplicate_files.json"
        with duplicates_file.open("w") as f:
            json.dump([{
                "original_path": item.original_path,
                "duplicate_path": item.duplicate_path,
                "file_hash": item.file_hash,
                "original_size": item.original_size,
                "duplicate_size": item.duplicate_size,
                "original_bitrate": item.original_bitrate,
                "duplicate_bitrate": item.duplicate_bitrate
            } for item in result.duplicate_files], f, indent=2)

        # Export summary report
        summary_file = output_dir / "analysis_summary.json"
        with summary_file.open("w") as f:
            json.dump({
                "total_files_found": result.total_files_found,
                "processed_files": result.processed_files,
                "skipped_files_count": len(result.skipped_files),
                "duplicate_files_count": len(result.duplicate_files),
                "metadata_errors_count": len(result.metadata_errors),
                "unsupported_extensions": result.unsupported_extensions,
                "skip_reasons": self._categorize_skip_reasons(result.skipped_files)
            }, f, indent=2)

        print(f"📁 Reports exported to: {output_dir}")
        print(f"   - {skipped_file}")
        print(f"   - {duplicates_file}")
        print(f"   - {summary_file}")

    def _categorize_skip_reasons(self, skipped_files: List[SkippedFileInfo]) -> Dict[str, int]:
        """Categorize skip reasons for summary"""
        reasons = {}
        for skip_info in skipped_files:
            reason = skip_info.reason
            if reason not in reasons:
                reasons[reason] = 0
            reasons[reason] += 1
        return reasons


__all__ = ["AnalysisService", "AnalysisResult", "SkippedFileInfo", "DuplicateFileInfo"]