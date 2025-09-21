from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ArtistBase(BaseModel):
    name: str
    sort_name: Optional[str] = None


class ArtistCreate(ArtistBase):
    pass


class ArtistUpdate(BaseModel):
    name: Optional[str] = None
    sort_name: Optional[str] = None


class ArtistRead(ArtistBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


__all__ = ["ArtistBase", "ArtistCreate", "ArtistUpdate", "ArtistRead"]