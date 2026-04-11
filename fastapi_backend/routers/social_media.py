"""
Social Media router - Social media agents and Bluesky integration
"""
import logging
import os
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from models.schemas import SocialMediaAgent, BlueskyPostRequest, BlueskyPostResponse, MessageResponse
from utils.dependencies import get_current_user
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/social-media", tags=["Social Media"])


def get_available_agents() -> List[dict]:
    """Get list of available social media agents"""
    return [
        {
            "id": "agent_instagram",
            "name": "Instagram Agent",
            "platform": "Instagram",
            "description": "Automated posting and engagement for Instagram accounts.",
            "capabilities": ["Post scheduling", "Story creation", "Hashtag optimization", "Engagement tracking"]
        },
        {
            "id": "agent_twitter",
            "name": "Twitter/X Agent",
            "platform": "Twitter/X",
            "description": "Tweet scheduling and thread management.",
            "capabilities": ["Tweet scheduling", "Thread creation", "Reply automation", "Analytics"]
        },
        {
            "id": "agent_youtube",
            "name": "YouTube Agent",
            "platform": "YouTube",
            "description": "Video upload scheduling and community management.",
            "capabilities": ["Video scheduling", "Thumbnail generation", "Comment moderation", "Analytics"]
        },
        {
            "id": "agent_tiktok",
            "name": "TikTok Agent",
            "platform": "TikTok",
            "description": "Short-form video content management.",
            "capabilities": ["Video scheduling", "Trend analysis", "Sound selection", "Hashtag optimization"]
        },
        {
            "id": "agent_bluesky",
            "name": "Bluesky Agent",
            "platform": "Bluesky",
            "description": "Post and engage on Bluesky social network.",
            "capabilities": ["Post scheduling", "Image posting", "Thread creation"]
        },
    ]


@router.get("/agents", response_model=List[SocialMediaAgent])
async def list_social_media_agents(current_user: dict = Depends(get_current_user)):
    """
    Get list of available social media agents.
    """
    agents = get_available_agents()
    return [SocialMediaAgent(**agent) for agent in agents]


@router.post("/post-bluesky", response_model=BlueskyPostResponse)
async def post_to_bluesky(
    request: BlueskyPostRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Post content to Bluesky.
    """
    try:
        # Check if Bluesky credentials are configured
        if not settings.BLUESKY_HANDLE or not settings.BLUESKY_PASSWORD:
            return BlueskyPostResponse(
                success=False,
                message="Bluesky credentials not configured"
            )
            
        from atproto import Client
        
        client = Client()
        client.login(settings.BLUESKY_HANDLE, settings.BLUESKY_PASSWORD)
        
        post = client.send_post(text=request.content)
        
        return BlueskyPostResponse(
            success=True,
            message="Successfully posted to Bluesky",
            post_uri=post.uri
        )
            
    except ImportError:
        return BlueskyPostResponse(
            success=False,
            message="atproto library not installed"
        )
    except Exception as e:
        logger.error(f"Bluesky post error: {e}")
        return BlueskyPostResponse(
            success=False,
            message=str(e)
        )


@router.get("/images")
async def list_images(current_user: dict = Depends(get_current_user)):
    """
    List available images for social media posting.
    """
    try:
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        images = []
        
        if os.path.exists(data_dir):
            for file in os.listdir(data_dir):
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                    images.append({
                        "filename": file,
                        "path": os.path.join(data_dir, file)
                    })
        
        return {"images": images}
        
    except Exception as e:
        logger.error(f"Error listing images: {e}")
        return {"images": [], "error": str(e)}
