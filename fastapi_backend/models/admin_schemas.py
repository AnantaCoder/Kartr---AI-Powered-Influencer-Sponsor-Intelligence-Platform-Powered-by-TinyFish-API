"""
Admin Pydantic schemas for request/response validation.

Provides schemas for admin dashboard operations:
- User management (list, view, update, delete)
- Platform analytics
- Filtering and pagination
"""
from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, EmailStr, Field


class AdminUserResponse(BaseModel):
    """Full user details for admin view."""
    id: Union[int, str]
    username: str
    email: str
    user_type: str
    full_name: Optional[str] = ""
    date_registered: Union[datetime, str]
    email_visible: bool = False
    bluesky_handle: Optional[str] = None
    is_active: bool = True
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Paginated user list response."""
    users: List[AdminUserResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int


class UserUpdateRequest(BaseModel):
    """Admin can update any user field."""
    username: Optional[str] = Field(None, min_length=3, max_length=64)
    email: Optional[EmailStr] = None
    user_type: Optional[str] = Field(None, pattern="^(influencer|sponsor|admin)$")
    full_name: Optional[str] = Field(None, max_length=128)
    email_visible: Optional[bool] = None
    is_active: Optional[bool] = None


class UserFilterParams(BaseModel):
    """Filter parameters for user listing."""
    user_type: Optional[str] = Field(None, pattern="^(influencer|sponsor|admin)$")
    is_active: Optional[bool] = None
    search: Optional[str] = None


class PlatformAnalytics(BaseModel):
    """Platform-wide analytics for admin dashboard."""
    total_users: int = 0
    total_sponsors: int = 0
    total_influencers: int = 0
    total_admins: int = 0
    total_campaigns: int = 0
    total_video_analyses: int = 0
    active_users_today: int = 0
    new_users_this_week: int = 0


class AdminDashboardResponse(BaseModel):
    """Combined admin dashboard data."""
    analytics: PlatformAnalytics
    recent_users: List[AdminUserResponse]
    recent_activity: List[dict] = []
