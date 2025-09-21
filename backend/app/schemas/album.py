from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AlbumBase(BaseModel):
    title: str
    release_year: Optional[int] = None
    genre: Optional[str] = None


class AlbumCreate(AlbumBase):
    artist_id: int


class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    release_year: Optional[int] = None
    genre: Optional[str] = None
    artist_id: Optional[int] = None


class AlbumRead(AlbumBase):
    id: int
    artist_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AlbumWithArtist(AlbumRead):
    artist: Optional["ArtistRead"] = None

    class Config:
        from_attributes = True


# Forward reference imports
from .artist import ArtistRead  # noqa: E402

AlbumWithArtist.model_rebuild()


__all__ = ["AlbumBase", "AlbumCreate", "AlbumUpdate", "AlbumRead", "AlbumWithArtist"]