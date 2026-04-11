"""
FastAPI dependencies for authentication and database access.

Provides reusable dependency functions for route handlers.
"""
import logging
from typing import Optional, Dict, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from utils.security import decode_token
from database import get_users_repository, get_mock_db

logger = logging.getLogger(__name__)

# Security scheme for JWT bearer token
# auto_error=False allows routes to handle missing auth gracefully
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user from JWT token.
    
    Raises:
        HTTPException 401: If not authenticated or token is invalid
        
    Returns:
        User data dictionary
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Decode and validate token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Try to fetch user from database for fresh data
    user = await _fetch_user_by_id(user_id)
    
    if user:
        return user
    
    # Fallback: return minimal user info from token
    # This allows the API to work even if DB is temporarily unavailable
    logger.warning(f"User not found in database, using token data: {user_id}")
    return {
        "id": user_id,
        "email": payload.get("email", ""),
        "username": payload.get("username", ""),
        "user_type": payload.get("user_type", "influencer"),
    }


async def _fetch_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch user from database by ID.
    
    Returns user data without sensitive fields.
    """
    try:
        users_repo = get_users_repository()
        
        if users_repo:
            user = users_repo.find_by_id(str(user_id))
            if user:
                # Remove sensitive data
                user.pop("password_hash", None)
                return user
        
        # Fallback to mock database
        mock_db = get_mock_db()
        user = mock_db.get_user_by_id(user_id)
        if user:
            result = user.copy()
            result.pop("password_hash", None)
            return result
        
        return None
        
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        return None


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Dependency to get current user if authenticated, None otherwise.
    
    Use this for routes that work with or without authentication.
    Does not raise exception if not authenticated.
    
    Returns:
        User data dictionary or None
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_user_type(allowed_types: list):
    """
    Factory for dependency that requires specific user types.
    
    Usage:
        @router.get("/sponsors-only")
        async def sponsors_route(user = Depends(require_user_type(["sponsor"]))):
            ...
    
    Args:
        allowed_types: List of allowed user types (e.g., ["influencer", "sponsor"])
        
    Returns:
        Dependency function
    """
    async def dependency(user: dict = Depends(get_current_user)) -> dict:
        user_type = user.get("user_type")
        if user_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires user type: {', '.join(allowed_types)}"
            )
        return user
    
    return dependency


# Convenience dependencies for common user types
require_influencer = require_user_type(["influencer"])
require_sponsor = require_user_type(["sponsor"])
