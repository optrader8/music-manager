"""Navidrome Album Service - Integrates Navidrome as a data source for albums"""
from typing import List, Tuple, Optional
from datetime import datetime

from app.core.pagination import PaginationParams
from app.schemas import (
    AlbumFilters,
    AlbumSortOptions,
    AlbumSummary,
)
from app.schemas.artist import ArtistRead
from app.services.navidrome_client import NavidromeClient, NavidromeAlbum
from app.core.config import settings


class NavidromeAlbumService:
    """Service to fetch album data from Navidrome and transform it to match Music Manager schema"""

    # Map our sort options to Navidrome album list types
    _SORT_TO_NAVIDROME_TYPE = {
        AlbumSortOptions.TITLE_ASC: "alphabeticalByName",
        AlbumSortOptions.TITLE_DESC: "alphabeticalByName",  # We'll reverse after
        AlbumSortOptions.RECENTLY_ADDED: "newest",
        AlbumSortOptions.YEAR_ASC: "byYear",
        AlbumSortOptions.YEAR_DESC: "byYear",  # We'll reverse after
        # Note: Navidrome doesn't have artist sorting in getAlbumList2
        AlbumSortOptions.ARTIST_ASC: "alphabeticalByArtist",
        AlbumSortOptions.ARTIST_DESC: "alphabeticalByArtist",
    }

    def __init__(self, client: NavidromeClient):
        self.client = client

    def get_albums(
        self,
        *,
        pagination: PaginationParams,
        filters: AlbumFilters | None = None,
        sort: AlbumSortOptions = AlbumSortOptions.RECENTLY_ADDED,
    ) -> Tuple[List[AlbumSummary], int]:
        """
        Get albums from Navidrome with pagination and filters

        Note: Navidrome's filtering capabilities are limited compared to local DB.
        We fetch more data and filter client-side when needed.
        """
        filters = filters or AlbumFilters()

        # Determine Navidrome list type based on sort
        list_type = self._SORT_TO_NAVIDROME_TYPE.get(
            sort,
            self._SORT_TO_NAVIDROME_TYPE[AlbumSortOptions.RECENTLY_ADDED]
        )

        # Fetch albums from Navidrome
        # Note: Navidrome's search is limited, so we may need to fetch more and filter client-side
        try:
            navidrome_albums = self.client.get_albums(
                type=list_type,
                size=500,  # Get a large batch for client-side filtering
                offset=0,
                from_year=filters.year_from,
                to_year=filters.year_to,
                genre=filters.genre if filters.genre else None,
            )
        except Exception as e:
            print(f"Error fetching albums from Navidrome: {e}")
            return [], 0

        # Client-side filtering for search (Navidrome doesn't support multi-field search in getAlbumList2)
        if filters.search:
            search_term = filters.search.strip().lower()
            navidrome_albums = [
                album for album in navidrome_albums
                if (
                    search_term in (album.name or "").lower()
                    or search_term in (album.artist or "").lower()
                    or search_term in (album.genre or "").lower()
                )
            ]

        # Handle reverse sorting
        if sort in [AlbumSortOptions.TITLE_DESC, AlbumSortOptions.YEAR_DESC, AlbumSortOptions.ARTIST_DESC]:
            navidrome_albums = list(reversed(navidrome_albums))

        # Calculate total count
        total = len(navidrome_albums)

        # Apply pagination
        start_idx = pagination.offset
        end_idx = start_idx + pagination.page_size
        paginated_albums = navidrome_albums[start_idx:end_idx]

        # Transform to AlbumSummary format
        summaries = [self._navidrome_to_summary(album) for album in paginated_albums]

        return summaries, total

    def _navidrome_to_summary(self, navidrome_album: NavidromeAlbum) -> AlbumSummary:
        """Transform Navidrome album to AlbumSummary schema"""
        # Create a cover art URL using Navidrome's getCoverArt endpoint
        cover_art_url = None
        if navidrome_album.cover_art:
            cover_art_url = self.client.get_cover_art_url(navidrome_album.cover_art, size=300)

        # Convert Navidrome's string ID to int (or hash if not numeric)
        album_id = int(navidrome_album.id) if navidrome_album.id.isdigit() else hash(navidrome_album.id) % 2147483647
        artist_id = int(navidrome_album.artist_id) if navidrome_album.artist_id and navidrome_album.artist_id.isdigit() else hash(navidrome_album.artist_id or navidrome_album.artist) % 2147483647

        # Create ArtistRead object for the album
        artist = ArtistRead(
            id=artist_id,
            name=navidrome_album.artist,
            sort_name=navidrome_album.artist,
            created_at=datetime.now(),
        )

        return AlbumSummary(
            id=album_id,
            title=navidrome_album.name,
            artist_id=artist_id,
            artist=artist,
            release_year=navidrome_album.year,
            genre=navidrome_album.genre,
            cover_art_url=cover_art_url,
            created_at=navidrome_album.created or datetime.now(),
        )


def create_navidrome_album_service() -> Optional[NavidromeAlbumService]:
    """
    Factory function to create NavidromeAlbumService if enabled in settings

    Returns:
        NavidromeAlbumService instance if Navidrome is enabled and connection successful
        None if disabled or connection fails
    """
    if not settings.navidrome_enabled:
        return None

    if not settings.navidrome_url or not settings.navidrome_username or not settings.navidrome_password:
        print("Navidrome is enabled but configuration is incomplete")
        return None

    try:
        client = NavidromeClient(
            base_url=settings.navidrome_url,
            username=settings.navidrome_username,
            password=settings.navidrome_password,
        )

        # Test connection
        if not client.ping():
            print("Navidrome connection test failed")
            return None

        return NavidromeAlbumService(client)
    except Exception as e:
        print(f"Failed to create Navidrome album service: {e}")
        return None


__all__ = ["NavidromeAlbumService", "create_navidrome_album_service"]
