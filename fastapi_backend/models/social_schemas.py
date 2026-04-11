"""
Social media and virtual influencer Pydantic schemas for request/response validation
"""
from typing import Optional, List
from pydantic import BaseModel


class VirtualInfluencer(BaseModel):
    """Virtual influencer data"""
    id: str
    name: str
    description: str
    avatar_url: Optional[str] = None
    specialties: List[str] = []
    price_range: Optional[str] = None


class SocialMediaAgent(BaseModel):
    """Social media agent data"""
    id: str
    name: str
    platform: str
    description: str
    capabilities: List[str] = []


class BlueskyPostRequest(BaseModel):
    """Request to post to Bluesky"""
    text: str
    image_path: Optional[str] = None
    video_path: Optional[str] = None
    alt_text: Optional[str] = None


class BlueskyLoginRequest(BaseModel):
    """Request to login to Bluesky"""
    identifier: str  # Handle or email
    password: str    # App password


class BlueskyPostResponse(BaseModel):
    """Response from Bluesky post"""
    success: bool
    message: Optional[str] = None
    post_uri: Optional[str] = None
    cid: Optional[str] = None


class BlueskyConnectRequest(BaseModel):
    """Request to link Bluesky account"""
    identifier: str
    password: str

