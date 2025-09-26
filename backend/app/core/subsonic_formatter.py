"""Subsonic API response formatter"""
from typing import Any, Dict
from fastapi.responses import Response
import json
import xmltodict
from datetime import datetime


class SubsonicResponseFormatter:
    """Formats responses in XML or JSON according to Subsonic specification"""
    
    @staticmethod
    def format_response(data: Any, format_type: str = "xml", version: str = "1.16.1") -> Response:
        """Format data into XML or JSON response according to Subsonic spec"""
        if isinstance(format_type, str) and format_type.lower() == "json":
            return SubsonicResponseFormatter._format_json(data, version)
        else:
            return SubsonicResponseFormatter._format_xml(data, version)
    
    @staticmethod
    def format_error(error_code: int, message: str, format_type: str = "xml", version: str = "1.16.1") -> Response:
        """Format error response in XML or JSON according to Subsonic spec"""
        error_response = {
            "subsonic-response": {
                "status": "failed",
                "version": version,
                "type": "music-manager",
                "serverVersion": "1.0.0",
                "openSubsonic": True,
                "error": {"code": error_code, "message": message}
            }
        }
        return SubsonicResponseFormatter.format_response(error_response, format_type, version)
    
    @staticmethod
    def _format_json(data: Dict, version: str = "1.16.1") -> Response:
        """Format response as JSON"""
        # Make sure the response has the right structure
        if "subsonic-response" not in data:
            data = {
                "subsonic-response": {
                    "status": "ok",
                    "version": version,
                    "type": "music-manager",
                    "serverVersion": "1.0.0",
                    "openSubsonic": True,
                    **data
                }
            }
        return Response(
            content=json.dumps(data),
            media_type="application/json"
        )
    
    @staticmethod
    def _format_xml(data: Dict, version: str = "1.16.1") -> Response:
        """Format response as XML"""
        # Ensure proper structure
        if "subsonic-response" not in data:
            data = {
                "subsonic-response": {
                    "status": "ok",
                    "version": version,
                    "type": "music-manager",
                    "serverVersion": "1.0.0",
                    "openSubsonic": True,
                    **data
                }
            }
        
        # Add XML namespace
        if '@xmlns' not in data["subsonic-response"]:
            data["subsonic-response"]['@xmlns'] = "http://subsonic.org/restapi"
        
        xml_content = xmltodict.unparse(data, pretty=True)
        return Response(
            content=xml_content,
            media_type="application/xml"
        )


def format_timestamp(dt: datetime) -> str:
    """Format datetime to ISO format required by Subsonic"""
    return dt.strftime('%Y-%m-%dT%H:%M:%S.000Z')