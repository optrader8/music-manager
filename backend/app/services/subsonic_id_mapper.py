"""Subsonic ID mapping utilities"""
from typing import Tuple


class SubsonicIDMapper:
    """Maps internal database IDs to Subsonic-compatible string IDs"""
    
    @staticmethod
    def encode_artist_id(internal_id: int) -> str:
        """Encode internal artist ID to Subsonic format"""
        return f"ar-{internal_id}"
    
    @staticmethod
    def decode_artist_id(subsonic_id: str) -> int:
        """Decode Subsonic artist ID to internal format"""
        if not subsonic_id.startswith("ar-"):
            raise ValueError(f"Invalid artist ID format: {subsonic_id}")
        return int(subsonic_id[3:])
    
    @staticmethod
    def encode_album_id(internal_id: int) -> str:
        """Encode internal album ID to Subsonic format"""
        return f"al-{internal_id}"
    
    @staticmethod
    def decode_album_id(subsonic_id: str) -> int:
        """Decode Subsonic album ID to internal format"""
        if not subsonic_id.startswith("al-"):
            raise ValueError(f"Invalid album ID format: {subsonic_id}")
        return int(subsonic_id[3:])
    
    @staticmethod
    def encode_track_id(internal_id: int) -> str:
        """Encode internal track ID to Subsonic format"""
        return f"tr-{internal_id}"
    
    @staticmethod
    def decode_track_id(subsonic_id: str) -> int:
        """Decode Subsonic track ID to internal format"""
        if not subsonic_id.startswith("tr-"):
            raise ValueError(f"Invalid track ID format: {subsonic_id}")
        return int(subsonic_id[3:])
    
    @staticmethod
    def encode_playlist_id(internal_id: int) -> str:
        """Encode internal playlist ID to Subsonic format"""
        return f"pl-{internal_id}"
    
    @staticmethod
    def decode_playlist_id(subsonic_id: str) -> int:
        """Decode Subsonic playlist ID to internal format"""
        if not subsonic_id.startswith("pl-"):
            raise ValueError(f"Invalid playlist ID format: {subsonic_id}")
        return int(subsonic_id[3:])
    
    @staticmethod
    def get_cover_art_id(album_id: int) -> str:
        """Get cover art ID based on album ID"""
        return f"al-{album_id}"
    
    @staticmethod
    def decode_id(subsonic_id: str) -> Tuple[str, int]:
        """Decode any Subsonic ID to prefix and internal ID"""
        if "-" not in subsonic_id:
            raise ValueError(f"Invalid ID format: {subsonic_id}")
        prefix, internal_id = subsonic_id.split("-", 1)
        return prefix, int(internal_id)