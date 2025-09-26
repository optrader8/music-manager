"""Subsonic API browsing endpoints"""
from fastapi import APIRouter, Request, Query
from typing import Optional

from app.core.subsonic_errors import SubsonicError, create_error_response
from app.core.subsonic_auth import get_current_subsonic_user
from app.core.subsonic_formatter import SubsonicResponseFormatter
from app.services.subsonic_service import SubsonicService
from app.db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/getIndexes",
            summary="Get artist indexes",
            description="Returns an indexed structure of all artists.")
async def get_indexes(
    request: Request,
    musicFolderId: Optional[str] = Query(None, description="Ignored"),
    ifModifiedSince: Optional[int] = Query(None, description="Ignored"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Get artist indexes for browsing"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Create service instance
        service = SubsonicService(db)
        
        # Get indexes
        indexes = service.get_indexes(music_folder_id=musicFolderId)
        
        # Convert indexes to response format
        index_data = []
        for idx in indexes.index:
            index_data.append({
                "@name": idx.name,
                "artist": [
                    {
                        "@id": artist.id,
                        "@name": artist.name,
                        "@albumCount": artist.albumCount,
                        "@starred": artist.starred.isoformat().replace('+00:00', 'Z') if artist.starred else None
                    } for artist in idx.artist
                ]
            })
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "indexes": {
                "lastModified": indexes.lastModified,
                "ignoredArticles": indexes.ignoredArticles,
                "index": index_data
            }
        }

        format_type = (f or 'xml').lower()
        return SubsonicResponseFormatter.format_response(response_data, format_type)
    finally:
        db.close()


@router.get("/getArtists",
            summary="Get all artists",
            description="Returns all artists in the music collection.")
async def get_artists(
    request: Request,
    musicFolderId: Optional[str] = Query(None, description="Ignored"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Get all artists"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Create service instance
        service = SubsonicService(db)
        
        # Get artists
        artists = service.get_artists(music_folder_id=musicFolderId)
        
        # Convert to response format
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "artists": {
                "ignoredArticles": "The El La Los Las Le Les",
                "index": [
                    {
                        "@name": "#",  # For simplicity, put all artists under one index
                        "artist": [
                            {
                                "@id": artist.id,
                                "@name": artist.name,
                                "@albumCount": artist.albumCount,
                                "@starred": artist.starred.isoformat().replace('+00:00', 'Z') if artist.starred else None
                            } for artist in artists
                        ]
                    }
                ]
            }
        }

        format_type = (f or 'xml').lower()
        return SubsonicResponseFormatter.format_response(response_data, format_type)
    finally:
        db.close()


@router.get("/getArtist",
            summary="Get artist by ID",
            description="Returns a single artist with album information.")
async def get_artist(
    request: Request,
    id: str = Query(..., description="The artist ID"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Get artist by ID"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Create service instance
        service = SubsonicService(db)
        
        # Get artist
        artist = service.get_artist(artist_id=id)
        
        # Convert to response format
        album_data = []
        for album in artist.album:
            album_info = {
                "@id": album.id,
                "@name": album.name,
                "@artist": album.artist,
                "@artistId": album.artistId,
                "@coverArt": album.coverArt,
                "@songCount": album.songCount,
                "@duration": album.duration,
                "@playCount": album.playCount,
                "@created": album.created.isoformat().replace('+00:00', 'Z'),
                "@year": album.year,
                "@genre": album.genre
            }
            # Remove None values
            album_info = {k: v for k, v in album_info.items() if v is not None}
            album_data.append(album_info)
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "artist": {
                "@id": artist.id,
                "@name": artist.name,
                "@coverArt": artist.coverArt,
                "@albumCount": artist.albumCount,
                "@starred": artist.starred.isoformat().replace('+00:00', 'Z') if artist.starred else None,
                "album": album_data
            }
        }

        format_type = (f or 'xml').lower()
        return SubsonicResponseFormatter.format_response(response_data, format_type)
    finally:
        db.close()


@router.get("/getAlbum",
            summary="Get album by ID",
            description="Returns a single album with song information.")
async def get_album(
    request: Request,
    id: str = Query(..., description="The album ID"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Get album by ID"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Create service instance
        service = SubsonicService(db)
        
        # Get album
        album = service.get_album(album_id=id)
        
        # Convert songs to response format
        song_data = []
        for song in album.song:
            song_info = {
                "@id": song.id,
                "@parent": song.parent,
                "@title": song.title,
                "@album": song.album,
                "@artist": song.artist,
                "@track": song.track,
                "@year": song.year,
                "@genre": song.genre,
                "@coverArt": song.coverArt,
                "@size": song.size,
                "@contentType": song.contentType,
                "@suffix": song.suffix,
                "@duration": song.duration,
                "@bitRate": song.bitRate,
                "@path": song.path,
                "@playCount": song.playCount,
                "@discNumber": song.discNumber,
                "@created": song.created.isoformat().replace('+00:00', 'Z'),
                "@albumId": song.albumId,
                "@artistId": song.artistId,
                "@type": song.type
            }
            # Remove None values
            song_info = {k: v for k, v in song_info.items() if v is not None}
            song_data.append(song_info)
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "album": {
                "@id": album.id,
                "@name": album.name,
                "@artist": album.artist,
                "@artistId": album.artistId,
                "@coverArt": album.coverArt,
                "@songCount": album.songCount,
                "@duration": album.duration,
                "@playCount": album.playCount,
                "@created": album.created.isoformat().replace('+00:00', 'Z'),
                "@year": album.year,
                "@genre": album.genre,
                "song": song_data
            }
        }

        format_type = (f or 'xml').lower()
        return SubsonicResponseFormatter.format_response(response_data, format_type)
    finally:
        db.close()