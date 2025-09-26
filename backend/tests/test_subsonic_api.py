"""Subsonic API tests"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import get_db
from app.core.subsonic_auth import SubsonicAuthMiddleware
from app.services.subsonic_id_mapper import SubsonicIDMapper
from app.core.subsonic_errors import SubsonicError, SubsonicErrorCodes


# Test client setup
client = TestClient(app)


@pytest.fixture
def mock_db_session():
    """Mock database session for testing"""
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_subsonic_id_mapper():
    """Test Subsonic ID mapping functions"""
    # Test artist ID encoding/decoding
    artist_id = 123
    encoded_artist = SubsonicIDMapper.encode_artist_id(artist_id)
    assert encoded_artist == "ar-123"
    decoded_artist = SubsonicIDMapper.decode_artist_id(encoded_artist)
    assert decoded_artist == artist_id
    
    # Test album ID encoding/decoding
    album_id = 456
    encoded_album = SubsonicIDMapper.encode_album_id(album_id)
    assert encoded_album == "al-456"
    decoded_album = SubsonicIDMapper.decode_album_id(encoded_album)
    assert decoded_album == album_id
    
    # Test track ID encoding/decoding
    track_id = 789
    encoded_track = SubsonicIDMapper.encode_track_id(track_id)
    assert encoded_track == "tr-789"
    decoded_track = SubsonicIDMapper.decode_track_id(encoded_track)
    assert decoded_track == track_id
    
    # Test playlist ID encoding/decoding
    playlist_id = 101
    encoded_playlist = SubsonicIDMapper.encode_playlist_id(playlist_id)
    assert encoded_playlist == "pl-101"
    decoded_playlist = SubsonicIDMapper.decode_playlist_id(encoded_playlist)
    assert decoded_playlist == playlist_id
    
    # Test cover art ID generation
    cover_art_id = SubsonicIDMapper.get_cover_art_id(album_id)
    assert cover_art_id == "al-456"


def test_subsonic_error_codes():
    """Test Subsonic error codes"""
    from app.core.subsonic_errors import SubsonicErrorCodes
    
    # Test that all expected error codes exist
    assert hasattr(SubsonicErrorCodes, 'GENERIC')
    assert hasattr(SubsonicErrorCodes, 'MISSING_PARAMETER')
    assert hasattr(SubsonicErrorCodes, 'WRONG_CREDENTIALS')
    assert hasattr(SubsonicErrorCodes, 'DATA_NOT_FOUND')
    
    # Test specific values
    assert SubsonicErrorCodes.GENERIC == 0
    assert SubsonicErrorCodes.MISSING_PARAMETER == 10
    assert SubsonicErrorCodes.WRONG_CREDENTIALS == 40
    assert SubsonicErrorCodes.DATA_NOT_FOUND == 70


def test_subsonic_error_exception():
    """Test SubsonicError exception"""
    error = SubsonicError(SubsonicErrorCodes.DATA_NOT_FOUND, "Test message")
    assert error.code == SubsonicErrorCodes.DATA_NOT_FOUND
    assert error.message == "Test message"
    assert "Subsonic Error 70: Test message" in str(error)


def test_auth_middleware_validate_api_version():
    """Test API version validation in auth middleware"""
    # Valid version
    assert SubsonicAuthMiddleware.validate_api_version("1.16.1") is True
    assert SubsonicAuthMiddleware.validate_api_version("2.0.0") is True
    
    # Invalid versions
    assert SubsonicAuthMiddleware.validate_api_version("0.9.0") is False  # Version < 1.x
    assert SubsonicAuthMiddleware.validate_api_version("invalid") is False


def test_ping_endpoint():
    """Test ping endpoint (doesn't require authentication)"""
    # Note: This test would require mocking the authentication behavior
    # or setting up a test environment that bypasses auth for ping
    pass


def test_format_timestamp():
    """Test timestamp formatting"""
    from datetime import datetime
    from app.core.subsonic_formatter import SubsonicResponseFormatter
    
    dt = datetime(2023, 6, 15, 10, 30, 45)
    formatted = SubsonicResponseFormatter.format_timestamp(dt)
    assert formatted == "2023-06-15T10:30:45.000Z"


if __name__ == "__main__":
    pytest.main()