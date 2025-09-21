from __future__ import annotations

from typing import Iterable

from sqlalchemy.orm import Session

from app.db.models import Album, Artist, Track
from app.schemas import MetadataSuggestion, TrackMetadataUpdate
from app.services.musicbrainz_client import MusicBrainzClient, MusicBrainzRecording
from app.utils import AlbumRepository, ArtistRepository


class MetadataService:
    def __init__(
        self,
        session: Session,
        musicbrainz_client: MusicBrainzClient | None = None,
    ) -> None:
        self.session = session
        self.musicbrainz_client = musicbrainz_client or MusicBrainzClient()
        self.artist_repo = ArtistRepository(session)
        self.album_repo = AlbumRepository(session)

    def update_track_metadata(self, track_id: int, update: TrackMetadataUpdate) -> Track:
        track = self.session.get(Track, track_id)
        if not track:
            raise ValueError("Track not found")

        artist = track.artist
        album = track.album

        if update.artist_name is not None:
            artist = self.artist_repo.get_or_create(update.artist_name) if update.artist_name else None
            track.artist = artist

        if update.album_title is not None:
            if update.album_title and artist:
                album = self.album_repo.get_or_create(
                    artist,
                    title=update.album_title,
                    release_year=update.release_year,
                    genre=update.genre,
                )
            else:
                album = None
            track.album = album

        if update.title is not None:
            track.title = update.title
        if update.genre is not None:
            track.genre = update.genre
        if update.track_number is not None:
            track.track_number = update.track_number
        if update.disc_number is not None:
            track.disc_number = update.disc_number
        if update.release_year is not None and album:
            album.release_year = update.release_year

        self.session.commit()
        self.session.refresh(track)
        return track

    def batch_update_tracks(
        self,
        track_ids: Iterable[int],
        update: TrackMetadataUpdate,
    ) -> list[Track]:
        updated: list[Track] = []
        for track_id in track_ids:
            updated.append(self.update_track_metadata(track_id, update))
        return updated

    def suggest_metadata(self, track_id: int, limit: int = 5) -> list[MetadataSuggestion]:
        track = self.session.get(Track, track_id)
        if not track:
            raise ValueError("Track not found")

        artist_name = track.artist.name if track.artist else None
        recordings = self.musicbrainz_client.search_recordings(
            title=track.title,
            artist=artist_name,
            limit=limit,
        )
        return [self._convert_recording(recording) for recording in recordings]

    def _convert_recording(self, recording: MusicBrainzRecording) -> MetadataSuggestion:
        return MetadataSuggestion(
            title=recording.title,
            artist_name=recording.artist_name,
            album_title=recording.album_title,
            release_year=recording.release_year,
            score=recording.score,
        )



__all__ = ["MetadataService"]
