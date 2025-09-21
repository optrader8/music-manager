from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_session
from app.db.models import User
from app.services.streaming_service import StreamingService

router = APIRouter(prefix="/stream", tags=["streaming"])


@router.get("/track/{track_id}")
async def stream_track(
    track_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Stream a track by ID with range request support."""
    streaming_service = StreamingService(session)

    # Get the track file path
    file_path = await streaming_service.get_track_file(track_id)

    # Get range header if present
    range_header = request.headers.get("range")

    # Stream the file
    file_obj, start, end, content_type = await streaming_service.stream_file(
        file_path, range_header
    )

    file_size = file_path.stat().st_size
    content_length = end - start + 1

    headers = {
        "Content-Type": content_type,
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
    }

    if range_header:
        headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
        status_code = 206  # Partial Content
    else:
        status_code = 200

    async def iterfile():
        remaining = content_length
        while remaining > 0:
            chunk_size = min(8192, remaining)
            chunk = await file_obj.read(chunk_size)
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk
        await file_obj.close()

    return StreamingResponse(
        iterfile(),
        status_code=status_code,
        headers=headers,
        media_type=content_type,
    )