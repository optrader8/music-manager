from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from .track import TrackWithRelations


class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    is_smart: bool = False
    smart_filter: dict[str, Any] | None = None


class PlaylistCreate(PlaylistBase):
    pass


class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    is_smart: Optional[bool] = None
    smart_filter: dict[str, Any] | None = None


class PlaylistRead(PlaylistBase):
    id: int
    owner_id: int
    track_count: int = 0
    created_at: datetime
    updated_at: datetime


class PlaylistTrackRead(BaseModel):
    track_id: int
    position: int
    track: TrackWithRelations


class PlaylistDetail(PlaylistRead):
    tracks: list[PlaylistTrackRead] = Field(default_factory=list)


class PlaylistTrackRequest(BaseModel):
    track_id: int
    position: int | None = Field(default=None, ge=1)


class PlaylistTrackReorderRequest(BaseModel):
    position: int = Field(ge=1)


__all__ = [
    "PlaylistBase",
    "PlaylistCreate",
    "PlaylistDetail",
    "PlaylistRead",
    "PlaylistTrackRead",
    "PlaylistTrackReorderRequest",
    "PlaylistTrackRequest",
    "PlaylistUpdate",
]
