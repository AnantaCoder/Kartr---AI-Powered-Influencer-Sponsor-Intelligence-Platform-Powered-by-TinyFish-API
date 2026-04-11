"""
Virtual Influencer Pydantic schemas for database storage.

Provides schemas for virtual influencer management:
- Personal info and avatar storage
- Rental and hiring
- Bluesky auto-posting integration
"""
from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, Field


class VirtualInfluencerCreate(BaseModel):
    """Schema for creating a virtual influencer."""
    name: str = Field(..., min_length=2, max_length=128)
    description: str = Field(..., min_length=10, max_length=1000)
    avatar_url: Optional[str] = None
    specialties: List[str] = Field(default_factory=list)
    price_per_post: float = Field(..., ge=0)
    price_per_video: Optional[float] = Field(None, ge=0)
    price_per_campaign: Optional[float] = Field(None, ge=0)
    bluesky_handle: Optional[str] = None
    bluesky_password: Optional[str] = None
    personality_prompt: Optional[str] = Field(None, max_length=2000)


class VirtualInfluencerUpdate(BaseModel):
    """Schema for updating a virtual influencer."""
    name: Optional[str] = Field(None, min_length=2, max_length=128)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    avatar_url: Optional[str] = None
    specialties: Optional[List[str]] = None
    price_per_post: Optional[float] = Field(None, ge=0)
    price_per_video: Optional[float] = Field(None, ge=0)
    price_per_campaign: Optional[float] = Field(None, ge=0)
    bluesky_handle: Optional[str] = None
    bluesky_password: Optional[str] = None
    personality_prompt: Optional[str] = Field(None, max_length=2000)
    is_available: Optional[bool] = None


class VirtualInfluencerResponse(BaseModel):
    """Full virtual influencer response."""
    id: str
    name: str
    description: str
    avatar_url: Optional[str] = None
    specialties: List[str] = []
    price_per_post: float
    price_per_video: Optional[float] = None
    price_per_campaign: Optional[float] = None
    bluesky_handle: Optional[str] = None
    is_available: bool = True
    total_posts: int = 0
    total_rentals: int = 0
    created_at: Union[datetime, str]
    
    class Config:
        from_attributes = True


class VirtualInfluencerListResponse(BaseModel):
    """Paginated virtual influencer list."""
    influencers: List[VirtualInfluencerResponse]
    total_count: int
    page: int
    page_size: int


class RentVirtualInfluencerRequest(BaseModel):
    """Request to rent a virtual influencer."""
    virtual_influencer_id: str
    campaign_id: Optional[str] = None
    rental_type: str = Field(..., pattern="^(post|video|campaign)$")
    duration_days: Optional[int] = Field(None, ge=1, le=365)
    instructions: Optional[str] = Field(None, max_length=2000)


class RentalResponse(BaseModel):
    """Rental confirmation response."""
    rental_id: str
    virtual_influencer: VirtualInfluencerResponse
    sponsor_id: str
    rental_type: str
    price: float
    status: str = "active"
    start_date: Union[datetime, str]
    end_date: Optional[Union[datetime, str]] = None


class AutoPostRequest(BaseModel):
    """Request for virtual influencer auto-posting."""
    virtual_influencer_id: str
    text: str = Field(..., min_length=1, max_length=300)
    image_prompt: Optional[str] = None
    schedule_time: Optional[datetime] = None
