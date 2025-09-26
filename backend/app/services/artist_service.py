"""Artist service layer"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.artist import Artist


class ArtistService:
    """Service for managing artists"""

    def __init__(self, db: Session):
        self.db = db

    def get_artist_by_id(self, artist_id: int) -> Optional[Artist]:
        """Get artist by ID"""
        return self.db.query(Artist).filter(Artist.id == artist_id).first()

    def get_artist_by_name(self, name: str) -> Optional[Artist]:
        """Get artist by name"""
        return self.db.query(Artist).filter(Artist.name == name).first()

    def get_all_artists(self, skip: int = 0, limit: int = 100) -> List[Artist]:
        """Get all artists with pagination"""
        return self.db.query(Artist).offset(skip).limit(limit).all()

    def create_artist(self, name: str, country: Optional[str] = None, bio: Optional[str] = None) -> Artist:
        """Create new artist"""
        artist = Artist(name=name, country=country, bio=bio)
        self.db.add(artist)
        self.db.commit()
        self.db.refresh(artist)
        return artist

    def search_artists(self, query: str, limit: int = 20) -> List[Artist]:
        """Search artists by name"""
        return (
            self.db.query(Artist)
            .filter(Artist.name.ilike(f"%{query}%"))
            .limit(limit)
            .all()
        )