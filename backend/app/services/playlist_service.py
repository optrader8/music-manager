from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from sqlalchemy.orm import Session, joinedload

from app.db.models import Playlist, PlaylistTrack, Track, User
from app.schemas import (
    PlaylistCreate,
    PlaylistDetail,
    PlaylistRead,
    PlaylistTrackRead,
    PlaylistTrackRequest,
    PlaylistUpdate,
    TrackWithRelations,
)


class PlaylistService:
    def __init__(self, session: Session) -> None:
        self.session = session

    # -----------------------------
    # Playlist CRUD
    # -----------------------------

    def list_accessible_playlists(self, *, current_user: User, owner_id: int | None = None) -> list[PlaylistRead]:
        query = self.session.query(Playlist)
        if owner_id is not None:
            if owner_id == current_user.id:
                query = query.filter(Playlist.owner_id == owner_id)
            else:
                query = query.filter(Playlist.owner_id == owner_id, Playlist.is_public.is_(True))
        else:
            query = query.filter(
                (Playlist.owner_id == current_user.id) | (Playlist.is_public.is_(True))
            )

        playlists = query.order_by(Playlist.created_at.desc()).options(joinedload(Playlist.owner)).all()
        return [self._build_playlist_summary(playlist, current_user) for playlist in playlists]

    def create_playlist(self, *, owner: User, data: PlaylistCreate) -> PlaylistDetail:
        existing = (
            self.session.query(Playlist)
            .filter(Playlist.owner_id == owner.id, Playlist.name == data.name)
            .one_or_none()
        )
        if existing:
            raise ValueError("Playlist name already exists")

        playlist = Playlist(
            owner_id=owner.id,
            name=data.name,
            description=data.description,
            is_public=data.is_public,
            is_smart=data.is_smart,
            smart_filter=data.smart_filter,
        )
        if playlist.is_smart and playlist.smart_filter is None:
            playlist.smart_filter = {}
        self.session.add(playlist)
        self.session.commit()
        self.session.refresh(playlist)
        return self._build_playlist_detail(playlist, owner)

    def update_playlist(
        self,
        *,
        playlist_id: int,
        owner: User,
        data: PlaylistUpdate,
    ) -> PlaylistDetail:
        playlist = self._get_playlist_owned_by(playlist_id, owner.id)

        if data.name is not None:
            playlist.name = data.name
        if data.description is not None:
            playlist.description = data.description
        if data.is_public is not None:
            playlist.is_public = data.is_public
        if data.is_smart is not None:
            playlist.is_smart = data.is_smart
            if not data.is_smart:
                playlist.smart_filter = None
        if data.smart_filter is not None:
            playlist.smart_filter = data.smart_filter
        if playlist.is_smart and playlist.smart_filter is None:
            playlist.smart_filter = {}

        self.session.commit()
        self.session.refresh(playlist)
        return self._build_playlist_detail(playlist, owner)

    def delete_playlist(self, *, playlist_id: int, owner: User) -> None:
        playlist = self._get_playlist_owned_by(playlist_id, owner.id)
        self.session.delete(playlist)
        self.session.commit()

    def get_playlist_detail(self, *, playlist_id: int, current_user: User) -> PlaylistDetail:
        playlist = self._get_playlist_accessible(playlist_id, current_user.id)
        return self._build_playlist_detail(playlist, current_user)

    # -----------------------------
    # Track management
    # -----------------------------

    def add_track_to_playlist(
        self,
        *,
        playlist_id: int,
        request: PlaylistTrackRequest,
        owner: User,
    ) -> PlaylistDetail:
        playlist = self._get_playlist_owned_by(playlist_id, owner.id)
        if playlist.is_smart:
            raise ValueError("Cannot manually add tracks to a smart playlist")

        track = self.session.get(Track, request.track_id)
        if not track:
            raise ValueError("Track not found")

        existing = (
            self.session.query(PlaylistTrack)
            .filter(
                PlaylistTrack.playlist_id == playlist_id,
                PlaylistTrack.track_id == request.track_id,
            )
            .one_or_none()
        )
        if existing:
            raise ValueError("Track already exists in playlist")

        position = request.position or (len(playlist.tracks) + 1)
        position = max(1, min(position, len(playlist.tracks) + 1))

        # Shift positions for existing items at or after the target position
        if playlist.tracks:
            self.session.query(PlaylistTrack).filter(
                PlaylistTrack.playlist_id == playlist_id,
                PlaylistTrack.position >= position,
            ).update({PlaylistTrack.position: PlaylistTrack.position + 1}, synchronize_session="fetch")

        entry = PlaylistTrack(playlist_id=playlist_id, track_id=request.track_id, position=position)
        self.session.add(entry)
        self.session.commit()
        self.session.refresh(playlist)
        return self._build_playlist_detail(playlist, owner)

    def remove_track_from_playlist(
        self,
        *,
        playlist_id: int,
        track_id: int,
        owner: User,
    ) -> PlaylistDetail:
        playlist = self._get_playlist_owned_by(playlist_id, owner.id)
        if playlist.is_smart:
            raise ValueError("Cannot modify tracks of a smart playlist")

        entry = (
            self.session.query(PlaylistTrack)
            .filter(
                PlaylistTrack.playlist_id == playlist_id,
                PlaylistTrack.track_id == track_id,
            )
            .one_or_none()
        )
        if not entry:
            raise ValueError("Track not found in playlist")
        removed_position = entry.position
        self.session.delete(entry)
        self.session.flush()
        self.session.query(PlaylistTrack).filter(
            PlaylistTrack.playlist_id == playlist_id,
            PlaylistTrack.position > removed_position,
        ).update({PlaylistTrack.position: PlaylistTrack.position - 1}, synchronize_session="fetch")
        self.session.commit()
        self.session.refresh(playlist)
        return self._build_playlist_detail(playlist, owner)

    def reorder_track(
        self,
        *,
        playlist_id: int,
        track_id: int,
        new_position: int,
        owner: User,
    ) -> PlaylistDetail:
        playlist = self._get_playlist_owned_by(playlist_id, owner.id)
        if playlist.is_smart:
            raise ValueError("Cannot reorder tracks of a smart playlist")

        entry = (
            self.session.query(PlaylistTrack)
            .filter(
                PlaylistTrack.playlist_id == playlist_id,
                PlaylistTrack.track_id == track_id,
            )
            .one_or_none()
        )
        if not entry:
            raise ValueError("Track not found in playlist")

        new_position = max(1, new_position)
        total = (
            self.session.query(PlaylistTrack)
            .filter(PlaylistTrack.playlist_id == playlist_id)
            .count()
        )
        new_position = min(new_position, total)

        if new_position == entry.position:
            return self._build_playlist_detail(playlist, owner)

        if new_position < entry.position:
            self.session.query(PlaylistTrack).filter(
                PlaylistTrack.playlist_id == playlist_id,
                PlaylistTrack.position >= new_position,
                PlaylistTrack.position < entry.position,
            ).update({PlaylistTrack.position: PlaylistTrack.position + 1}, synchronize_session="fetch")
        else:
            self.session.query(PlaylistTrack).filter(
                PlaylistTrack.playlist_id == playlist_id,
                PlaylistTrack.position <= new_position,
                PlaylistTrack.position > entry.position,
            ).update({PlaylistTrack.position: PlaylistTrack.position - 1}, synchronize_session="fetch")

        entry.position = new_position
        self.session.commit()
        self.session.refresh(playlist)
        return self._build_playlist_detail(playlist, owner)

    # -----------------------------
    # Helpers
    # -----------------------------

    def _get_playlist_owned_by(self, playlist_id: int, owner_id: int) -> Playlist:
        playlist = (
            self.session.query(Playlist)
            .options(
                joinedload(Playlist.tracks)
                .joinedload(PlaylistTrack.track)
                .joinedload(Track.artist),
                joinedload(Playlist.tracks)
                .joinedload(PlaylistTrack.track)
                .joinedload(Track.album),
            )
            .filter(Playlist.id == playlist_id, Playlist.owner_id == owner_id)
            .one_or_none()
        )
        if not playlist:
            raise ValueError("Playlist not found")
        return playlist

    def _get_playlist_accessible(self, playlist_id: int, user_id: int) -> Playlist:
        playlist = (
            self.session.query(Playlist)
            .options(
                joinedload(Playlist.tracks)
                .joinedload(PlaylistTrack.track)
                .joinedload(Track.artist),
                joinedload(Playlist.tracks)
                .joinedload(PlaylistTrack.track)
                .joinedload(Track.album),
            )
            .filter(Playlist.id == playlist_id)
            .one_or_none()
        )
        if not playlist:
            raise ValueError("Playlist not found")
        if playlist.owner_id != user_id and not playlist.is_public:
            raise PermissionError("Playlist is private")
        return playlist

    def _build_playlist_summary(self, playlist: Playlist, current_user: User) -> PlaylistRead:
        track_count = self._compute_track_count(playlist)
        data = {
            "id": playlist.id,
            "owner_id": playlist.owner_id,
            "name": playlist.name,
            "description": playlist.description,
            "is_public": playlist.is_public,
            "is_smart": playlist.is_smart,
            "smart_filter": playlist.smart_filter or {},
            "track_count": track_count,
            "created_at": playlist.created_at,
            "updated_at": playlist.updated_at,
        }
        return PlaylistRead(**data)

    def _build_playlist_detail(self, playlist: Playlist, current_user: User) -> PlaylistDetail:
        tracks_payload = self._collect_playlist_tracks(playlist)
        data = {
            "id": playlist.id,
            "owner_id": playlist.owner_id,
            "name": playlist.name,
            "description": playlist.description,
            "is_public": playlist.is_public,
            "is_smart": playlist.is_smart,
            "smart_filter": playlist.smart_filter or {},
            "track_count": len(tracks_payload),
            "created_at": playlist.created_at,
            "updated_at": playlist.updated_at,
            "tracks": tracks_payload,
        }
        return PlaylistDetail(**data)

    def _collect_playlist_tracks(self, playlist: Playlist) -> list[PlaylistTrackRead]:
        if playlist.is_smart:
            tracks = self._get_smart_tracks(playlist)
            return [
                PlaylistTrackRead(
                    track_id=track.id,
                    position=index + 1,
                    track=TrackWithRelations.model_validate(track),
                )
                for index, track in enumerate(tracks)
            ]
        entries = sorted(playlist.tracks, key=lambda entry: entry.position)
        return [
            PlaylistTrackRead(
                track_id=entry.track_id,
                position=entry.position,
                track=TrackWithRelations.model_validate(entry.track),
            )
            for entry in entries
        ]

    def _compute_track_count(self, playlist: Playlist) -> int:
        if playlist.is_smart:
            return len(self._get_smart_tracks(playlist))
        return len(playlist.tracks)

    def _get_smart_tracks(self, playlist: Playlist) -> Sequence[Track]:
        filters: dict[str, Any] = playlist.smart_filter or {}
        query = (
            self.session.query(Track)
            .options(joinedload(Track.artist), joinedload(Track.album))
        )

        genre = filters.get("genre")
        if genre:
            query = query.filter(Track.genre.ilike(f"%{genre}%"))
        artist_id = filters.get("artist_id")
        if artist_id:
            query = query.filter(Track.artist_id == artist_id)
        album_id = filters.get("album_id")
        if album_id:
            query = query.filter(Track.album_id == album_id)
        search = filters.get("search")
        if search:
            query = query.filter(Track.title.ilike(f"%{search}%"))

        order = filters.get("order", "recent")
        if order == "title":
            query = query.order_by(Track.title.asc())
        elif order == "title_desc":
            query = query.order_by(Track.title.desc())
        else:
            query = query.order_by(Track.created_at.desc())

        limit = filters.get("limit", 100)
        try:
            limit_value = max(1, min(int(limit), 500))
        except (TypeError, ValueError):
            limit_value = 100
        return query.limit(limit_value).all()


__all__ = ["PlaylistService"]
