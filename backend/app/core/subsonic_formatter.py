"""Subsonic API response formatter"""
from typing import Any, Dict, Union
from fastapi.responses import Response
import json
import xmltodict
from datetime import datetime


class SubsonicResponseFormatter:
    """Formats responses in XML or JSON according to Subsonic specification"""
    
    @staticmethod
    def format_response(data: Union[Dict, str], format_type: str = "xml", version: str = "1.16.1") -> Response:
        """Format data into XML or JSON response according to Subsonic spec"""
        format_type = format_type.lower() if format_type else "xml"
        
        if format_type == "json":
            return SubsonicResponseFormatter._format_json_response(data, version)
        else:  # XML format
            return SubsonicResponseFormatter._format_xml_response(data, version)
    
    @staticmethod
    def format_error(error_code: int, message: str, format_type: str = "xml", version: str = "1.16.1") -> Response:
        """Format error response in XML or JSON according to Subsonic spec"""
        response_data = {
            "status": "failed",
            "version": version,
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "error": {"code": error_code, "message": message}
        }
        return SubsonicResponseFormatter.format_response(response_data, format_type, version)
    
    @staticmethod
    def _format_json_response(data: Union[Dict, str], version: str = "1.16.1") -> Response:
        """Format response as JSON"""
        # Ensure proper structure
        if not isinstance(data, dict) or "status" not in data:
            # If it doesn't have the expected format, wrap it properly
            response_body = {
                "status": "ok",
                "version": version,
                "type": "music-manager",
                "serverVersion": "1.0.0",
                "openSubsonic": True,
                **(data if isinstance(data, dict) else {})
            }
        else:
            response_body = data
        
        # Create the complete response with the subsonic-response wrapper
        full_response = {"subsonic-response": response_body}
        
        return Response(
            content=json.dumps(full_response),
            media_type="application/json"
        )
    
    @staticmethod
    def _format_xml_response(data: Union[Dict, str], version: str = "1.16.1") -> Response:
        """Format response as XML"""
        # Ensure proper structure
        if not isinstance(data, dict) or "status" not in data:
            # If it doesn't have the expected format, wrap it properly
            response_body = {
                "status": "ok",
                "version": version,
                "type": "music-manager",
                "serverVersion": "1.0.0",
                "openSubsonic": True,
                **(data if isinstance(data, dict) else {})
            }
        else:
            response_body = data
        
        # Create the complete response with the subsonic-response wrapper
        full_response = {
            "subsonic-response": {
                **response_body,
                "@xmlns": "http://subsonic.org/restapi"
            }
        }
        
        # Convert to XML
        xml_content = xmltodict.unparse(full_response, pretty=True)
        return Response(
            content=xml_content,
            media_type="application/xml"
        )

    @staticmethod
    def format_timestamp(dt: datetime) -> str:
        """Format datetime to ISO format required by Subsonic"""
        return dt.strftime('%Y-%m-%dT%H:%M:%S.000Z')

    @staticmethod
    def prepare_index_data(indexes: list) -> list:
        """Prepare index data for response formatting"""
        result = []
        for idx in indexes:
            index_entry = {
                "@name": idx.get("name", ""),
                "artist": idx.get("artist", [])
            }
            result.append(index_entry)
        return result

    @staticmethod
    def prepare_artist_data(artists: list) -> list:
        """Prepare artist data for response formatting"""
        result = []
        for artist in artists:
            artist_entry = {
                "@id": artist.get("id", ""),
                "@name": artist.get("name", ""),
                "@albumCount": artist.get("albumCount", 0),
                "@coverArt": artist.get("coverArt"),
                "@starred": SubsonicResponseFormatter.format_timestamp(artist["starred"]) if artist.get("starred") else None
            }
            # Remove None values
            artist_entry = {k: v for k, v in artist_entry.items() if v is not None}
            result.append(artist_entry)
        return result

    @staticmethod
    def prepare_album_data(albums: list) -> list:
        """Prepare album data for response formatting"""
        result = []
        for album in albums:
            album_entry = {
                "@id": album.get("id", ""),
                "@name": album.get("name", ""),
                "@artist": album.get("artist", ""),
                "@artistId": album.get("artistId", ""),
                "@coverArt": album.get("coverArt"),
                "@songCount": album.get("songCount", 0),
                "@duration": album.get("duration", 0),
                "@playCount": album.get("playCount", 0),
                "@created": SubsonicResponseFormatter.format_timestamp(album["created"]) if album.get("created") else None,
                "@year": album.get("year"),
                "@genre": album.get("genre")
            }
            # Remove None values
            album_entry = {k: v for k, v in album_entry.items() if v is not None}
            result.append(album_entry)
        return result

    @staticmethod
    def prepare_track_data(tracks: list) -> list:
        """Prepare track data for response formatting"""
        result = []
        for track in tracks:
            track_entry = {
                "@id": track.get("id", ""),
                "@parent": track.get("parent", ""),
                "@title": track.get("title", ""),
                "@album": track.get("album", ""),
                "@artist": track.get("artist", ""),
                "@track": track.get("track"),
                "@year": track.get("year"),
                "@genre": track.get("genre"),
                "@coverArt": track.get("coverArt"),
                "@size": track.get("size", 0),
                "@contentType": track.get("contentType", ""),
                "@suffix": track.get("suffix", ""),
                "@duration": track.get("duration"),
                "@bitRate": track.get("bitRate"),
                "@path": track.get("path", ""),
                "@playCount": track.get("playCount", 0),
                "@discNumber": track.get("discNumber"),
                "@created": SubsonicResponseFormatter.format_timestamp(track["created"]) if track.get("created") else None,
                "@albumId": track.get("albumId"),
                "@artistId": track.get("artistId"),
                "@type": track.get("type", "music")
            }
            # Remove None values
            track_entry = {k: v for k, v in track_entry.items() if v is not None}
            result.append(track_entry)
        return result


# Backwards compatibility alias
def format_timestamp(dt: datetime) -> str:
    """Format datetime to ISO format required by Subsonic"""
    return SubsonicResponseFormatter.format_timestamp(dt)