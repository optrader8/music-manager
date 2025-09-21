from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

import pytest

from app.db.base import Base
from app.db.models import Track
from app.services.file_scanner_service import FileScannerService


@pytest.fixture()
def temp_session(tmp_path) -> Generator:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    Base.metadata.create_all(engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


class DummyInfo:
    def __init__(self, length: float | None = None, bitrate: int | None = None, sample_rate: int | None = None):
        self.length = length
        self.bitrate = bitrate
        self.sample_rate = sample_rate


class DummyAudio:
    def __init__(self, tags: dict[str, list[str] | str] | None = None, info: DummyInfo | None = None):
        self.tags = tags or {}
        self.info = info


@pytest.fixture(autouse=True)
def patch_mutagen(monkeypatch):
    def fake_file(path: Path, easy: bool = True):  # noqa: ARG001 - signature matches mutagen.File
        metadata = {
            "title": ["Test Track"],
            "artist": ["Test Artist"],
            "album": ["Test Album"],
            "genre": ["Electronic"],
            "date": ["2024"],
            "tracknumber": ["1/10"],
            "discnumber": ["1"],
        }
        return DummyAudio(tags=metadata, info=DummyInfo(length=180.5, bitrate=320000, sample_rate=44100))

    monkeypatch.setattr("app.services.file_scanner_service.mutagen.File", fake_file)


def create_audio_file(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)


def test_scan_creates_new_tracks(tmp_path: Path, temp_session) -> None:
    library_path = tmp_path / "library"
    file_path = library_path / "test" / "track.mp3"
    create_audio_file(file_path, b"audio-data")

    service = FileScannerService(temp_session, library_path)
    result = service.scan()

    assert result.scanned_files == 1
    assert result.created_tracks == 1
    assert result.updated_tracks == 0
    assert result.skipped_files == 0
    assert result.duplicates == []

    track = temp_session.query(Track).one()
    assert track.title == "Test Track"
    assert track.artist.name == "Test Artist"
    assert track.album.title == "Test Album"
    assert track.duration_seconds == pytest.approx(180.5)
    assert track.track_number == 1


def test_scan_updates_existing_tracks(tmp_path: Path, temp_session, monkeypatch) -> None:
    library_path = tmp_path / "library"
    file_path = library_path / "track.flac"
    create_audio_file(file_path, b"audio-data")

    service = FileScannerService(temp_session, library_path)
    service.scan()

    def fake_file_updated(path: Path, easy: bool = True):
        metadata = {
            "title": ["Updated Track"],
            "artist": ["Test Artist"],
            "album": ["Updated Album"],
        }
        return DummyAudio(tags=metadata, info=DummyInfo(length=200, bitrate=256000, sample_rate=44100))

    monkeypatch.setattr("app.services.file_scanner_service.mutagen.File", fake_file_updated)
    result = service.scan()

    assert result.updated_tracks == 1

    track = temp_session.query(Track).one()
    assert track.title == "Updated Track"
    assert track.album.title == "Updated Album"
    assert track.duration_seconds == pytest.approx(200)


def test_scan_detects_duplicates(tmp_path: Path, temp_session) -> None:
    library_path = tmp_path / "library"
    file_a = library_path / "track1.m4a"
    file_b = library_path / "duplicates" / "track1_copy.m4a"

    content = b"duplicate-audio"
    create_audio_file(file_a, content)
    create_audio_file(file_b, content)

    service = FileScannerService(temp_session, library_path)
    first_result = service.scan()
    assert first_result.created_tracks == 1

    second_result = service.scan()

    assert second_result.skipped_files == 1
    assert len(second_result.duplicates) == 1
    duplicate = second_result.duplicates[0]
    assert duplicate.duplicate_path == file_b
