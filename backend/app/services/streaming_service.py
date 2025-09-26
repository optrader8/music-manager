from __future__ import annotations

import asyncio
import io
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from email.utils import format_datetime
from enum import Enum
from pathlib import Path

import aiofiles
from fastapi import HTTPException, Response, status
from PIL import Image

if hasattr(Image, "Resampling"):
    _RESAMPLE = Image.Resampling.LANCZOS
else:  # pragma: no cover - Pillow < 9 fallback
    _RESAMPLE = Image.LANCZOS

from sqlalchemy.orm import Session

from app.db.models import Album, Track

SUPPORTED_CONTENT_TYPES = {
    ".mp3": "audio/mpeg",
    ".flac": "audio/flac",
    ".aac": "audio/aac",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
}

TRANSCODE_CONTENT_TYPES = {
    "mp3": "audio/mpeg",
    "aac": "audio/aac",
    "ogg": "audio/ogg",
    "flac": "audio/flac",
    "wav": "audio/wav",
}

IMAGE_CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}

SUPPORTED_TRANSCODE_FORMATS = set(TRANSCODE_CONTENT_TYPES.keys())


class CoverSize(str, Enum):
    THUMBNAIL = "thumbnail"
    MEDIUM = "medium"
    LARGE = "large"
    ORIGINAL = "original"


_COVER_DIMENSIONS = {
    CoverSize.THUMBNAIL: 128,
    CoverSize.MEDIUM: 256,
    CoverSize.LARGE: 512,
}

_COVER_CANDIDATE_NAMES = (
    "cover.jpg",
    "cover.jpeg",
    "cover.png",
    "folder.jpg",
    "folder.png",
    "front.jpg",
    "front.png",
    "album.jpg",
    "album.png",
)


