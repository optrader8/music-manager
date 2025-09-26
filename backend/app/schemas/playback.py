from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PlaybackTrack(BaseModel):
    track_id: int
    title: str
    stream_url: str
    duration_seconds: Optional[float] = None
    disc_number: Optional[int] = None
    track_number: Optional[int] = None
    artist_name: Optional[str] = None


class PlaybackQueue(BaseModel):
    album_id: Optional[int] = None
    album_title: Optional[str] = None
    quality: str
    crossfade_seconds: int
    gapless: bool
    total_duration_seconds: float
    tracks: list[PlaybackTrack]
    generated_at: datetime


__all__ = ["PlaybackQueue", "PlaybackTrack"]
