"""Subsonic API streaming endpoints"""
from fastapi import APIRouter, Request, Query, HTTPException, Response, BackgroundTasks
from typing import Optional
import os
from fastapi.responses import FileResponse
import mimetypes

from app.core.subsonic_errors import SubsonicError, SubsonicErrorCodes, create_error_response
from app.core.subsonic_auth import get_current_subsonic_user
from app.services.subsonic_service import SubsonicService
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.services.subsonic_id_mapper import SubsonicIDMapper
from app.services.track_service import TrackService

router = APIRouter()


def range_request_handler(file_path: str, request: Request):
    """Handle HTTP range requests for streaming"""
    file_size = os.path.getsize(file_path)
    range_header = request.headers.get('range')
    
    if not range_header:
        # No range request, return the entire file
        return FileResponse(
            path=file_path,
            media_type='audio/mpeg',  # Default, will be overridden
            headers={
                'Accept-Ranges': 'bytes',
                'Content-Length': str(file_size)
            }
        )
    
    # Parse range header: "bytes=start-end"
    try:
        range_str = range_header.replace('bytes=', '')
        start_str, end_str = range_str.split('-')
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1
        
        # Ensure valid range
        if start >= file_size:
            raise HTTPException(status_code=416, detail="Range not satisfiable")
        if end >= file_size:
            end = file_size - 1
        
        chunk_size = end - start + 1
        
        # Read the requested chunk
        with open(file_path, 'rb') as f:
            f.seek(start)
            data = f.read(chunk_size)
        
        response = Response(
            content=data,
            status_code=206,  # Partial content
            media_type=mimetypes.guess_type(file_path)[0] or 'audio/mpeg',
            headers={
                'Content-Range': f'bytes {start}-{end}/{file_size}',
                'Accept-Ranges': 'bytes',
                'Content-Length': str(chunk_size),
            }
        )
        return response
    except ValueError:
        # Invalid range format, return full file
        return FileResponse(
            path=file_path,
            media_type=mimetypes.guess_type(file_path)[0] or 'audio/mpeg',
            headers={
                'Accept-Ranges': 'bytes',
                'Content-Length': str(file_size)
            }
        )


@router.get("/stream",
            summary="Stream audio file",
            description="Streams an audio file with support for HTTP range requests.")
async def stream(
    request: Request,
    id: str = Query(..., description="The track ID"),
    maxBitRate: Optional[int] = Query(None, description="Max bitrate in Kbps"),
    format: Optional[str] = Query(None, description="Output format (mp3, flv, etc)"),
    timeOffset: Optional[int] = Query(None, description="Start position in seconds"),
    size: Optional[str] = Query(None, description="Video size for video files"),
    estimateContentLength: Optional[bool] = Query(None, description="Estimate content length"),
    converted: Optional[bool] = Query(None, description="For transcoded media")
):
    """Stream an audio file"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Decode track ID
        try:
            internal_track_id = SubsonicIDMapper.decode_track_id(id)
        except ValueError:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Invalid track ID format: {id}")
        
        # Get the track from the database
        track_service = TrackService(db)
        track = track_service.get_track_by_id(internal_track_id)
        
        if not track or not track.file_path or not os.path.exists(track.file_path):
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Track not found: {id}")
        
        # Check if the file exists and is accessible
        if not os.path.exists(track.file_path):
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"File not found: {track.file_path}")
        
        # Determine the media type based on file extension
        mime_type, _ = mimetypes.guess_type(track.file_path)
        if not mime_type:
            # Default to audio/mpeg if we can't determine the type
            mime_type = 'audio/mpeg'
        
        # Handle range requests for seeking support
        return range_request_handler(track.file_path, request)
        
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    except Exception as e:
        return create_error_response(SubsonicErrorCodes.GENERIC, str(e))
    finally:
        db.close()


@router.get("/download",
            summary="Download audio file",
            description="Downloads an audio file (similar to stream but typically without range support).")
async def download(
    request: Request,
    id: str = Query(..., description="The track ID")
):
    """Download an audio file"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Decode track ID
        try:
            internal_track_id = SubsonicIDMapper.decode_track_id(id)
        except ValueError:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Invalid track ID format: {id}")
        
        # Get the track from the database
        track_service = TrackService(db)
        track = track_service.get_track_by_id(internal_track_id)
        
        if not track or not track.file_path or not os.path.exists(track.file_path):
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Track not found: {id}")
        
        # Check if the file exists and is accessible
        if not os.path.exists(track.file_path):
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"File not found: {track.file_path}")
        
        # Return the file for download
        return FileResponse(
            path=track.file_path,
            media_type='application/octet-stream',  # Generic binary file
            filename=os.path.basename(track.file_path)
        )
        
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    except Exception as e:
        return create_error_response(SubsonicErrorCodes.GENERIC, str(e))
    finally:
        db.close()