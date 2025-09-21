from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from app.db.models import Album, Artist, Track


@dataclass
class SearchFilters:
    artist_id: int | None = None
    album_id: int | None = None
    genre: str | None = None


class LibraryService:
    """Provides library search and browsing utilities."""

    _SEARCH_ORDER_CLAUSES = {
        "relevance": "rank ASC, t.title COLLATE NOCASE ASC",
        "title": "t.title COLLATE NOCASE ASC",
        "artist": "ar.name COLLATE NOCASE ASC, t.title COLLATE NOCASE ASC",
        "album": "al.title COLLATE NOCASE ASC, t.track_number ASC",
        "recent": "t.created_at DESC",
    }

    _BROWSE_SORTS = {
        "title": (Track.title.asc(),),
        "title_desc": (Track.title.desc(),),
        "artist": (Artist.name.asc(), Track.title.asc()),
        "artist_desc": (Artist.name.desc(), Track.title.asc()),
        "album": (Album.title.asc(), Track.track_number.asc()),
        "album_desc": (Album.title.desc(), Track.track_number.asc()),
        "recent": (Track.created_at.desc(),),
        "recent_asc": (Track.created_at.asc(),),
    }

    def __init__(self, session: Session) -> None:
        self.session = session

    def search_tracks(
        self,
        *,
        query: str,
        page: int,
        page_size: int,
        filters: SearchFilters | None = None,
        sort: str = "relevance",
    ) -> tuple[list[Track], dict[int, float], int]:
        if not query.strip():
            raise ValueError("Search query cannot be empty")

        filters = filters or SearchFilters()
        formatted_query = self._format_fts_query(query)
        offset = (page - 1) * page_size

        order_clause = self._SEARCH_ORDER_CLAUSES.get(sort, self._SEARCH_ORDER_CLAUSES["relevance"])

        genre_param = filters.genre.lower() if filters.genre else None
        if genre_param is not None:
            genre_param = f"%{genre_param}%"

        base_params = {
            "match_query": formatted_query,
            "artist_id": filters.artist_id,
            "album_id": filters.album_id,
            "genre": genre_param,
        }

        search_sql = text(
            f"""
            SELECT t.id AS track_id, bm25(track_search) AS rank
            FROM track_search
            JOIN tracks t ON t.id = track_search.rowid
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums al ON al.id = t.album_id
            WHERE track_search MATCH :match_query
              AND (:artist_id IS NULL OR t.artist_id = :artist_id)
              AND (:album_id IS NULL OR t.album_id = :album_id)
              AND (:genre IS NULL OR lower(t.genre) LIKE :genre)
            ORDER BY {order_clause}
            LIMIT :limit OFFSET :offset
            """
        )

        params = dict(base_params)
        params.update({"limit": page_size, "offset": offset})

        rows = self.session.execute(search_sql, params).fetchall()
        track_ids = [row.track_id for row in rows]
        scores = {row.track_id: self._convert_score(row.rank) for row in rows}

        count_sql = text(
            ""
            "SELECT COUNT(*) AS total "
            "FROM track_search "
            "JOIN tracks t ON t.id = track_search.rowid "
            "LEFT JOIN artists ar ON ar.id = t.artist_id "
            "LEFT JOIN albums al ON al.id = t.album_id "
            "WHERE track_search MATCH :match_query "
            "  AND (:artist_id IS NULL OR t.artist_id = :artist_id) "
            "  AND (:album_id IS NULL OR t.album_id = :album_id) "
            "  AND (:genre IS NULL OR lower(t.genre) LIKE :genre)"
        )
        total = int(self.session.execute(count_sql, base_params).scalar_one())

        if not track_ids:
            return [], scores, total

        tracks = (
            self.session.query(Track)
            .options(joinedload(Track.artist), joinedload(Track.album))
            .filter(Track.id.in_(track_ids))
            .all()
        )
        track_map = {track.id: track for track in tracks}
        ordered_tracks = [track_map[track_id] for track_id in track_ids if track_id in track_map]
        return ordered_tracks, scores, total

    def browse_tracks(
        self,
        *,
        page: int,
        page_size: int,
        filters: SearchFilters | None = None,
        sort: str = "recent",
        search: str | None = None,
    ) -> tuple[list[Track], int]:
        filters = filters or SearchFilters()
        offset = (page - 1) * page_size

        query = (
            self.session.query(Track)
            .options(joinedload(Track.artist), joinedload(Track.album))
            .outerjoin(Track.artist)
            .outerjoin(Track.album)
        )

        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(Track.title.ilike(search_term))

        if filters.artist_id:
            query = query.filter(Track.artist_id == filters.artist_id)
        if filters.album_id:
            query = query.filter(Track.album_id == filters.album_id)
        if filters.genre:
            query = query.filter(Track.genre.ilike(f"%{filters.genre}%"))

        sort_expressions = self._BROWSE_SORTS.get(sort, self._BROWSE_SORTS["recent"])
        query = query.order_by(*sort_expressions)

        total = query.count()
        tracks = query.offset(offset).limit(page_size).all()
        return tracks, total

    def _format_fts_query(self, raw_query: str) -> str:
        tokens = [token for token in raw_query.replace('"', " ").split() if token]
        if not tokens:
            raise ValueError("Search query cannot be empty")
        return " ".join(f"{token}*" for token in tokens)

    def _convert_score(self, bm25_score: float | None) -> float:
        if bm25_score is None:
            return 0.0
        return float(1.0 / (1.0 + max(bm25_score, 0.0)))


__all__ = ["LibraryService", "SearchFilters"]
