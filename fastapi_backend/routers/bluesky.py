import logging
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
import os
from datetime import datetime
from models.social_schemas import BlueskyConnectRequest, BlueskyPostRequest, BlueskyPostResponse
from services.bluesky_service import bluesky_service
from services.video_service import VIDEOS_DIR
from services.auth_service import AuthService
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/bluesky",
    tags=["Bluesky"]
)

@router.post("/connect", response_model=dict)
async def connect_bluesky_account(
    request: BlueskyConnectRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Link a Bluesky account to the current user.
    Verifies credentials before saving.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Get user ID (might be under 'id' or 'uid')
    user_id = current_user.get("id") or current_user.get("uid")
    logger.info(f"Connecting Bluesky for user: {user_id}")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found in session")
    
    # 1. Verify credentials with Bluesky
    is_valid = bluesky_service.verify_credentials(request.identifier, request.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Bluesky credentials. Please check your handle and app password.")
    
    # 2. Save to User Profile (Database)
    update_data = {
        "bluesky_handle": request.identifier,
        "bluesky_password": request.password  # In production, encrypt this!
    }
    
    updated_user = AuthService.update_user(user_id, update_data)
    
    if not updated_user:
        logger.error(f"Failed to update user {user_id} with Bluesky credentials")
        raise HTTPException(status_code=500, detail="Failed to save Bluesky credentials to profile")
        
    logger.info(f"Bluesky account {request.identifier} linked to user {user_id}")
    return {"success": True, "message": f"Bluesky account {request.identifier} linked successfully"}


@router.get("/status", response_model=dict)
async def get_bluesky_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's Bluesky connection status.
    Returns handle if connected, or null if not.
    """
    # current_user already contains full user data from get_current_user
    handle = current_user.get("bluesky_handle")
    
    return {
        "connected": bool(handle),
        "handle": handle if handle else None,
    }


@router.post("/post", response_model=BlueskyPostResponse)
async def create_post(
    text: str = Form(...),
    image_path: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    video_path: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    video_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a post on Bluesky.
    Uses linked account credentials.
    
    Can accept:
    - Text only
    - Text with image file (upload)
    - Text with image path (existing file)
    - Text with video path
    - Text with video file (upload)
    """
    try:
        user_full = AuthService.get_user_by_id(current_user["id"])
        if not user_full:
            raise HTTPException(status_code=404, detail="User not found")

        handle = user_full.get("bluesky_handle")
        password = user_full.get("bluesky_password")
        
        if not handle or not password:
            raise HTTPException(
                status_code=400, 
                detail="Bluesky account not linked. Please connect your account first via /bluesky/connect"
            )

        # Handle image upload if provided
        final_image_path = image_path
        if image_file:
            uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}_{image_file.filename}"
            final_image_path = os.path.join(uploads_dir, filename)
            
            content = await image_file.read()
            with open(final_image_path, "wb") as f:
                f.write(content)

        # Handle video path - either direct path or filename in VIDEOS_DIR
        final_video_path = video_path
        
        # Handle video upload if provided (overrides path)
        if video_file:
            uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"video_{timestamp}_{video_file.filename}"
            final_video_path = os.path.join(uploads_dir, filename)
            
            content = await video_file.read()
            with open(final_video_path, "wb") as f:
                f.write(content)

        # If video_path is just a filename (from frontend), resolve it to VIDEOS_DIR
        if final_video_path and not video_file and not os.path.isabs(final_video_path) and not os.path.exists(final_video_path):
            potential_path = os.path.join(VIDEOS_DIR, final_video_path)
            if os.path.exists(potential_path):
                final_video_path = potential_path

        # Post based on content type
        if final_video_path:
            result = await bluesky_service.post_video(
                identifier=handle,
                password=password,
                text=text, 
                video_path=final_video_path,
                alt_text=alt_text or "Video"
            )
            
            # Clean up uploaded video file
            if video_file:
                try:
                    os.remove(final_video_path)
                except:
                    pass
                    
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
        elif final_image_path:
            result = bluesky_service.post_image(
                identifier=handle,
                password=password,
                text=text, 
                image_path=final_image_path,
                alt_text=alt_text or ""
            )
            # Clean up uploaded file
            if image_file:
                try:
                    os.remove(final_image_path)
                except:
                    pass
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
        elif video_url:
            result = await bluesky_service.post_video_url(
                identifier=handle,
                password=password,
                text=text,
                video_url=video_url,
                alt_text=alt_text or "Video"
            )
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
        elif image_url:
            result = await bluesky_service.post_image_url(
                identifier=handle,
                password=password,
                text=text,
                image_url=image_url,
                alt_text=alt_text or ""
            )
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
        else:
            result = bluesky_service.post_text(
                identifier=handle,
                password=password,
                text=text
            )
            return BlueskyPostResponse(
                success=result.get("success", False),
                message=result.get("message"),
                post_uri=result.get("post_uri"),
                cid=result.get("cid")
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post: {str(e)}")
