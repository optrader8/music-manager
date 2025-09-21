from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import mutagen
from sqlalchemy.orm import Session

from app.db.models import Album, Artist, Track
from app.utils import AlbumRepository, ArtistRepository

SUPPORTED_EXTENSIONS = {".mp3", ".flac", ".aac", ".ogg", ".m4a"}


@dataclass
class DuplicateTrack:
    track_id: int
    existing_path: Path
    duplicate_path: Path


@dataclass
class ScanResult:
    scanned_files: int
    created_tracks: int
    updated_tracks: int
    skipped_files: int
    duplicates: list[DuplicateTrack]


@dataclass
class TrackMetadata:
    title: str
    artist_name: str | None
    album_title: str | None
    genre: str | None
    release_year: int | None
    track_number: int | None
    disc_number: int | None
    duration_seconds: float | None
    bit_rate: int | None
    sample_rate: int | None


class FileScannerService:
    def __init__(self, session: Session, library_path: Path):
        self.session = session
        self.library_path = Path(library_path)
        self.artist_repo = ArtistRepository(session)
        self.album_repo = AlbumRepository(session)

    def scan(self, limit_files: int = None) -> ScanResult:
        scanned_files = created_tracks = updated_tracks = skipped_files = 0
        duplicates: list[DuplicateTrack] = []
        batch_size = 100  # Commit every 100 files
        batch_count = 0

        print("🎵 Processing files...")
        for file_path in self.iter_audio_files(self.library_path):
            scanned_files += 1

            # Limit files for testing
            if limit_files and scanned_files > limit_files:
                print(f"🛑 Stopping at {limit_files} files for testing")
                break

            # Progress output every 50 files
            if scanned_files % 50 == 0:
                print(f"📂 Processed {scanned_files:,} files... (Created: {created_tracks}, Updated: {updated_tracks}, Skipped: {skipped_files})")

            try:
                # Check if file already exists in database (by path first for speed)
                existing_track = self.session.query(Track).filter(Track.file_path == str(file_path)).first()
                if existing_track:
                    print(f"⏭️  Already processed: {file_path.name}")
                    skipped_files += 1
                    continue

                metadata = self.extract_metadata(file_path)
                file_hash = self.calculate_file_hash(file_path)

                # Check for duplicates by hash - ensure session is clean first
                try:
                    duplicate_track = self.session.query(Track).filter(Track.file_hash == file_hash).first()
                    if duplicate_track:
                        duplicates.append(
                            DuplicateTrack(
                                track_id=duplicate_track.id,
                                existing_path=Path(duplicate_track.file_path),
                                duplicate_path=file_path,
                            )
                        )
                        print(f"🔄 Duplicate found: {file_path.name}")
                        skipped_files += 1
                        continue
                except Exception as e:
                    print(f"❌ Error checking for duplicates: {e}")
                    self.session.rollback()
                    skipped_files += 1
                    continue

                # Get or create artist and album
                artist = self.artist_repo.get_or_create(metadata.artist_name) if metadata.artist_name else None
                album = (
                    self.album_repo.get_or_create(artist, metadata.album_title, metadata.release_year, metadata.genre)
                    if artist and metadata.album_title
                    else None
                )

                # Create new track
                track = Track(
                    title=metadata.title,
                    file_path=str(file_path),
                    file_hash=file_hash,
                    artist=artist,
                    album=album,
                    genre=metadata.genre,
                    track_number=metadata.track_number,
                    disc_number=metadata.disc_number,
                    duration_seconds=metadata.duration_seconds,
                    bit_rate=metadata.bit_rate,
                    sample_rate=metadata.sample_rate,
                )

                self.session.add(track)
                created_tracks += 1
                batch_count += 1

                print(f"➕ Added: {metadata.title} by {metadata.artist_name or 'Unknown'}")

                # Commit every batch_size files
                if batch_count >= batch_size:
                    try:
                        self.session.commit()
                        print(f"💾 Saved batch of {batch_count} files to database")
                        batch_count = 0
                    except Exception as e:
                        print(f"❌ Error committing batch: {e}")
                        self.session.rollback()
                        # Reset batch count but continue
                        batch_count = 0

            except Exception as e:
                print(f"❌ Error processing {file_path}: {e}")
                # Check if it's a duplicate file_hash error
                if "UNIQUE constraint failed: tracks.file_hash" in str(e):
                    print(f"🔄 Duplicate file detected during processing: {file_path.name}")
                    # Add to duplicates list if we can find the hash
                    try:
                        file_hash = self.calculate_file_hash(file_path)
                        existing_track = self.session.query(Track).filter(Track.file_hash == file_hash).first()
                        if existing_track:
                            duplicates.append(
                                DuplicateTrack(
                                    track_id=existing_track.id,
                                    existing_path=Path(existing_track.file_path),
                                    duplicate_path=file_path,
                                )
                            )
                    except Exception:
                        pass  # Just skip if we can't process the duplicate

                self.session.rollback()  # Ensure session is clean
                skipped_files += 1
                continue

        # Final commit for remaining files in batch
        if batch_count > 0:
            try:
                self.session.commit()
                print(f"💾 Final save: {batch_count} files to database")
            except Exception as e:
                print(f"❌ Error in final commit: {e}")
                self.session.rollback()

        return ScanResult(
            scanned_files=scanned_files,
            created_tracks=created_tracks,
            updated_tracks=updated_tracks,
            skipped_files=skipped_files,
            duplicates=duplicates,
        )

    def iter_audio_files(self, root: Path) -> Iterable[Path]:
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
                yield path

    def extract_metadata(self, file_path: Path) -> TrackMetadata:
        try:
            audio = mutagen.File(file_path, easy=True)
        except Exception:  # pragma: no cover - mutagen specific failures
            audio = None

        title = self._choose_value(audio, "title") or file_path.stem
        artist = self._choose_value(audio, "artist")
        album = self._choose_value(audio, "album")
        genre = self._choose_value(audio, "genre")
        year = self._parse_int(self._choose_value(audio, "date"))
        track_number = self._parse_int(self._choose_value(audio, "tracknumber"))
        disc_number = self._parse_int(self._choose_value(audio, "discnumber"))

        duration = getattr(getattr(audio, "info", None), "length", None)
        bit_rate = getattr(getattr(audio, "info", None), "bitrate", None)
        sample_rate = getattr(getattr(audio, "info", None), "sample_rate", None)

        if isinstance(bit_rate, float):
            bit_rate = int(bit_rate)

        metadata = TrackMetadata(
            title=title,
            artist_name=artist,
            album_title=album,
            genre=genre,
            release_year=year,
            track_number=track_number,
            disc_number=disc_number,
            duration_seconds=float(duration) if duration is not None else None,
            bit_rate=bit_rate,
            sample_rate=sample_rate,
        )

        return metadata

    def calculate_file_hash(self, file_path: Path) -> str:
        import hashlib

        hasher = hashlib.sha256()
        with file_path.open("rb") as file_obj:
            for chunk in iter(lambda: file_obj.read(8192), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    def _choose_value(self, audio: mutagen.FileType | None, key: str) -> str | None:
        if audio is None:
            return None
        value = None
        if hasattr(audio, "tags") and audio.tags:
            value = audio.tags.get(key)
        if not value:
            return None
        if isinstance(value, list):
            value = value[0]
        if isinstance(value, bytes):
            value = value.decode("utf-8", errors="ignore")
        if isinstance(value, str):
            return value.strip() or None
        return None

    def _parse_int(self, value: str | None) -> int | None:
        if not value:
            return None
        parts = str(value).split("/")
        try:
            return int(parts[0])
        except ValueError:
            return None



__all__ = [
    "DuplicateTrack",
    "FileScannerService",
    "ScanResult",
    "TrackMetadata",
]
