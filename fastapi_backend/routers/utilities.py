"""
Utilities router - Email visibility, profile, platform stats
"""
import logging
import os
from fastapi import APIRouter, HTTPException, status, Depends
from models.schemas import EmailVisibilityRequest, PlatformStats, MessageResponse, UserResponse
from services.auth_service import AuthService
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Utilities"])


@router.post("/user/toggle-email-visibility", response_model=MessageResponse)
async def toggle_email_visibility(
    request: EmailVisibilityRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Toggle email visibility in search results.
    """
    try:
        # Update in database
        updated_user = AuthService.update_user(
            current_user["id"],
            {"email_visible": request.email_visible}
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )
        
        # Also update CSV file
        try:
            import pandas as pd
            csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'database.csv')
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                df.loc[df['email'] == current_user['email'], 'public_email'] = str(request.email_visible)
                df.to_csv(csv_path, index=False)
        except Exception as e:
            logger.warning(f"Failed to update CSV: {e}")
        
        return MessageResponse(
            success=True,
            message=f"Email visibility set to {request.email_visible}"
        )
        
    except Exception as e:
        logger.error(f"Error toggling email visibility: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/user/profile", response_model=UserResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's profile.
    """
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        user_type=current_user["user_type"],
        date_registered=current_user.get("date_registered", ""),
        email_visible=current_user.get("email_visible", False)
    )


@router.get("/stats/platform", response_model=PlatformStats)
async def get_platform_stats():
    """
    Get platform statistics (public endpoint).
    """
    try:
        import pandas as pd
        
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'database.csv')
        analysis_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'ANALYSIS.CSV')
        
        stats = PlatformStats()
        
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            stats.influencers = len(df[df['user_type'] == 'influencer'])
            stats.sponsors = len(df[df['user_type'] == 'sponsor'])
            stats.total_users = len(df)
        
        if os.path.exists(analysis_path):
            try:
                analysis_df = pd.read_csv(analysis_path)
                stats.partnerships = len(analysis_df)
            except Exception as e:
                logger.error(f"Error reading analysis.csv: {e}")
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting platform stats: {e}")
        return PlatformStats()


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "service": "Kartr FastAPI Backend v1.0.0"
        
    }


@router.get("/contact")
async def get_contact_info():
    """
    Get contact information.
    """
    return {
        "email": "support@kartr.com",
        "message": "Contact us for any questions or support."
    }
