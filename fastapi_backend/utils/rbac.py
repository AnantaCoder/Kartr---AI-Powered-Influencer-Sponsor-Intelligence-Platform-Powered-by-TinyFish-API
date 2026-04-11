"""
Role-Based Access Control (RBAC) utilities for Kartr API.

Provides dependency functions to enforce role-based permissions
on API endpoints. Supports three user types: admin, sponsor, influencer.
"""
from typing import List
from fastapi import Depends, HTTPException, status
from utils.dependencies import get_current_user


def require_role(allowed_roles: List[str]):
    """
    Create a FastAPI dependency that enforces role-based access.
    
    Args:
        allowed_roles: List of user types that can access the endpoint.
                      Valid values: 'admin', 'sponsor', 'influencer'
    
    Returns:
        A dependency function that validates user role.
    
    Example:
        @router.get("/admin/users")
        async def list_users(user: dict = Depends(require_role(["admin"]))):
            ...
    """
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_type = current_user.get("user_type", "")
        
        if user_type not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker


def require_admin(current_user: dict = Depends(get_current_user)):
    """Shortcut dependency for admin-only endpoints."""
    if current_user.get("user_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_sponsor(current_user: dict = Depends(get_current_user)):
    """Shortcut dependency for sponsor-only endpoints."""
    if current_user.get("user_type") != "sponsor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sponsor access required"
        )
    return current_user


def require_influencer(current_user: dict = Depends(get_current_user)):
    """Shortcut dependency for influencer-only endpoints."""
    if current_user.get("user_type") != "influencer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Influencer access required"
        )
    return current_user


def require_sponsor_or_admin(current_user: dict = Depends(get_current_user)):
    """Dependency for endpoints accessible by sponsors or admins."""
    user_type = current_user.get("user_type", "")
    
    if user_type not in ["sponsor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sponsor or admin access required"
        )
    return current_user
