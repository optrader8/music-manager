from __future__ import annotations

from pydantic import BaseModel

from .track import TrackSearchResult, TrackWithRelations


class PaginatedResponse(BaseModel):
    page: int
    page_size: int
    total: int
    has_more: bool


class LibrarySearchResponse(PaginatedResponse):
    items: list[TrackSearchResult]


class LibraryBrowseResponse(PaginatedResponse):
    items: list[TrackWithRelations]


__all__ = ["LibrarySearchResponse", "LibraryBrowseResponse", "PaginatedResponse"]
