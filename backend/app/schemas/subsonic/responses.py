"""Subsonic API response models"""
from typing import Optional, List, Literal, Union, Any
from pydantic import BaseModel, Field
from datetime import datetime


class SubsonicResponse(BaseModel):
    """Base response structure for Subsonic API"""
    status: Literal["ok", "failed"]
    version: str = "1.16.1"
    type: str = "music-manager"
    serverVersion: str = "1.0.0"
    openSubsonic: bool = True


class SubsonicError(BaseModel):
    """Error model for Subsonic API"""
    code: int
    message: str


class SubsonicResponseWrapper(BaseModel):
    """Wrapper for Subsonic responses"""
    subsonic_response: Union[SubsonicResponse, Any] = Field(alias="subsonic-response")
    
    class Config:
        allow_population_by_field_name = True


class MusicFolder(BaseModel):
    """Model for music folder representation"""
    id: str
    name: str
    path: Optional[str] = None
    type: Optional[str] = "music"


class License(BaseModel):
    """Model for license information"""
    valid: bool = True
    email: str = "user@example.com"
    licenseExpires: str = "2099-12-31T23:59:59.000Z"
    trialExpires: str = "2099-12-31T23:59:59.000Z"
    numberOfUsers: int = 10


class Index(BaseModel):
    """Model for artist index by letter"""
    name: str
    artist: List = []


class Indexes(BaseModel):
    """Model for all artist indexes"""
    ignoredArticles: str = "The El La Los Las Le Les"
    index: List[Index] = []
    lastModified: int = 0


# Forward reference workaround
Index.update_forward_refs()


class ArtistID3(BaseModel):
    """Model for artist in Subsonic format"""
    id: str
    name: str
    coverArt: Optional[str] = None
    albumCount: int = 0
    starred: Optional[datetime] = None
    userRating: Optional[int] = None
    averageRating: Optional[float] = None


class AlbumID3(BaseModel):
    """Model for album in Subsonic format"""
    id: str
    name: str
    artist: str
    artistId: str
    coverArt: Optional[str] = None
    songCount: int = 0
    duration: int = 0
    playCount: int = 0
    created: datetime
    starred: Optional[datetime] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    userRating: Optional[int] = None
    averageRating: Optional[float] = None


class Child(BaseModel):
    """Model for track in Subsonic format"""
    id: str
    parent: str
    title: str
    album: Optional[str] = None
    artist: Optional[str] = None
    track: Optional[int] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    coverArt: Optional[str] = None
    size: int
    contentType: str
    suffix: str
    duration: Optional[int] = None
    bitRate: Optional[int] = None
    path: str
    playCount: int = 0
    discNumber: Optional[int] = None
    created: datetime
    albumId: Optional[str] = None
    artistId: Optional[str] = None
    type: Literal["music", "podcast"] = "music"
    isDir: bool = False
    userRating: Optional[int] = None
    averageRating: Optional[float] = None
    starred: Optional[datetime] = None
    played: Optional[datetime] = None


class ArtistWithAlbumsID3(BaseModel):
    """Model for artist with albums"""
    id: str
    name: str
    coverArt: Optional[str] = None
    albumCount: int = 0
    starred: Optional[datetime] = None
    userRating: Optional[int] = None
    averageRating: Optional[float] = None
    album: List = []


class AlbumWithSongsID3(BaseModel):
    """Model for album with songs"""
    id: str
    name: str
    artist: str
    artistId: str
    coverArt: Optional[str] = None
    songCount: int = 0
    duration: int = 0
    playCount: int = 0
    created: datetime
    starred: Optional[datetime] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    userRating: Optional[int] = None
    averageRating: Optional[float] = None
    song: List = []


class SearchResult3(BaseModel):
    """Model for search results"""
    artist: List = []
    album: List = []
    song: List = []


class Playlist(BaseModel):
    """Model for playlist"""
    id: str
    name: str
    owner: str
    created: datetime
    changed: datetime
    duration: int
    songCount: int
    comment: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[int] = None
    coverArt: Optional[str] = None
    public: bool = False
    song: List = []

# Update forward references
ArtistID3.update_forward_refs()
AlbumID3.update_forward_refs()
SearchResult3.update_forward_refs()
Playlist.update_forward_refs()
