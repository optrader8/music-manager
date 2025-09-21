from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.services import StreamingService

router = APIRouter(prefix="/stream", tags=["stream"])


@router.get("/tracks/{track_id}")
async def stream_track(
    track_id: int,
    request: Request,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    service = StreamingService(db)
    track, file_path = service.get_track_with_file(track_id)
    range_header = request.headers.get("range")

    iterator, start, end, file_size, content_type, partial = await service.stream_file(
        file_path, range_header
    )

    status_code = status.HTTP_206_PARTIAL_CONTENT if partial else status.HTTP_200_OK
    response = StreamingResponse(iterator, media_type=content_type, status_code=status_code)
    content_length = max(0, end - start + 1) if file_size else file_size
    response.headers["Accept-Ranges"] = "bytes"
    response.headers["Content-Length"] = str(content_length)
    response.headers["Cache-Control"] = "public, max-age=60"
    response.headers["ETag"] = track.file_hash
    response.headers["Vary"] = "Accept-Encoding"
    if partial and file_size:
        response.headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"

    return response


@router.get("/tracks/{track_id}/transcode")
async def transcode_track(
    track_id: int,
    format: Annotated[str, Query(alias="format", pattern=r"^(mp3|aac|ogg|flac|wav)$")]="mp3",
    bitrate: Annotated[str, Query(pattern=r"^\d+k$")]="192k",
    db: Session = Depends(get_db),
) -> StreamingResponse:
    service = StreamingService(db)
    iterator, media_type, track = await service.transcode_track(
        track_id, target_format=format, bitrate=bitrate
    )

    response = StreamingResponse(iterator, media_type=media_type)
    response.headers["Cache-Control"] = "no-store"
    response.headers["ETag"] = track.file_hash
    response.headers["Vary"] = "Accept-Encoding"
    return response


__all__ = ["router"]
