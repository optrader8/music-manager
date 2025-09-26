"""Subsonic API service layer"""
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.services.artist_service import ArtistService
from app.services.album_service import AlbumService
from app.services.track_service import TrackService
from app.services.playlist_service import PlaylistService
from app.schemas.subsonic.responses import (
    Indexes, Index, ArtistID3, AlbumID3, Child, 
    ArtistWithAlbumsID3, AlbumWithSongsID3, 
    SearchResult3, MusicFolder
)
from app.services.subsonic_id_mapper import SubsonicIDMapper


class SubsonicService:
    """Service layer for Subsonic API operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.artist_service = ArtistService(db)
        self.album_service = AlbumService(db)
        self.track_service = TrackService(db)
        self.playlist_service = PlaylistService(db)
    
    # System operations
    def get_music_folders(self) -> List[MusicFolder]:
        """Get all music folders available in the system"""
        # For now, return a single default music folder
        return [MusicFolder(id="1", name="Music Library", path="/music")]
    
    def get_license_info(self):
        """Get license information for the system"""
        from app.schemas.subsonic.responses import License
        return License()
    
    # Browsing operations
    def get_indexes(self, music_folder_id: Optional[str] = None) -> Indexes:
        """Get artist indexes for browsing"""
        # Get all artists
        artists = self.artist_service.get_all_artists()
        
        # Create an index with all artists under the '#' key for now
        # In a full implementation, we would group by first letter
        artist_list = []
        for artist in artists:
            artist_list.append(self._convert_artist_to_subsonic(artist))
        
        # Group artists by first letter
        index_map = {}
        for artist in artist_list:
            first_char = artist.name[0].upper() if artist.name else '#'
            if not first_char.isalpha():
                first_char = '#'
            
            if first_char not in index_map:
                index_map[first_char] = []
            index_map[first_char].append(artist)
        
        # Create indexes
        indexes = []
        for letter in sorted(index_map.keys()):
            indexes.append(Index(name=letter, artist=index_map[letter]))
        
        return Indexes(
            index=indexes,
            lastModified=int(datetime.now().timestamp() * 1000)  # Unix timestamp in milliseconds
        )
    
    def get_artists(self, music_folder_id: Optional[str] = None) -> List[ArtistID3]:
        """Get all artists"""
        artists = self.artist_service.get_all_artists()
        return [self._convert_artist_to_subsonic(artist) for artist in artists]
    
    def get_artist(self, artist_id: str) -> ArtistWithAlbumsID3:
        """Get artist with their albums"""
        internal_id = SubsonicIDMapper.decode_artist_id(artist_id)
        artist = self.artist_service.get_artist_by_id(internal_id)
        
        if not artist:
            raise ValueError(f"Artist with ID {internal_id} not found")
        
        albums = self.album_service.get_albums_by_artist(internal_id)
        album_list = [self._convert_album_to_subsonic(album) for album in albums]
        
        subsonic_artist = self._convert_artist_to_subsonic(artist)
        
        return ArtistWithAlbumsID3(
            id=subsonic_artist.id,
            name=subsonic_artist.name,
            coverArt=subsonic_artist.coverArt,
            albumCount=subsonic_artist.albumCount,
            starred=subsonic_artist.starred,
            userRating=subsonic_artist.userRating,
            averageRating=subsonic_artist.averageRating,
            album=album_list
        )
    
    def get_album(self, album_id: str) -> AlbumWithSongsID3:
        """Get album with its tracks"""
        internal_id = SubsonicIDMapper.decode_album_id(album_id)
        album = self.album_service.get_album_by_id(internal_id)
        
        if not album:
            raise ValueError(f"Album with ID {internal_id} not found")
        
        tracks = self.track_service.get_tracks_by_album(internal_id)
        track_list = [self._convert_track_to_subsonic(track) for track in tracks]
        
        subsonic_album = self._convert_album_to_subsonic(album)
        
        return AlbumWithSongsID3(
            id=subsonic_album.id,
            name=subsonic_album.name,
            artist=subsonic_album.artist,
            artistId=subsonic_album.artistId,
            coverArt=subsonic_album.coverArt,
            songCount=subsonic_album.songCount,
            duration=subsonic_album.duration,
            playCount=subsonic_album.playCount,
            created=subsonic_album.created,
            starred=subsonic_album.starred,
            year=subsonic_album.year,
            genre=subsonic_album.genre,
            description=subsonic_album.description,
            userRating=subsonic_album.userRating,
            averageRating=subsonic_album.averageRating,
            song=track_list
        )
    
    # Search operations
    def search3(self, query: str, artist_count: int = 20, album_count: int = 20, song_count: int = 20) -> SearchResult3:
        """Search for artists, albums, and songs"""
        # Search for artists
        artists = self.artist_service.search_artists(query, limit=artist_count)
        artist_results = [self._convert_artist_to_subsonic(artist) for artist in artists]
        
        # Search for albums
        albums = self.album_service.search_albums(query, limit=album_count)
        album_results = [self._convert_album_to_subsonic(album) for album in albums]
        
        # Search for tracks
        tracks = self.track_service.search_tracks(query, limit=song_count)
        track_results = [self._convert_track_to_subsonic(track) for track in tracks]
        
        return SearchResult3(
            artist=artist_results,
            album=album_results,
            song=track_results
        )
    
    # Data transformation methods
    def _convert_artist_to_subsonic(self, artist) -> ArtistID3:
        """Convert internal Artist model to Subsonic format"""
        return ArtistID3(
            id=SubsonicIDMapper.encode_artist_id(artist.id),
            name=artist.name,
            coverArt=SubsonicIDMapper.get_cover_art_id(artist.id) if artist.id else None,
            albumCount=artist.album_count if hasattr(artist, 'album_count') else 0,
            starred=artist.starred_at if hasattr(artist, 'starred_at') else None
        )
    
    def _convert_album_to_subsonic(self, album) -> AlbumID3:
        """Convert internal Album model to Subsonic format"""
        return AlbumID3(
            id=SubsonicIDMapper.encode_album_id(album.id),
            name=album.title,
            artist=album.artist.name if hasattr(album, 'artist') and album.artist else "Unknown Artist",
            artistId=SubsonicIDMapper.encode_artist_id(album.artist_id) if hasattr(album, 'artist_id') else "ar-0",
            coverArt=SubsonicIDMapper.get_cover_art_id(album.id) if album.id else None,
            songCount=album.track_count if hasattr(album, 'track_count') else 0,
            duration=album.duration if hasattr(album, 'duration') else 0,
            playCount=album.play_count if hasattr(album, 'play_count') else 0,
            created=album.created_at if hasattr(album, 'created_at') else datetime.now(),
            starred=album.starred_at if hasattr(album, 'starred_at') else None,
            year=album.release_year,
            genre=album.genre,
        )
    
    def _convert_track_to_subsonic(self, track) -> Child:
        """Convert internal Track model to Subsonic format"""
        # Determine content type and suffix from file extension
        content_type_map = {
            '.mp3': 'audio/mpeg',
            '.flac': 'audio/flac',
            '.m4a': 'audio/mp4',
            '.aac': 'audio/aac',
            '.ogg': 'audio/ogg',
            '.opus': 'audio/ogg',
            '.wav': 'audio/wav'
        }
        
        suffix = track.file_path.split('.')[-1].lower() if track.file_path else 'mp3'
        content_type = content_type_map.get(f'.{suffix}', 'audio/mpeg')
        
        # Calculate parent ID based on parent album
        parent_id = SubsonicIDMapper.encode_album_id(track.album_id) if track.album_id else "root"
        
        return Child(
            id=SubsonicIDMapper.encode_track_id(track.id),
            parent=parent_id,
            title=track.title,
            album=track.album.title if track.album else "Unknown Album",
            artist=track.album.artist.name if track.album and track.album.artist else "Unknown Artist",
            track=track.track_number,
            year=track.album.release_year if track.album else None,
            genre=track.album.genre if track.album else None,
            coverArt=SubsonicIDMapper.get_cover_art_id(track.album_id) if track.album_id else None,
            size=track.file_size if track.file_size else 0,
            contentType=content_type,
            suffix=suffix,
            duration=track.duration,
            bitRate=track.bit_rate,
            path=track.file_path,
            playCount=track.play_count if hasattr(track, 'play_count') else 0,
            discNumber=track.disc_number,
            created=track.created_at if hasattr(track, 'created_at') else datetime.now(),
            albumId=SubsonicIDMapper.encode_album_id(track.album_id) if track.album_id else None,
            artistId=SubsonicIDMapper.encode_artist_id(track.album.artist_id) if track.album and track.album.artist_id else None,
            type="music"
        )