class StreamingService:
    def __init__(self, session: Session, chunk_size: int = 64 * 1024) -> None:
        self.session = session
        self.chunk_size = chunk_size

    def get_track(self, track_id: int) -> Track:
        track = self.session.get(Track, track_id)
        if not track:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Track not found")
        return track

    def get_track_with_file(self, track_id: int) -> tuple[Track, Path]:
        track = self.get_track(track_id)
        file_path = Path(track.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found")
        return track, file_path

    async def get_album_cover(
        self, album_id: int, size: CoverSize = CoverSize.MEDIUM
    ) -> Response:
        album = self.session.get(Album, album_id)
        if not album:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")

        track = (
            self.session.query(Track)
            .filter(Track.album_id == album_id)
            .order_by(
                Track.disc_number.nullsfirst(),
                Track.track_number.nullsfirst(),
                Track.id.asc(),
            )
            .first()
        )
        if not track:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cover art not found")

        audio_path = Path(track.file_path)
        cover_path = self._locate_cover_art(audio_path.parent)
        if not cover_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cover art not found")

        image_bytes, media_type, mtime = self._prepare_cover_bytes(cover_path, size)
        response = Response(content=image_bytes, media_type=media_type)
        response.headers["Cache-Control"] = "public, max-age=86400"
        response.headers["Last-Modified"] = format_datetime(
            datetime.fromtimestamp(mtime, tz=timezone.utc)
        )
        return response

    async def stream_file(
        self,
        file_path: Path,
        range_header: str | None = None,
    ) -> tuple[AsyncGenerator[bytes, None], int, int, int, str, bool]:
        file_size = file_path.stat().st_size
        content_type = self._get_content_type(file_path)

        if file_size < 0:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid file size")

        if range_header:
            start, end = self._parse_range_header(range_header, file_size)
            partial = True
        else:
            start = 0
            end = file_size - 1 if file_size else -1
            partial = False

        iterator = self._iterate_file(file_path, start, end)
        return iterator, start, end, file_size, content_type, partial

    async def transcode_track(
        self,
        track_id: int,
        *,
        target_format: str = "mp3",
        bitrate: str = "192k",
    ) -> tuple[AsyncGenerator[bytes, None], str, Track]:
        track, file_path = self.get_track_with_file(track_id)
        target_format = target_format.lower()
        if target_format not in SUPPORTED_TRANSCODE_FORMATS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format '{target_format}'",
            )

        if not self._is_valid_bitrate(bitrate):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bitrate value")

        iterator = self._transcode_file(file_path, target_format, bitrate)
        media_type = TRANSCODE_CONTENT_TYPES[target_format]
        return iterator, media_type, track

    def record_play(self, track: Track) -> None:
        """Increment play count metadata for a track."""
        track.play_count = (track.play_count or 0) + 1
        track.last_played_at = datetime.now(timezone.utc)
        self.session.add(track)
        self.session.commit()

    def _locate_cover_art(self, directory: Path) -> Path | None:
        if not directory.exists():
            return None

        for name in _COVER_CANDIDATE_NAMES:
            candidate = directory / name
            if candidate.exists() and candidate.is_file():
                return candidate

        for entry in directory.iterdir():
            if entry.is_file() and entry.suffix.lower() in IMAGE_CONTENT_TYPES:
                return entry
        return None

    def _prepare_cover_bytes(self, cover_path: Path, size: CoverSize) -> tuple[bytes, str, float]:
        media_type = IMAGE_CONTENT_TYPES.get(cover_path.suffix.lower(), "image/jpeg")
        mtime = cover_path.stat().st_mtime

        if size == CoverSize.ORIGINAL or size not in _COVER_DIMENSIONS:
            return cover_path.read_bytes(), media_type, mtime

        target = _COVER_DIMENSIONS[size]
        with Image.open(cover_path) as image:
            if media_type == "image/jpeg" and image.mode not in {"RGB", "L"}:
                image = image.convert("RGB")
            elif media_type in {"image/png", "image/webp"} and image.mode not in {"RGB", "RGBA", "L"}:
                image = image.convert("RGBA")

            image.thumbnail((target, target), _RESAMPLE)
            buffer = io.BytesIO()
            if media_type == "image/jpeg":
                format_name = "JPEG"
            elif media_type == "image/png":
                format_name = "PNG"
            elif media_type == "image/webp":
                format_name = "WEBP"
            else:
                format_name = "PNG"
                media_type = "image/png"
            image.save(buffer, format=format_name)
            return buffer.getvalue(), media_type, mtime

    def _get_content_type(self, file_path: Path) -> str:
        return SUPPORTED_CONTENT_TYPES.get(file_path.suffix.lower(), "audio/mpeg")

    def _parse_range_header(self, range_header: str, file_size: int) -> tuple[int, int]:
        try:
            units, _, range_part = range_header.partition("=")
            if units.strip().lower() != "bytes":
                raise ValueError
            start_str, _, end_str = range_part.partition("-")
            start = int(start_str) if start_str else 0
            end = int(end_str) if end_str else file_size - 1
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
                detail="Invalid Range header",
            ) from None

        if file_size == 0:
            return 0, -1

        start = max(0, min(start, file_size - 1))
        end = max(start, min(end, file_size - 1))
        return start, end

    def _is_valid_bitrate(self, value: str) -> bool:
        if not value.endswith("k"):
            return False
        try:
            int(value[:-1])
            return True
        except ValueError:
            return False

    async def _iterate_file(self, file_path: Path, start: int, end: int) -> AsyncGenerator[bytes, None]:
        if end >= 0 and end < start:
            raise HTTPException(status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE)

        async with aiofiles.open(file_path, "rb") as file_obj:
            if start:
                await file_obj.seek(start)

            remaining = end - start + 1 if end >= start >= 0 else None

            while True:
                read_size = self.chunk_size if remaining is None else min(self.chunk_size, remaining)
                if remaining is not None and remaining <= 0:
                    break

                chunk = await file_obj.read(read_size)
                if not chunk:
                    break
                if remaining is not None:
                    remaining -= len(chunk)
                yield chunk

    def _transcode_file(
        self,
        file_path: Path,
        target_format: str,
        bitrate: str,
    ) -> AsyncGenerator[bytes, None]:
        async def generator() -> AsyncGenerator[bytes, None]:
            try:
                process = await asyncio.create_subprocess_exec(
                    "ffmpeg",
                    "-i",
                    str(file_path),
                    "-f",
                    target_format,
                    "-b:a",
                    bitrate,
                    "-vn",
                    "-loglevel",
                    "error",
                    "pipe:1",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
            except FileNotFoundError as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="FFmpeg is not available",
                ) from exc

            try:
                if process.stdout is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="FFmpeg stdout unavailable",
                    )

                while True:
                    chunk = await process.stdout.read(self.chunk_size)
                    if not chunk:
                        break
                    yield chunk

                await process.wait()
                if process.returncode != 0:
                    error_message = ""
                    if process.stderr is not None:
                        error_bytes = await process.stderr.read()
                        error_message = error_bytes.decode("utf-8", errors="ignore").strip()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"FFmpeg transcoding failed: {error_message or 'unknown error'}",
                    )
            finally:
                if process.returncode is None:
                    process.kill()
                    await process.wait()

        return generator()


__all__ = ["StreamingService", "SUPPORTED_TRANSCODE_FORMATS", "CoverSize"]
