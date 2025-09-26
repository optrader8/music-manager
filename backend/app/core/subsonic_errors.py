"""Subsonic API error handling utilities"""
from typing import Dict
from fastapi import HTTPException
from enum import IntEnum


class SubsonicErrorCodes(IntEnum):
    """Subsonic error codes as defined in the specification"""
    GENERIC = 0
    MISSING_PARAMETER = 10
    INCOMPATIBLE_VERSION_CLIENT = 20
    INCOMPATIBLE_VERSION_SERVER = 30
    WRONG_CREDENTIALS = 40
    TOKEN_AUTH_NOT_SUPPORTED = 41
    UNAUTHORIZED = 50
    SERVER_LICENSE_EXPIRED = 60
    DATA_NOT_FOUND = 70


class SubsonicError(Exception):
    """Custom exception for Subsonic API errors"""
    def __init__(self, code: SubsonicErrorCodes, message: str):
        self.code = code
        self.message = message
        super().__init__(f"Subsonic Error {code}: {message}")


def create_error_response(code: SubsonicErrorCodes, message: str):
    """Create a standard Subsonic error response"""
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=200,  # Subsonic returns 200 even for errors
        content={
            "subsonic-response": {
                "status": "failed",
                "version": "1.16.1",
                "type": "music-manager",
                "serverVersion": "1.0.0",
                "openSubsonic": True,
                "error": {
                    "code": int(code),
                    "message": message
                }
            }
        }
    )


def handle_subsonic_exception(exc: SubsonicError):
    """Handle Subsonic-specific exceptions"""
    return create_error_response(exc.code, exc.message)


def get_error_message(code: SubsonicErrorCodes) -> str:
    """Get default error message for a given error code"""
    error_messages: Dict[SubsonicErrorCodes, str] = {
        SubsonicErrorCodes.GENERIC: "A generic error occurred",
        SubsonicErrorCodes.MISSING_PARAMETER: "Required parameter is missing",
        SubsonicErrorCodes.INCOMPATIBLE_VERSION_CLIENT: "Client version is incompatible",
        SubsonicErrorCodes.INCOMPATIBLE_VERSION_SERVER: "Server version is incompatible",
        SubsonicErrorCodes.WRONG_CREDENTIALS: "Wrong username or password",
        SubsonicErrorCodes.TOKEN_AUTH_NOT_SUPPORTED: "Token authentication not supported",
        SubsonicErrorCodes.UNAUTHORIZED: "User is not authorized for this operation",
        SubsonicErrorCodes.SERVER_LICENSE_EXPIRED: "Server license has expired",
        SubsonicErrorCodes.DATA_NOT_FOUND: "The requested data was not found"
    }
    return error_messages.get(code, "An unknown error occurred")