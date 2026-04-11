"""
Admin Service - Business logic for admin operations.

Provides methods for:
- User management (list, view, update, delete)
- Platform analytics
- Hardcoded admin authentication
"""
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from database import (
    get_users_repository,
    get_mock_db,
    is_firebase_configured
)
from utils.security import hash_password, verify_password

logger = logging.getLogger(__name__)


# Hardcoded admin credentials (as per user request)
ADMIN_EMAIL = "admin@email.com"
ADMIN_PASSWORD = "admin@123"
ADMIN_USER = {
    "id": "admin_001",
    "username": "admin",
    "email": ADMIN_EMAIL,
    "user_type": "admin",
    "full_name": "System Administrator",
    "date_registered": "2024-01-01T00:00:00",
    "email_visible": False,
    "is_active": True
}


class AdminService:
    """Service for admin dashboard operations."""
    
    @staticmethod
    def authenticate_admin(email: str, password: str) -> Tuple[bool, Optional[dict], Optional[str]]:
        """
        Authenticate admin with hardcoded credentials.
        
        Args:
            email: Admin email
            password: Admin password
            
        Returns:
            Tuple of (success, admin_user, error_message)
        """
        if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
            return True, ADMIN_USER.copy(), None
        
        return False, None, "Invalid admin credentials"
    
    @staticmethod
    def is_admin_email(email: str) -> bool:
        """Check if email belongs to hardcoded admin."""
        return email == ADMIN_EMAIL
    
    @staticmethod
    def list_users(
        page: int = 1,
        page_size: int = 20,
        user_type: Optional[str] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        List all users with pagination and filters.
        
        Args:
            page: Page number (1-indexed)
            page_size: Items per page
            user_type: Filter by user type
            search: Search in username/email
            is_active: Filter by active status
            
        Returns:
            Dict with users list and pagination info
        """
        users = []
        total_count = 0
        
        if is_firebase_configured():
            users_repo = get_users_repository()
            
            if users_repo:
                try:
                    all_users = users_repo.find_all()
                    users = [u for u in all_users if u]
                except Exception as e:
                    logger.error(f"Error fetching users from Firebase: {e}")
        else:
            mock_db = get_mock_db()
            users = list(mock_db.users.values())
        
        # Apply filters
        if user_type:
            users = [u for u in users if u.get("user_type") == user_type]
        
        if search:
            search_lower = search.lower()
            users = [
                u for u in users
                if search_lower in u.get("username", "").lower()
                or search_lower in u.get("email", "").lower()
            ]
        
        if is_active is not None:
            users = [u for u in users if u.get("is_active", True) == is_active]
        
        total_count = len(users)
        total_pages = (total_count + page_size - 1) // page_size
        
        # Paginate
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_users = users[start_idx:end_idx]
        
        # Remove sensitive data
        safe_users = []
        for user in paginated_users:
            safe_user = {k: v for k, v in user.items() if k != "password"}
            safe_users.append(safe_user)
        
        return {
            "users": safe_users,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    
    @staticmethod
    def get_user(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user details by ID.
        
        Args:
            user_id: User's unique ID
            
        Returns:
            User data without password, or None
        """
        user = None
        
        if is_firebase_configured():
            users_repo = get_users_repository()
            if users_repo:
                user = users_repo.find_by_id(user_id)
        else:
            mock_db = get_mock_db()
            user = mock_db.get_user_by_id(user_id)
        
        if user:
            return {k: v for k, v in user.items() if k != "password"}
        
        return None
    
    @staticmethod
    def update_user(user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update user data.
        
        Args:
            user_id: User's unique ID
            data: Fields to update
            
        Returns:
            Updated user data or None
        """
        # Prevent updating password directly here
        safe_data = {k: v for k, v in data.items() if k != "password" and v is not None}
        
        if is_firebase_configured():
            users_repo = get_users_repository()
            if users_repo:
                try:
                    users_repo.update(user_id, safe_data)
                    return AdminService.get_user(user_id)
                except Exception as e:
                    logger.error(f"Error updating user in Firebase: {e}")
        else:
            mock_db = get_mock_db()
            updated = mock_db.update_user(user_id, safe_data)
            if updated:
                return {k: v for k, v in updated.items() if k != "password"}
        
        return None
    
    @staticmethod
    def delete_user(user_id: str, soft_delete: bool = True) -> bool:
        """
        Delete a user (soft delete by default).
        
        Args:
            user_id: User's unique ID
            soft_delete: If True, mark as inactive; if False, permanently delete
            
        Returns:
            True if successful
        """
        if soft_delete:
            result = AdminService.update_user(user_id, {"is_active": False})
            return result is not None
        
        # Hard delete (use with caution)
        if is_firebase_configured():
            users_repo = get_users_repository()
            if users_repo:
                try:
                    users_repo.delete(user_id)
                    return True
                except Exception as e:
                    logger.error(f"Error deleting user from Firebase: {e}")
        else:
            mock_db = get_mock_db()
            if user_id in mock_db.users:
                del mock_db.users[user_id]
                return True
        
        return False
    
    @staticmethod
    def get_platform_analytics() -> Dict[str, Any]:
        """
        Get platform-wide analytics.
        
        Returns:
            Analytics data including user counts, campaigns, etc.
        """
        analytics = {
            "total_users": 0,
            "total_sponsors": 0,
            "total_influencers": 0,
            "total_admins": 0,
            "total_campaigns": 0,
            "total_video_analyses": 0,
            "active_users_today": 0,
            "new_users_this_week": 0
        }
        
        users = []
        
        if is_firebase_configured():
            users_repo = get_users_repository()
            if users_repo:
                try:
                    users = users_repo.find_all() or []
                except Exception as e:
                    logger.error(f"Error fetching analytics from Firebase: {e}")
        else:
            mock_db = get_mock_db()
            users = list(mock_db.users.values())
        
        analytics["total_users"] = len(users)
        analytics["total_sponsors"] = len([u for u in users if u.get("user_type") == "sponsor"])
        analytics["total_influencers"] = len([u for u in users if u.get("user_type") == "influencer"])
        analytics["total_admins"] = len([u for u in users if u.get("user_type") == "admin"])
        
        # TODO: Add campaign and video analysis counts when those collections are set up
        
        return analytics
    
    @staticmethod
    def list_sponsors(page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """List all sponsor users."""
        return AdminService.list_users(page, page_size, user_type="sponsor")
    
    @staticmethod
    def list_influencers(page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """List all influencer users."""
        return AdminService.list_users(page, page_size, user_type="influencer")
