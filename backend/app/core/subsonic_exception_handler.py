"""Subsonic API exception handling middleware"""
from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Union
import logging

from app.core.subsonic_errors import SubsonicError, SubsonicErrorCodes, create_error_response


async def subsonic_exception_handler(request: Request, exc: Union[Exception, SubsonicError, RequestValidationError, StarletteHTTPException]):
    """Global exception handler for Subsonic API"""
    if isinstance(exc, SubsonicError):
        # Already a Subsonic error, return as is
        return create_error_response(exc.code, exc.message)
    elif isinstance(exc, StarletteHTTPException):
        # Convert HTTP exceptions to appropriate Subsonic errors
        if exc.status_code == 404:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, "Resource not found")
        elif exc.status_code == 401 or exc.status_code == 403:
            return create_error_response(SubsonicErrorCodes.UNAUTHORIZED, "Access denied")
        else:
            return create_error_response(SubsonicErrorCodes.GENERIC, f"HTTP Error {exc.status_code}: {exc.detail}")
    elif isinstance(exc, RequestValidationError):
        # Validation errors become missing parameter errors
        return create_error_response(SubsonicErrorCodes.MISSING_PARAMETER, f"Invalid parameters: {str(exc)}")
    else:
        # Generic error for all other exceptions
        logging.error(f"Subsonic API error: {str(exc)}", exc_info=True)
        return create_error_response(SubsonicErrorCodes.GENERIC, f"An error occurred: {str(exc)}")


def add_exception_handlers(app: FastAPI):
    """Add exception handlers to the FastAPI app"""
    app.add_exception_handler(SubsonicError, subsonic_exception_handler)
    app.add_exception_handler(StarletteHTTPException, subsonic_exception_handler)
    app.add_exception_handler(RequestValidationError, subsonic_exception_handler)
    app.add_exception_handler(Exception, subsonic_exception_handler)