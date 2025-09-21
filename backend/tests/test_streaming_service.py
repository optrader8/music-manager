from __future__ import annotations

import asyncio
from collections import deque
from collections.abc import AsyncGenerator, Generator
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import Track
from app.main import app
from app.services.streaming_service import StreamingService


@pytest.fixture()
def session(tmp_path) -> Generator[Session, None, None]:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    Base.metadata.create_all(engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def create_track(session: Session, file_path: Path, *, title: str = "Test", file_hash: str = "hash") -> Track:
    track = Track(title=title, file_path=str(file_path), file_hash=file_hash)
    session.add(track)
    session.commit()
    session.refresh(track)
    return track


@pytest.mark.asyncio
async def test_stream_file_reads_full_content(session: Session, tmp_path: Path) -> None:
    audio_bytes = b"0123456789"
    file_path = tmp_path / "song.mp3"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(audio_bytes)

    track = create_track(session, file_path)
    service = StreamingService(session, chunk_size=4)

    _, path = service.get_track_with_file(track.id)
    iterator, start, end, file_size, content_type, partial = await service.stream_file(path)

    assert start == 0
    assert end == len(audio_bytes) - 1
    assert file_size == len(audio_bytes)
    assert content_type == "audio/mpeg"
    assert partial is False

    collected = bytearray()
    async for chunk in iterator:
        collected.extend(chunk)

    assert collected == audio_bytes


@pytest.mark.asyncio
async def test_stream_file_respects_range_header(session: Session, tmp_path: Path) -> None:
    audio_bytes = b"abcdefghij"
    file_path = tmp_path / "song.flac"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(audio_bytes)

    track = create_track(session, file_path)
    service = StreamingService(session, chunk_size=3)

    _, path = service.get_track_with_file(track.id)
    iterator, start, end, file_size, content_type, partial = await service.stream_file(
        path, "bytes=2-6"
    )

    assert (start, end) == (2, 6)
    assert partial is True
    assert file_size == len(audio_bytes)
    assert content_type == "audio/flac"

    collected = bytearray()
    async for chunk in iterator:
        collected.extend(chunk)

    assert collected == audio_bytes[2:7]


class DummyStream:
    def __init__(self, chunks: list[bytes]):
        self._chunks = deque(chunks)

    async def read(self, _size: int = -1) -> bytes:
        if self._chunks:
            return self._chunks.popleft()
        return b""


class DummyProcess:
    def __init__(self, stdout_chunks: list[bytes], returncode: int = 0):
        self.stdout = DummyStream(stdout_chunks)
        self.stderr = DummyStream([b""])
        self._returncode = None
        self._final_code = returncode

    @property
    def returncode(self) -> int | None:
        return self._returncode

    async def wait(self) -> int:
        self._returncode = self._final_code
        return self._final_code

    def kill(self) -> None:
        self._final_code = -9
        self._returncode = self._final_code


@pytest.mark.asyncio
async def test_transcode_track_streams_from_ffmpeg(monkeypatch, session: Session, tmp_path: Path) -> None:
    audio_bytes = b"data"
    file_path = tmp_path / "song.ogg"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(audio_bytes)

    track = create_track(session, file_path)
    service = StreamingService(session, chunk_size=2)

    async def fake_exec(*args, **kwargs):
        return DummyProcess([b"AA", b"BB"], returncode=0)

    monkeypatch.setattr(asyncio, "create_subprocess_exec", fake_exec)

    iterator, media_type, result_track = await service.transcode_track(
        track.id, target_format="mp3", bitrate="128k"
    )

    assert media_type == "audio/mpeg"
    assert result_track.id == track.id

    output = bytearray()
    async for chunk in iterator:
        output.extend(chunk)

    assert output == b"AABB"


@pytest.mark.asyncio
async def test_transcode_track_raises_on_failure(monkeypatch, session: Session, tmp_path: Path) -> None:
    file_path = tmp_path / "song.ogg"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(b"data")

    track = create_track(session, file_path)
    service = StreamingService(session)

    async def fake_exec(*args, **kwargs):
        return DummyProcess([b""], returncode=1)

    monkeypatch.setattr(asyncio, "create_subprocess_exec", fake_exec)

    iterator, _, _ = await service.transcode_track(track.id, target_format="mp3", bitrate="128k")

    with pytest.raises(HTTPException):
        async for _chunk in iterator:
            pass


@pytest.fixture()
def streaming_client(tmp_path) -> Generator[tuple[TestClient, sessionmaker, Path], None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    Base.metadata.create_all(engine)

    from app.core.dependencies import get_db

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client, TestingSessionLocal, tmp_path

    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)


def test_stream_track_endpoint_supports_range(streaming_client) -> None:
    client, session_factory, tmp_path = streaming_client
    audio_bytes = b"hello world"
    file_path = tmp_path / "song.mp3"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(audio_bytes)

    with session_factory() as db:
        track = Track(title="Song", file_path=str(file_path), file_hash="etag123")
        db.add(track)
        db.commit()
        db.refresh(track)
        track_id = track.id

    response = client.get(f"/stream/tracks/{track_id}", headers={"Range": "bytes=0-4"})

    assert response.status_code == 206
    assert response.content == audio_bytes[:5]
    assert response.headers["Content-Range"] == f"bytes 0-4/{len(audio_bytes)}"
    assert response.headers["ETag"] == "etag123"


def test_transcode_endpoint_uses_service(streaming_client, monkeypatch) -> None:
    client, session_factory, tmp_path = streaming_client
    file_path = tmp_path / "song.ogg"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(b"data")

    with session_factory() as db:
        track = Track(title="Song", file_path=str(file_path), file_hash="hash123")
        db.add(track)
        db.commit()
        db.refresh(track)
        track_id = track.id

    async def fake_transcode(self, track_id: int, *, target_format: str = "mp3", bitrate: str = "192k"):
        track = StreamingService.get_track(self, track_id)

        async def iterator() -> AsyncGenerator[bytes, None]:
            yield b"xyz"

        return iterator(), "audio/mpeg", track

    monkeypatch.setattr(StreamingService, "transcode_track", fake_transcode)

    response = client.get(f"/stream/tracks/{track_id}/transcode?format=mp3&bitrate=128k")

    assert response.status_code == 200
    assert response.content == b"xyz"
    assert response.headers["Cache-Control"] == "no-store"
    assert response.headers["ETag"] == "hash123"
