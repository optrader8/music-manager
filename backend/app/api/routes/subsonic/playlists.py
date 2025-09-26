"""Subsonic API playlist endpoints"""
from fastapi import APIRouter, Request, Query
from typing import Optional

from app.core.subsonic_errors import SubsonicError, SubsonicErrorCodes, create_error_response
from app.core.subsonic_auth import get_current_subsonic_user
from app.core.subsonic_formatter import SubsonicResponseFormatter
from app.services.subsonic_service import SubsonicService
from app.services.subsonic_id_mapper import SubsonicIDMapper
from app.services.playlist_service import PlaylistService
from app.services.track_service import TrackService
from app.db.session import get_db
from sqlalchemy.orm import Session
from datetime import datetime

router = APIRouter()


@router.get("/getPlaylists",
            summary="Get user playlists",
            description="Returns all playlists for the authenticated user.")
async def get_playlists(
    request: Request,
    username: Optional[str] = Query(None, description="Username for which to return playlists (admin only)"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Get user playlists"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Get the playlists for the current user
        # If 'username' is specified and user is admin, return other user's playlists
        playlist_service = PlaylistService(db)
        
        # Get user_id based on the currently authenticated user,
        # or the requested username if available and user is admin
        target_user_id = user.id
        
        playlists = playlist_service.get_user_playlists(target_user_id)
        
        # Format playlists according to Subsonic spec
        playlist_list = []
        for playlist in playlists:
            # Convert internal playlist ID to Subsonic format
            subsonic_playlist_id = SubsonicIDMapper.encode_playlist_id(playlist.id)
            
            # Get the total duration and track count for the playlist
            tracks = playlist_service.get_playlist_tracks(playlist.id)
            duration = sum(track.duration or 0 for track in tracks if track.duration)
            song_count = len(tracks)
            
            playlist_info = {
                "@id": subsonic_playlist_id,
                "@name": playlist.name,
                "@comment": playlist.description or "",
                "@owner": user.username,  # or playlist.owner if stored separately
                "@public": playlist.is_public if hasattr(playlist, 'is_public') else False,
                "@songCount": song_count,
                "@duration": duration,
                "@created": SubsonicResponseFormatter.format_timestamp(playlist.created_at if hasattr(playlist, 'created_at') else datetime.now()),
                "@changed": SubsonicResponseFormatter.format_timestamp(playlist.updated_at if hasattr(playlist, 'updated_at') else playlist.created_at if hasattr(playlist, 'created_at') else datetime.now())
            }
            
            # Remove None values
            playlist_info = {k: v for k, v in playlist_info.items() if v is not None}
            playlist_list.append(playlist_info)
        
        format_type = (f or 'xml').lower()
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "playlists": {
                "playlist": playlist_list
            }
        }

        return SubsonicResponseFormatter.format_response(response_data, format_type)
    finally:
        db.close()


@router.get("/getPlaylist",
            summary="Get playlist by ID",
            description="Returns a single playlist with the given ID.")
async def get_playlist(
    request: Request,
    id: str = Query(..., description="The playlist ID"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Get playlist by ID"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Decode the playlist ID from Subsonic format to internal format
        try:
            internal_playlist_id = SubsonicIDMapper.decode_playlist_id(id)
        except ValueError:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Invalid playlist ID: {id}")
        
        # Get the playlist from the database
        playlist_service = PlaylistService(db)
        playlist = playlist_service.get_playlist_by_id(internal_playlist_id)
        
        if not playlist:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Playlist not found: {id}")
        
        # Check if user has permission to access this playlist
        if playlist.user_id != user.id and not getattr(user, 'is_admin', False):
            return create_error_response(SubsonicErrorCodes.UNAUTHORIZED, "Access denied to playlist")
        
        # Get the tracks in the playlist
        track_service = TrackService(db)
        playlist_tracks = playlist_service.get_playlist_tracks(internal_playlist_id)
        
        # Convert tracks to Subsonic format
        track_list = []
        for track in playlist_tracks:
            # Convert track to the same format as in the /rest/stream endpoint
            track_info = {
                "@id": SubsonicIDMapper.encode_track_id(track.id),
                "@parent": SubsonicIDMapper.encode_album_id(track.album_id) if track.album_id else "",
                "@title": track.title,
                "@album": track.album.title if track.album else "Unknown Album",
                "@artist": track.album.artist.name if track.album and track.album.artist else "Unknown Artist",
                "@isDir": False,
                "@coverArt": SubsonicIDMapper.get_cover_art_id(track.album_id) if track.album_id else None,
                "@size": track.file_size if track.file_size else 0,
                "@contentType": "audio/mpeg",  # Should be determined from file extension
                "@suffix": track.file_path.split('.')[-1] if track.file_path else "mp3",
                "@duration": track.duration,
                "@bitRate": track.bit_rate,
                "@path": track.file_path,
                "@playCount": 0,  # Assuming no play count for playlist tracks
                "@created": SubsonicResponseFormatter.format_timestamp(track.created_at if hasattr(track, 'created_at') else datetime.now()),
                "@albumId": SubsonicIDMapper.encode_album_id(track.album_id) if track.album_id else None,
                "@artistId": SubsonicIDMapper.encode_artist_id(track.album.artist_id) if track.album and track.album.artist_id else None,
                "@type": "music"
            }
            
            # Remove None values
            track_info = {k: v for k, v in track_info.items() if v is not None}
            track_list.append(track_info)
        
        # Calculate playlist stats
        duration = sum(track.duration or 0 for track in playlist_tracks if track.duration)
        song_count = len(playlist_tracks)
        
        format_type = (f or 'xml').lower()
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "playlist": {
                "@id": id,  # Already in Subsonic format
                "@name": playlist.name,
                "@comment": playlist.description or "",
                "@owner": user.username,
                "@public": playlist.is_public if hasattr(playlist, 'is_public') else False,
                "@songCount": song_count,
                "@duration": duration,
                "@created": SubsonicResponseFormatter.format_timestamp(playlist.created_at if hasattr(playlist, 'created_at') else datetime.now()),
                "@changed": SubsonicResponseFormatter.format_timestamp(playlist.updated_at if hasattr(playlist, 'updated_at') else playlist.created_at if hasattr(playlist, 'created_at') else datetime.now()),
                "entry": track_list
            }
        }

        return SubsonicResponseFormatter.format_response(response_data, format_type)
    finally:
        db.close()


@router.post("/createPlaylist",
            summary="Create or update a playlist",
            description="Creates or updates a playlist.")
async def create_playlist(
    request: Request,
    playlistId: Optional[str] = Query(None, description="If specified, update the existing playlist with this ID"),
    name: Optional[str] = Query(None, description="The name of the playlist to create"),
    songId: Optional[list] = Query([], description="Zero or more song IDs to add to the playlist"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Create or update a playlist"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        playlist_service = PlaylistService(db)
        
        if playlistId:
            # Updating existing playlist
            try:
                internal_playlist_id = SubsonicIDMapper.decode_playlist_id(playlistId)
            except ValueError:
                return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Invalid playlist ID: {playlistId}")
            
            playlist = playlist_service.get_playlist_by_id(internal_playlist_id)
            if not playlist:
                return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Playlist not found: {playlistId}")
            
            # Check if user has permission to update this playlist
            if playlist.user_id != user.id:
                return create_error_response(SubsonicErrorCodes.UNAUTHORIZED, "Access denied to playlist")
            
            # Update the playlist name if provided
            if name:
                playlist.name = name
            
            # Add tracks to the playlist if provided
            for track_id_str in songId:
                try:
                    internal_track_id = SubsonicIDMapper.decode_track_id(track_id_str)
                    # Add track to playlist
                    playlist_service.add_track_to_playlist(internal_playlist_id, internal_track_id)
                except ValueError:
                    # Skip invalid track IDs
                    continue
            
            db.commit()
        else:
            # Creating a new playlist
            if not name:
                return create_error_response(SubsonicErrorCodes.MISSING_PARAMETER, "Name parameter is required when creating a new playlist")
            
            # Create the new playlist
            playlist = playlist_service.create_playlist(user.id, name, "")
            internal_playlist_id = playlist.id
            
            # Add tracks to the new playlist if provided
            for track_id_str in songId:
                try:
                    internal_track_id = SubsonicIDMapper.decode_track_id(track_id_str)
                    # Add track to playlist
                    playlist_service.add_track_to_playlist(internal_playlist_id, internal_track_id)
                except ValueError:
                    # Skip invalid track IDs
                    continue
            
            db.commit()
        
        # Return success response
        format_type = (f or 'xml').lower()
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            # For createPlaylist, the API should return the playlist ID
            "playlist": {
                "@id": SubsonicIDMapper.encode_playlist_id(internal_playlist_id),
                "@name": name or playlist.name,
                "@owner": user.username,
                "@public": False,
                "@created": SubsonicResponseFormatter.format_timestamp(datetime.now())
            }
        }

        return SubsonicResponseFormatter.format_response(response_data, format_type)
    except Exception as e:
        db.rollback()
        return create_error_response(SubsonicErrorCodes.GENERIC, str(e))
    finally:
        db.close()


@router.post("/updatePlaylist",
            summary="Update an existing playlist",
            description="Updates an existing playlist.")
async def update_playlist(
    request: Request,
    id: str = Query(..., description="The playlist ID"),
    name: Optional[str] = Query(None, description="The new name of the playlist"),
    comment: Optional[str] = Query(None, description="The new comment"),
    public: Optional[bool] = Query(None, description="Whether the playlist should be public"),
    songIdToAdd: Optional[list] = Query([], description="Zero or more song IDs to add to the playlist"),
    songIndexToRemove: Optional[list] = Query([], description="Zero or more song indexes to remove from the playlist"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Update an existing playlist"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Decode the playlist ID
        try:
            internal_playlist_id = SubsonicIDMapper.decode_playlist_id(id)
        except ValueError:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Invalid playlist ID: {id}")
        
        playlist_service = PlaylistService(db)
        playlist = playlist_service.get_playlist_by_id(internal_playlist_id)
        
        if not playlist:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Playlist not found: {id}")
        
        # Check if user has permission to update this playlist
        if playlist.user_id != user.id:
            return create_error_response(SubsonicErrorCodes.UNAUTHORIZED, "Access denied to playlist")
        
        # Update playlist attributes if provided
        if name is not None:
            playlist.name = name
        if comment is not None:
            playlist.description = comment
        if public is not None:
            # Assuming there's an is_public field, adjust as needed
            if hasattr(playlist, 'is_public'):
                playlist.is_public = public
        
        # Add tracks to playlist
        for track_id_str in songIdToAdd:
            try:
                internal_track_id = SubsonicIDMapper.decode_track_id(track_id_str)
                playlist_service.add_track_to_playlist(internal_playlist_id, internal_track_id)
            except ValueError:
                # Skip invalid track IDs
                continue
        
        # Remove tracks by index (this is more complex and may require different implementation
        # depending on how playlist tracks are stored and indexed)
        
        db.commit()
        
        # Return success response
        format_type = (f or 'xml').lower()
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "playlist": {
                "@id": id,  # Already in Subsonic format
                "@name": playlist.name,
                "@owner": user.username
            }
        }

        return SubsonicResponseFormatter.format_response(response_data, format_type)
    except Exception as e:
        db.rollback()
        return create_error_response(SubsonicErrorCodes.GENERIC, str(e))
    finally:
        db.close()


@router.get("/deletePlaylist",
            summary="Delete a playlist",
            description="Deletes a playlist.")
async def delete_playlist(
    request: Request,
    id: str = Query(..., description="The playlist ID to delete"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Delete a playlist"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Decode the playlist ID
        try:
            internal_playlist_id = SubsonicIDMapper.decode_playlist_id(id)
        except ValueError:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Invalid playlist ID: {id}")
        
        playlist_service = PlaylistService(db)
        playlist = playlist_service.get_playlist_by_id(internal_playlist_id)
        
        if not playlist:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Playlist not found: {id}")
        
        # Check if user has permission to delete this playlist
        if playlist.user_id != user.id:
            return create_error_response(SubsonicErrorCodes.UNAUTHORIZED, "Access denied to playlist")
        
        # Delete the playlist
        playlist_service.delete_playlist(internal_playlist_id)
        db.commit()
        
        # Return success response
        format_type = (f or 'xml').lower()
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True
        }

        return SubsonicResponseFormatter.format_response(response_data, format_type)
    except Exception as e:
        db.rollback()
        return create_error_response(SubsonicErrorCodes.GENERIC, str(e))
    finally:
        db.close()