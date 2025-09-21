from pathlib import Path
from typing import BinaryIO, Generator, Optional, Tuple

import aiofiles
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import Track


class StreamingService:
    def __init__(self, session: Session):
        self.session = session

    async def get_track_file(self, track_id: int) -> Path:
        """Get the file path for a track."""
        track = self.session.query(Track).filter(Track.id == track_id).first()
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")

        file_path = Path(track.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Audio file not found")

        return file_path

    async def stream_file(
        self, file_path: Path, range_header: Optional[str] = None
    ) -> Tuple[BinaryIO, int, int, str]:
        """Stream an audio file with optional range support."""
        file_size = file_path.stat().st_size
        content_type = self._get_content_type(file_path)

        if range_header:
            start, end = self._parse_range_header(range_header, file_size)
        else:
            start, end = 0, file_size - 1

        content_length = end - start + 1

        file_obj = await aiofiles.open(file_path, "rb")
        await file_obj.seek(start)

        return file_obj, start, end, content_type

    def _get_content_type(self, file_path: Path) -> str:
        """Get the MIME type for an audio file."""
        suffix = file_path.suffix.lower()
        content_types = {
            ".mp3": "audio/mpeg",
            ".flac": "audio/flac",
            ".aac": "audio/aac",
            ".ogg": "audio/ogg",
            ".m4a": "audio/mp4",
        }
        return content_types.get(suffix, "audio/mpeg")

    def _parse_range_header(self, range_header: str, file_size: int) -> Tuple[int, int]:
        """Parse HTTP Range header."""
        try:
            range_match = range_header.replace("bytes=", "").split("-")
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if range_match[1] else file_size - 1

            # Ensure values are within bounds
            start = max(0, min(start, file_size - 1))
            end = max(start, min(end, file_size - 1))

            return start, end
        except (ValueError, IndexError):
            return 0, file_size - 1


__all__ = ["StreamingService"]