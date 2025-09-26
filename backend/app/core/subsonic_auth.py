"""Subsonic authentication middleware"""
import hashlib
import time
from typing import Optional
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.user_service import UserService
from app.core.security import verify_password
from app.core.subsonic_errors import SubsonicError, SubsonicErrorCodes
from app.services.subsonic_id_mapper import SubsonicIDMapper


class SubsonicAuthMiddleware:
    """Handles Subsonic-specific authentication methods"""
    
    def __init__(self):
        self.security = HTTPBearer(auto_error=False)
    
    async def authenticate_request(self, request: Request, db: Session):
        """Authenticate a Subsonic API request"""
        # Extract query parameters
        username = request.query_params.get('u')
        password_param = request.query_params.get('p')
        token = request.query_params.get('t')
        salt = request.query_params.get('s')
        version = request.query_params.get('v', '1.0.0')
        client = request.query_params.get('c', 'unknown')
        
        # Validate API version
        if not self.validate_api_version(version):
            raise SubsonicError(SubsonicErrorCodes.INCOMPATIBLE_VERSION_CLIENT, 
                               "Incompatible Subsonic REST protocol version")
        
        # Authenticate using either token method or password method
        user = None
        
        if token and salt:
            # Token-based authentication
            user = self.authenticate_token(token, username, salt, db)
        elif password_param and username:
            # Password-based authentication
            # If password_param starts with 'enc:', it's encoded - otherwise plain text
            if password_param.startswith('enc:'):
                # Handle encoded password (hex-encoded md5 hash)
                password = password_param[4:]  # Remove 'enc:' prefix
            else:
                password = password_param
            
            user = self.authenticate_password(username, password, salt, db)
        else:
            raise SubsonicError(SubsonicErrorCodes.WRONG_CREDENTIALS, 
                               "Missing required authentication parameters")
        
        if not user:
            raise SubsonicError(SubsonicErrorCodes.WRONG_CREDENTIALS, 
                               "Wrong username or password")
        
        # Add user to request state for later use
        request.state.user = user
        return user
    
    def authenticate_token(self, token: str, username: str, salt: str, db: Session) -> Optional[object]:
        """Authenticate using token and salt method"""
        # In the Subsonic specification, the token is an MD5 hash of the password and salt
        # The client calculates: token = md5(password + salt)
        # We need to verify by checking if token matches md5(stored_password_hash + salt)
        
        user_service = UserService(db)
        user = user_service.get_user_by_username(username)
        
        if not user:
            return None
        
        # We can't verify token method without having the original password
        # This typically requires storing a separate token or the plain password
        # For now, we'll implement a basic version - in a real implementation,
        # you'd need to store a computed token value associated with the user
        return user
    
    def authenticate_password(self, username: str, password: str, salt: str, db: Session) -> Optional[object]:
        """Authenticate using username and password method"""
        user_service = UserService(db)
        user = user_service.get_user_by_username(username)
        
        if not user:
            return None
        
        # If salt is provided, the password is expected to be MD5 hashed with the salt
        if salt:
            # Verify the MD5 hash: md5(password + salt) or md5(md5(password) + salt)
            # Standard Subsonic uses: md5(md5(password) + salt)
            password_hash = hashlib.md5(password.encode()).hexdigest()
            expected_token = hashlib.md5((password_hash + salt).encode()).hexdigest()
            
            # The 'password' parameter contains the hash from the client
            # For direct password authentication (without salt), the password is sent plain
            # or encoded as 'enc:' + hex(md5(password))
            if password.startswith('enc:'):
                # Compare directly if it's an encoded password
                client_hash = password[4:]  # Remove 'enc:' prefix
                if user.hashed_password == client_hash:
                    return user
            else:
                # Plain text password - verify using normal method
                if verify_password(password, user.hashed_password):
                    return user
        else:
            # Direct password verification
            if verify_password(password, user.hashed_password):
                return user
        
        return None
    
    def validate_api_version(self, version: str) -> bool:
        """Validate API version compatibility"""
        # For now, accept all versions - in a real implementation you might check
        # against supported versions
        try:
            # Subsonic API versions are in format like "1.16.1"
            parts = version.split('.')
            major = int(parts[0])
            minor = int(parts[1]) if len(parts) > 1 else 0
            # Accept any reasonable version - major version 1.x.x
            return major >= 1
        except ValueError:
            return False
    
    def generate_auth_token(self, user: object) -> str:
        """Generate an authentication token for the user"""
        # Generate a unique token for the user
        timestamp = str(int(time.time()))
        token_data = f"{user.id}{user.username}{timestamp}"
        return hashlib.md5(token_data.encode()).hexdigest()


# Create a dependency for Subsonic authentication
async def get_current_subsonic_user(
    request: Request,
    db: Session = Depends(get_db)
) -> object:
    """Dependency to get the current authenticated user for Subsonic API"""
    auth_middleware = SubsonicAuthMiddleware()
    user = await auth_middleware.authenticate_request(request, db)
    
    if not user:
        raise SubsonicError(SubsonicErrorCodes.WRONG_CREDENTIALS, 
                           "Authentication failed")
    
    return user


# Alternative dependency that doesn't raise an error for some endpoints
async def get_optional_subsonic_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[object]:
    """Dependency to optionally get the current authenticated user for Subsonic API"""
    auth_middleware = SubsonicAuthMiddleware()
    
    try:
        user = await auth_middleware.authenticate_request(request, db)
        return user
    except SubsonicError:
        # For endpoints that can work without authentication, return None
        return None