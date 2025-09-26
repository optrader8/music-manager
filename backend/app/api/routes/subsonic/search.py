"""Subsonic API search endpoints"""
from fastapi import APIRouter, Request, Query
from typing import Optional

from app.core.subsonic_errors import SubsonicError, create_error_response
from app.core.subsonic_auth import get_current_subsonic_user
from app.core.subsonic_formatter import SubsonicResponseFormatter
from app.services.subsonic_service import SubsonicService
from app.db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/search3",
            summary="Search for artists, albums, and songs",
            description="Search for artists, albums, and songs.")
async def search3(
    request: Request,
    query: str = Query(..., description="The search query"),
    artistCount: Optional[int] = Query(20, description="Max number of artists to return"),
    artistOffset: Optional[int] = Query(0, description="Search offset for artists"),
    albumCount: Optional[int] = Query(20, description="Max number of albums to return"),
    albumOffset: Optional[int] = Query(0, description="Search offset for albums"),
    songCount: Optional[int] = Query(20, description="Max number of songs to return"),
    songOffset: Optional[int] = Query(0, description="Search offset for songs"),
    musicFolderId: Optional[str] = Query(None, description="Ignored"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Search for artists, albums, and songs"""
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
        
        # Perform search
        search_result = service.search3(
            query=query,
            artist_count=artistCount,
            album_count=albumCount,
            song_count=songCount
        )
        
        # Format the response
        format_type = (f or 'xml').lower()
        
        # Convert to Subsonic format
        artist_data = SubsonicResponseFormatter.prepare_artist_data([
            {
                "id": artist.id,
                "name": artist.name,
                "albumCount": artist.albumCount,
                "coverArt": artist.coverArt,
                "starred": artist.starred
            } for artist in search_result.artist
        ])
        
        album_data = SubsonicResponseFormatter.prepare_album_data([
            {
                "id": album.id,
                "name": album.name,
                "artist": album.artist,
                "artistId": album.artistId,
                "coverArt": album.coverArt,
                "songCount": album.songCount,
                "duration": album.duration,
                "playCount": album.playCount,
                "created": album.created,
                "year": album.year,
                "genre": album.genre
            } for album in search_result.album
        ])
        
        song_data = SubsonicResponseFormatter.prepare_track_data([
            {
                "id": song.id,
                "parent": song.parent,
                "title": song.title,
                "album": song.album,
                "artist": song.artist,
                "track": song.track,
                "year": song.year,
                "genre": song.genre,
                "coverArt": song.coverArt,
                "size": song.size,
                "contentType": song.contentType,
                "suffix": song.suffix,
                "duration": song.duration,
                "bitRate": song.bitRate,
                "path": song.path,
                "playCount": song.playCount,
                "discNumber": song.discNumber,
                "created": song.created,
                "albumId": song.albumId,
                "artistId": song.artistId,
                "type": song.type
            } for song in search_result.song
        ])
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "searchResult3": {
                "artist": artist_data,
                "album": album_data,
                "song": song_data
            }
        }

        return SubsonicResponseFormatter.format_response(response_data, format_type)
    finally:
        db.close()


@router.get("/search2",
            summary="Legacy search endpoint",
            description="Legacy search endpoint for compatibility.")
async def search2(
    request: Request,
    query: str = Query(..., description="The search query"),
    artistCount: Optional[int] = Query(20, description="Max number of artists to return"),
    artistOffset: Optional[int] = Query(0, description="Search offset for artists"),
    albumCount: Optional[int] = Query(20, description="Max number of albums to return"),
    albumOffset: Optional[int] = Query(0, description="Search offset for albums"),
    songCount: Optional[int] = Query(20, description="Max number of songs to return"),
    songOffset: Optional[int] = Query(0, description="Search offset for songs"),
    musicFolderId: Optional[str] = Query(None, description="Ignored"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Legacy search endpoint for compatibility"""
    # This is just an alias to search3 for backward compatibility
    return await search3(
        request=request,
        query=query,
        artistCount=artistCount,
        artistOffset=artistOffset,
        albumCount=albumCount,
        albumOffset=albumOffset,
        songCount=songCount,
        songOffset=songOffset,
        musicFolderId=musicFolderId,
        f=f
    )