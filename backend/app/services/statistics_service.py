from __future__ import annotations

from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.pagination import PaginationParams
from app.db.models import Album, Artist, Track
from app.schemas import (
    AlbumFilters,
    AlbumSortOptions,
    AlbumStats,
    AlbumSummary,
    ArtistStats,
    BitrateDistribution,
    GenreDistribution,
    LibraryOverview,
    PaginationMeta,
    QualityStats,
    SampleRateDistribution,
    TrackPlayStats,
)

from .album_service import AlbumService


class StatisticsService:
    """Provides aggregated statistics about the music library."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.album_service = AlbumService(session)

    def get_library_overview(self) -> LibraryOverview:
        total_tracks = int(self.session.query(func.count(Track.id)).scalar() or 0)
        total_albums = int(self.session.query(func.count(Album.id)).scalar() or 0)
        total_artists = int(
            self.session.query(func.count(func.distinct(Album.artist_id))).scalar() or 0
        )

        total_duration = float(self.session.query(func.sum(Track.duration_seconds)).scalar() or 0.0)
        average_track_duration = (
            float(self.session.query(func.avg(Track.duration_seconds)).scalar() or 0.0)
            if total_tracks
            else None
        )
        avg_bitrate = float(self.session.query(func.avg(Track.bit_rate)).scalar() or 0.0)
        total_duration_hours = total_duration / 3600.0 if total_duration else 0.0
        estimated_size_mb = 0.0
        if avg_bitrate and total_duration:
            estimated_size_mb = (avg_bitrate * total_duration) / 8_000_000.0

        recently_added_at = self.session.query(func.max(Album.created_at)).scalar()

        return LibraryOverview(
            total_albums=total_albums,
            total_tracks=total_tracks,
            total_artists=total_artists,
            total_duration_seconds=int(total_duration),
            total_duration_hours=total_duration_hours,
            estimated_size_mb=estimated_size_mb,
            average_bitrate=avg_bitrate if avg_bitrate > 0 else None,
            average_track_duration=average_track_duration,
            recently_added_at=recently_added_at,
        )

    def get_recently_added_albums(
        self,
        pagination: PaginationParams,
    ) -> tuple[list[AlbumSummary], PaginationMeta]:
        items, total = self.album_service.get_albums(
            pagination=pagination,
            filters=AlbumFilters(),
            sort=AlbumSortOptions.RECENTLY_ADDED,
        )
        meta = self._build_meta(total=total, params=pagination)
        return items, meta

    def get_most_played_tracks(
        self,
        pagination: PaginationParams,
    ) -> tuple[list[TrackPlayStats], PaginationMeta]:
        query = (
            self.session.query(Track)
            .options(joinedload(Track.artist), joinedload(Track.album))
            .order_by(Track.play_count.desc(), Track.last_played_at.desc().nullslast(), Track.id.asc())
        )

        total = int(query.count())
        tracks = query.offset(pagination.offset).limit(pagination.page_size).all()
        items = [TrackPlayStats.model_validate(track) for track in tracks]
        meta = self._build_meta(total=total, params=pagination)
        return items, meta

    def get_genre_distribution(self) -> list[GenreDistribution]:
        rows = (
            self.session.query(
                Track.genre,
                func.count(Track.id).label("track_count"),
                func.sum(Track.duration_seconds).label("total_duration"),
            )
            .filter(Track.genre.isnot(None))
            .group_by(Track.genre)
            .order_by(func.count(Track.id).desc())
            .all()
        )

        results: list[GenreDistribution] = []
        for row in rows:
            genre_name = row.genre or "Unknown"
            total_duration = float(row.total_duration or 0.0)
            results.append(
                GenreDistribution(
                    genre=genre_name,
                    track_count=int(row.track_count or 0),
                    total_duration_seconds=total_duration,
                )
            )
        return results

    def get_artist_stats(self) -> list[ArtistStats]:
        """Get statistics for each artist."""
        rows = (
            self.session.query(
                Artist.name,
                func.count(func.distinct(Track.id)).label("track_count"),
                func.count(func.distinct(Album.id)).label("album_count"),
            )
            .outerjoin(Album, Artist.id == Album.artist_id)
            .outerjoin(Track, Album.id == Track.album_id)
            .group_by(Artist.id, Artist.name)
            .order_by(func.count(func.distinct(Track.id)).desc())
            .all()
        )

        results: list[ArtistStats] = []
        for row in rows:
            results.append(
                ArtistStats(
                    name=row.name,
                    track_count=int(row.track_count or 0),
                    album_count=int(row.album_count or 0),
                )
            )
        return results

    def get_album_stats(self) -> list[AlbumStats]:
        """Get statistics for each album."""
        rows = (
            self.session.query(
                Album.title,
                Artist.name.label("artist_name"),
                Album.release_year,
                func.count(Track.id).label("track_count"),
                func.sum(Track.duration_seconds).label("total_duration_seconds"),
            )
            .outerjoin(Artist, Album.artist_id == Artist.id)
            .outerjoin(Track, Album.id == Track.album_id)
            .group_by(Album.id, Album.title, Artist.name, Album.release_year)
            .order_by(func.count(Track.id).desc())
            .all()
        )

        results: list[AlbumStats] = []
        for row in rows:
            total_duration = int(row.total_duration_seconds or 0)
            results.append(
                AlbumStats(
                    title=row.title,
                    artist_name=row.artist_name,
                    release_date=str(row.release_year) if row.release_year else None,
                    track_count=int(row.track_count or 0),
                    total_duration_seconds=total_duration,
                    total_duration_minutes=total_duration // 60,
                )
            )
        return results

    def get_quality_stats(self) -> QualityStats:
        """Get audio quality distribution statistics."""
        # Bitrate distribution
        bitrate_rows = (
            self.session.query(
                Track.bit_rate,
                func.count(Track.id).label("count"),
            )
            .filter(Track.bit_rate.isnot(None))
            .group_by(Track.bit_rate)
            .order_by(Track.bit_rate.asc())
            .all()
        )

        bitrate_distribution = [
            BitrateDistribution(bitrate=int(row.bit_rate or 0), count=int(row.count or 0))
            for row in bitrate_rows
        ]

        # Sample rate distribution
        sample_rate_rows = (
            self.session.query(
                Track.sample_rate,
                func.count(Track.id).label("count"),
            )
            .filter(Track.sample_rate.isnot(None))
            .group_by(Track.sample_rate)
            .order_by(Track.sample_rate.asc())
            .all()
        )

        sample_rate_distribution = [
            SampleRateDistribution(sample_rate=int(row.sample_rate or 0), count=int(row.count or 0))
            for row in sample_rate_rows
        ]

        return QualityStats(
            bitrate_distribution=bitrate_distribution,
            sample_rate_distribution=sample_rate_distribution,
        )

    def _build_meta(self, *, total: int, params: PaginationParams) -> PaginationMeta:
        from app.core.pagination import build_pagination_metadata

        meta = build_pagination_metadata(total=total, params=params)
        return PaginationMeta.model_validate(meta)


__all__ = ["StatisticsService"]
