"""Track service layer"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.track import Track


class TrackService:
    """Service for managing tracks"""

    def __init__(self, db: Session):
        self.db = db

    def get_track_by_id(self, track_id: int) -> Optional[Track]:
        """Get track by ID"""
        return self.db.query(Track).filter(Track.id == track_id).first()

    def get_tracks_by_album_id(self, album_id: int) -> List[Track]:
        """Get tracks by album ID"""
        return self.db.query(Track).filter(Track.album_id == album_id).all()

    def get_tracks_by_artist_id(self, artist_id: int) -> List[Track]:
        """Get tracks by artist ID"""
        return self.db.query(Track).filter(Track.artist_id == artist_id).all()

    def get_all_tracks(self, skip: int = 0, limit: int = 100) -> List[Track]:
        """Get all tracks with pagination"""
        return self.db.query(Track).offset(skip).limit(limit).all()

    def search_tracks(self, query: str, limit: int = 20) -> List[Track]:
        """Search tracks by title"""
        return (
            self.db.query(Track)
            .filter(Track.title.ilike(f"%{query}%"))
            .limit(limit)
            .all()
        )

    def get_track_by_file_path(self, file_path: str) -> Optional[Track]:
        """Get track by file path"""
        return self.db.query(Track).filter(Track.file_path == file_path).first()