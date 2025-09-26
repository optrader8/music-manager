from __future__ import annotations

from app.schemas.pagination import PaginatedResponse

from .track import TrackSearchResult, TrackWithRelations


class LibrarySearchResponse(PaginatedResponse[TrackSearchResult]):
    """Paginated response for search results."""


class LibraryBrowseResponse(PaginatedResponse[TrackWithRelations]):
    """Paginated response for track browsing."""


__all__ = ["LibrarySearchResponse", "LibraryBrowseResponse"]
