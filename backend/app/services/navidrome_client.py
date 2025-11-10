"""Navidrome SubSonic API Client"""
import hashlib
import secrets
from typing import List, Optional, Dict, Any
from datetime import datetime
import requests
from pydantic import BaseModel


class NavidromeTrack(BaseModel):
    """Navidrome track model"""
    id: str
    title: str
    artist: Optional[str] = None
    album: Optional[str] = None
    album_id: Optional[str] = None
    artist_id: Optional[str] = None
    duration: Optional[int] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    cover_art: Optional[str] = None
    track: Optional[int] = None
    disc_number: Optional[int] = None
    created: Optional[datetime] = None


class NavidromeAlbum(BaseModel):
    """Navidrome album model"""
    id: str
    name: str
    artist: Optional[str] = None
    artist_id: Optional[str] = None
    song_count: Optional[int] = None
    duration: Optional[int] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    cover_art: Optional[str] = None
    created: Optional[datetime] = None
    play_count: Optional[int] = None


class NavidromeArtist(BaseModel):
    """Navidrome artist model"""
    id: str
    name: str
    album_count: Optional[int] = None
    cover_art: Optional[str] = None


class NavidromeClient:
    """
    Navidrome SubSonic API Client

    Connects to a Navidrome server and fetches music data via SubSonic API.
    """

    def __init__(self, base_url: str, username: str, password: str):
        """
        Initialize Navidrome client

        Args:
            base_url: Navidrome server URL (e.g., https://nas-1.parrot-mine.ts.net)
            username: Navidrome username
            password: Navidrome password
        """
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.password = password
        self.api_version = "1.16.1"
        self.client_name = "MusicManager"

    def _generate_auth_params(self) -> Dict[str, str]:
        """
        Generate authentication parameters for SubSonic API

        Uses token-based authentication (MD5 hash of password + salt)
        """
        salt = secrets.token_hex(16)
        token = hashlib.md5((self.password + salt).encode()).hexdigest()

        return {
            "u": self.username,
            "t": token,
            "s": salt,
            "v": self.api_version,
            "c": self.client_name,
            "f": "json"
        }

    def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make a request to Navidrome SubSonic API

        Args:
            endpoint: API endpoint (e.g., "getAlbumList2")
            params: Additional query parameters

        Returns:
            JSON response data

        Raises:
            requests.RequestException: If request fails
            ValueError: If API returns error status
        """
        url = f"{self.base_url}/rest/{endpoint}"

        # Merge auth params with additional params
        request_params = self._generate_auth_params()
        if params:
            request_params.update(params)

        response = requests.get(url, params=request_params, timeout=30)
        response.raise_for_status()

        data = response.json()
        subsonic_response = data.get("subsonic-response", {})

        # Check for API errors
        status = subsonic_response.get("status")
        if status != "ok":
            error = subsonic_response.get("error", {})
            error_message = error.get("message", "Unknown error")
            raise ValueError(f"Navidrome API error: {error_message}")

        return subsonic_response

    def ping(self) -> bool:
        """
        Test connection to Navidrome server

        Returns:
            True if connection successful
        """
        try:
            self._make_request("ping")
            return True
        except Exception:
            return False

    def get_albums(
        self,
        type: str = "alphabeticalByName",
        size: int = 500,
        offset: int = 0,
        from_year: Optional[int] = None,
        to_year: Optional[int] = None,
        genre: Optional[str] = None
    ) -> List[NavidromeAlbum]:
        """
        Get album list from Navidrome

        Args:
            type: Album list type (newest, frequent, recent, alphabeticalByName, etc.)
            size: Number of albums to return (max 500)
            offset: Offset for pagination
            from_year: Filter by year range start
            to_year: Filter by year range end
            genre: Filter by genre

        Returns:
            List of albums
        """
        params = {
            "type": type,
            "size": min(size, 500),
            "offset": offset
        }

        if from_year:
            params["fromYear"] = from_year
        if to_year:
            params["toYear"] = to_year
        if genre:
            params["genre"] = genre

        response = self._make_request("getAlbumList2", params)
        album_list = response.get("albumList2", {}).get("album", [])

        albums = []
        for album_data in album_list:
            album = NavidromeAlbum(
                id=album_data.get("id"),
                name=album_data.get("name"),
                artist=album_data.get("artist"),
                artist_id=album_data.get("artistId"),
                song_count=album_data.get("songCount"),
                duration=album_data.get("duration"),
                year=album_data.get("year"),
                genre=album_data.get("genre"),
                cover_art=album_data.get("coverArt"),
                created=datetime.fromisoformat(album_data["created"].replace("Z", "+00:00"))
                if album_data.get("created") else None,
                play_count=album_data.get("playCount", 0)
            )
            albums.append(album)

        return albums

    def get_album(self, album_id: str) -> Optional[NavidromeAlbum]:
        """
        Get album details with tracks

        Args:
            album_id: Navidrome album ID

        Returns:
            Album with track list, or None if not found
        """
        try:
            response = self._make_request("getAlbum", {"id": album_id})
            album_data = response.get("album", {})

            album = NavidromeAlbum(
                id=album_data.get("id"),
                name=album_data.get("name"),
                artist=album_data.get("artist"),
                artist_id=album_data.get("artistId"),
                song_count=album_data.get("songCount"),
                duration=album_data.get("duration"),
                year=album_data.get("year"),
                genre=album_data.get("genre"),
                cover_art=album_data.get("coverArt"),
                created=datetime.fromisoformat(album_data["created"].replace("Z", "+00:00"))
                if album_data.get("created") else None,
                play_count=album_data.get("playCount", 0)
            )

            return album
        except Exception:
            return None

    def get_artists(self) -> List[NavidromeArtist]:
        """
        Get all artists from Navidrome

        Returns:
            List of artists
        """
        response = self._make_request("getArtists")
        artists_data = response.get("artists", {}).get("index", [])

        artists = []
        for index in artists_data:
            for artist_data in index.get("artist", []):
                artist = NavidromeArtist(
                    id=artist_data.get("id"),
                    name=artist_data.get("name"),
                    album_count=artist_data.get("albumCount"),
                    cover_art=artist_data.get("coverArt")
                )
                artists.append(artist)

        return artists

    def get_cover_art_url(self, cover_art_id: str, size: int = 300) -> str:
        """
        Get cover art URL for an album/artist

        Args:
            cover_art_id: Cover art ID from Navidrome
            size: Desired size in pixels

        Returns:
            Full URL to cover art image
        """
        auth_params = self._generate_auth_params()
        auth_params["id"] = cover_art_id
        auth_params["size"] = str(size)

        params_str = "&".join(f"{k}={v}" for k, v in auth_params.items())
        return f"{self.base_url}/rest/getCoverArt?{params_str}"

    def search(
        self,
        query: str,
        artist_count: int = 20,
        album_count: int = 20,
        song_count: int = 20
    ) -> Dict[str, List]:
        """
        Search for artists, albums, and songs

        Args:
            query: Search query
            artist_count: Max artists to return
            album_count: Max albums to return
            song_count: Max songs to return

        Returns:
            Dictionary with 'artists', 'albums', 'songs' keys
        """
        params = {
            "query": query,
            "artistCount": artist_count,
            "albumCount": album_count,
            "songCount": song_count
        }

        response = self._make_request("search3", params)
        search_result = response.get("searchResult3", {})

        return {
            "artists": search_result.get("artist", []),
            "albums": search_result.get("album", []),
            "songs": search_result.get("song", [])
        }


def create_navidrome_client(base_url: str, username: str, password: str) -> Optional[NavidromeClient]:
    """
    Factory function to create and test Navidrome client

    Args:
        base_url: Navidrome server URL
        username: Username
        password: Password

    Returns:
        NavidromeClient instance if connection successful, None otherwise
    """
    try:
        client = NavidromeClient(base_url, username, password)
        if client.ping():
            return client
        return None
    except Exception as e:
        print(f"Failed to connect to Navidrome: {e}")
        return None
