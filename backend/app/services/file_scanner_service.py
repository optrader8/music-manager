from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import mutagen
from sqlalchemy.orm import Session

from app.db.models import Album, Artist, Track

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

    def scan(self) -> ScanResult:
        scanned_files = created_tracks = updated_tracks = skipped_files = 0
        duplicates: list[DuplicateTrack] = []

        for file_path in self.iter_audio_files(self.library_path):
            scanned_files += 1
            metadata = self.extract_metadata(file_path)
            file_hash = self.calculate_file_hash(file_path)

            existing = self.session.query(Track).filter(Track.file_hash == file_hash).one_or_none()
            if existing and Path(existing.file_path) != file_path:
                duplicates.append(
                    DuplicateTrack(
                        track_id=existing.id,
                        existing_path=Path(existing.file_path),
                        duplicate_path=file_path,
                    )
                )
                skipped_files += 1
                continue

            track = existing or self.session.query(Track).filter(Track.file_path == str(file_path)).one_or_none()

            artist = self._get_or_create_artist(metadata.artist_name) if metadata.artist_name else None
            album = (
                self._get_or_create_album(artist, metadata.album_title, metadata.release_year, metadata.genre)
                if artist and metadata.album_title
                else None
            )

            if track is None:
                track = Track(
                    title=metadata.title,
                    file_path=str(file_path),
                    file_hash=file_hash,
                )
                self.session.add(track)
                created_tracks += 1
            else:
                updated_tracks += 1

            track.title = metadata.title
            track.artist = artist
            track.album = album
            track.genre = metadata.genre
            track.track_number = metadata.track_number
            track.disc_number = metadata.disc_number
            track.duration_seconds = metadata.duration_seconds
            track.bit_rate = metadata.bit_rate
            track.sample_rate = metadata.sample_rate
            track.file_path = str(file_path)
            track.file_hash = file_hash

        self.session.commit()

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

    def _get_or_create_artist(self, name: str) -> Artist:
        artist = self.session.query(Artist).filter(Artist.name == name).one_or_none()
        if not artist:
            artist = Artist(name=name)
            self.session.add(artist)
            self.session.flush()
        return artist

    def _get_or_create_album(
        self,
        artist: Artist,
        title: str,
        release_year: int | None,
        genre: str | None,
    ) -> Album:
        album = (
            self.session.query(Album)
            .filter(Album.artist_id == artist.id, Album.title == title)
            .one_or_none()
        )
        if not album:
            album = Album(artist=artist, title=title, release_year=release_year, genre=genre)
            self.session.add(album)
            self.session.flush()
        else:
            if release_year and not album.release_year:
                album.release_year = release_year
            if genre and not album.genre:
                album.genre = genre
        return album


__all__ = [
    "DuplicateTrack",
    "FileScannerService",
    "ScanResult",
    "TrackMetadata",
]
