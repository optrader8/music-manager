from __future__ import annotations

from typing import Annotated

from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas import PlaybackQueue, PlaybackTrack
from app.services import AlbumService, StreamingService

router = APIRouter(prefix="/stream", tags=["stream"])

QUALITY_PRESETS = {
    "original": None,
    "high": ("mp3", "320k"),
    "medium": ("mp3", "192k"),
    "low": ("mp3", "128k"),
}


@router.get("/tracks/{track_id}")
async def stream_track(
    track_id: int,
    request: Request,
    quality: Annotated[str, Query(pattern=r"^(original|high|medium|low)$")] = "original",
    db: Session = Depends(get_db),
) -> StreamingResponse:
    service = StreamingService(db)
    range_header = request.headers.get("range")

    preset = QUALITY_PRESETS.get(quality, None)
    if preset is None:
        track, file_path = service.get_track_with_file(track_id)
        iterator, start, end, file_size, content_type, partial = await service.stream_file(
            file_path, range_header
        )

        service.record_play(track)

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
    else:
        target_format, bitrate = preset
        iterator, media_type, track = await service.transcode_track(
            track_id, target_format=target_format, bitrate=bitrate
        )
        service.record_play(track)
        response = StreamingResponse(iterator, media_type=media_type)
        response.headers["Cache-Control"] = "no-store"
        response.headers["ETag"] = f"{track.file_hash}:{quality}:{bitrate}"
        response.headers["Vary"] = "Accept-Encoding"

    _apply_track_metadata(response, track, quality)
    return response


@router.get("/albums/{album_id}/queue", response_model=PlaybackQueue)
async def get_album_stream_queue(
    album_id: int,
    quality: Annotated[str, Query(pattern=r"^(original|high|medium|low)$")] = "original",
    crossfade_seconds: Annotated[int, Query(ge=0, le=15)] = 0,
    gapless: bool = Query(True),
    db: Session = Depends(get_db),
) -> PlaybackQueue:
    album_service = AlbumService(db)
    album = album_service.get_album_with_tracks(album_id)

    selected_quality = quality if quality in QUALITY_PRESETS else "original"
    tracks: list[PlaybackTrack] = []
    total_duration = 0.0

    for track in album.tracks:
        stream_url = f"/stream/tracks/{track.id}"
        if selected_quality != "original":
            stream_url = f"{stream_url}?quality={selected_quality}"

        tracks.append(
            PlaybackTrack(
                track_id=track.id,
                title=track.title,
                stream_url=stream_url,
                duration_seconds=track.duration_seconds,
                disc_number=track.disc_number,
                track_number=track.track_number,
                artist_name=track.artist.name if track.artist else None,
            )
        )

        if track.duration_seconds:
            total_duration += float(track.duration_seconds)

    return PlaybackQueue(
        album_id=album.id,
        album_title=album.title,
        quality=selected_quality,
        crossfade_seconds=crossfade_seconds,
        gapless=gapless,
        total_duration_seconds=total_duration,
        tracks=tracks,
        generated_at=datetime.utcnow(),
    )


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

    service.record_play(track)
    response = StreamingResponse(iterator, media_type=media_type)
    response.headers["Cache-Control"] = "no-store"
    response.headers["ETag"] = track.file_hash
    response.headers["Vary"] = "Accept-Encoding"
    _apply_track_metadata(response, track, f"transcode:{format}:{bitrate}")
    return response


def _apply_track_metadata(response: StreamingResponse, track, quality: str) -> None:
    response.headers["X-Track-Title"] = track.title
    if track.artist:
        response.headers["X-Track-Artist"] = track.artist.name
    if track.album:
        response.headers["X-Track-Album"] = track.album.title
    if track.duration_seconds:
        response.headers["X-Track-Duration"] = str(int(track.duration_seconds))
    response.headers["X-Audio-Quality"] = quality


__all__ = ["router"]
