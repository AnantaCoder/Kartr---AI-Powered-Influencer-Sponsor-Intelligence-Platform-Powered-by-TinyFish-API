"""
Admin Router - Endpoints for admin dashboard operations.

Provides endpoints for:
- User management (list, view, update, delete)
- Platform analytics
- Sponsor and influencer listings
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query

from models.admin_schemas import (
    AdminUserResponse,
    UserListResponse,
    UserUpdateRequest,
    PlatformAnalytics,
    AdminDashboardResponse
)
from models.schemas import MessageResponse
from services.admin_service import AdminService
from utils.rbac import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# =============================================================================
# User Management
# =============================================================================

@router.get("/users", response_model=UserListResponse)
async def list_all_users(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    user_type: Optional[str] = Query(None, pattern="^(influencer|sponsor|admin)$"),
    search: Optional[str] = Query(None, description="Search in username/email"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: dict = Depends(require_admin)
):
    """
    List all users with pagination and filters.
    
    Admin only endpoint.
    """
    result = AdminService.list_users(
        page=page,
        page_size=page_size,
        user_type=user_type,
        search=search,
        is_active=is_active
    )
    
    return UserListResponse(
        users=[AdminUserResponse(**u) for u in result["users"]],
        total_count=result["total_count"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user_details(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Get detailed information about a specific user.
    
    Admin only endpoint.
    """
    user = AdminService.get_user(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return AdminUserResponse(**user)


@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: str,
    update_data: UserUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Update a user's information.
    
    Admin only endpoint.
    """
    # Prevent admin from updating their own type
    if user_id == current_user.get("id") and update_data.user_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own user type"
        )
    
    updated_user = AdminService.update_user(
        user_id,
        update_data.model_dump(exclude_none=True)
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or update failed"
        )
    
    return AdminUserResponse(**updated_user)


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    hard_delete: bool = Query(False, description="Permanently delete (dangerous)"),
    current_user: dict = Depends(require_admin)
):
    """
    Delete a user (soft delete by default).
    
    Admin only endpoint.
    """
    # Prevent admin from deleting themselves
    if user_id == current_user.get("id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    success = AdminService.delete_user(user_id, soft_delete=not hard_delete)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    delete_type = "permanently deleted" if hard_delete else "deactivated"
    
    return MessageResponse(
        success=True,
        message=f"User {delete_type} successfully"
    )


# =============================================================================
# Filtered User Lists
# =============================================================================

@router.get("/sponsors", response_model=UserListResponse)
async def list_sponsors(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """
    List all sponsor users.
    
    Admin only endpoint.
    """
    result = AdminService.list_sponsors(page, page_size)
    
    return UserListResponse(
        users=[AdminUserResponse(**u) for u in result["users"]],
        total_count=result["total_count"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )


@router.get("/influencers", response_model=UserListResponse)
async def list_influencers(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """
    List all influencer users.
    
    Admin only endpoint.
    """
    result = AdminService.list_influencers(page, page_size)
    
    return UserListResponse(
        users=[AdminUserResponse(**u) for u in result["users"]],
        total_count=result["total_count"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )


# =============================================================================
# Analytics
# =============================================================================

@router.get("/analytics", response_model=PlatformAnalytics)
async def get_platform_analytics(
    current_user: dict = Depends(require_admin)
):
    """
    Get platform-wide analytics.
    
    Includes user counts, campaign statistics, and activity metrics.
    Admin only endpoint.
    """
    analytics = AdminService.get_platform_analytics()
    
    return PlatformAnalytics(**analytics)


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_admin_dashboard(
    current_user: dict = Depends(require_admin)
):
    """
    Get complete admin dashboard data.
    
    Combines analytics with recent users and activity.
    Admin only endpoint.
    """
    analytics = AdminService.get_platform_analytics()
    recent_users_data = AdminService.list_users(page=1, page_size=10)
    
    return AdminDashboardResponse(
        analytics=PlatformAnalytics(**analytics),
        recent_users=[AdminUserResponse(**u) for u in recent_users_data["users"]],
        recent_activity=[]
    )
