"""
Campaign Pydantic schemas for request/response validation.

Provides schemas for sponsor campaign management:
- Campaign CRUD operations
- Influencer matching and discovery
- Performance tracking
"""
from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    """Schema for creating a new campaign."""
    name: str = Field(..., min_length=3, max_length=128)
    description: str = Field(..., min_length=10, max_length=2000)
    niche: str = Field(..., min_length=2, max_length=64)
    target_audience: Optional[str] = Field(None, max_length=500)
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    keywords: List[str] = Field(default_factory=list)
    requirements: Optional[str] = Field(None, max_length=1000)


class CampaignUpdate(BaseModel):
    """Schema for updating a campaign."""
    name: Optional[str] = Field(None, min_length=3, max_length=128)
    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    niche: Optional[str] = Field(None, min_length=2, max_length=64)
    target_audience: Optional[str] = Field(None, max_length=500)
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    keywords: Optional[List[str]] = None
    requirements: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(draft|active|paused|completed|inactive)$")


class InfluencerStageCounts(BaseModel):
    """Influencer stage counts for a campaign."""
    invited: int = 0
    accepted: int = 0
    in_progress: int = 0
    completed: int = 0
    rejected: int = 0


class CampaignResponse(BaseModel):
    """Full campaign details response."""
    id: str
    sponsor_id: str
    name: str
    description: str
    niche: str
    target_audience: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    keywords: List[str] = []
    requirements: Optional[str] = None
    status: str = "active"  # Campaigns are active by default
    created_at: Union[datetime, str]
    updated_at: Union[datetime, str]
    matched_influencers_count: int = 0
    influencer_stages: Optional[InfluencerStageCounts] = None
    
    class Config:
        from_attributes = True


class CampaignListResponse(BaseModel):
    """Paginated campaign list."""
    campaigns: List[CampaignResponse]
    total_count: int
    page: int
    page_size: int


class ChannelStats(BaseModel):
    """Aggregated YouTube channel statistics."""
    total_subscribers: int = 0
    total_views: int = 0
    total_channels: int = 0
    average_videos: int = 0
    channels: List[dict] = []


class InfluencerMatch(BaseModel):
    """Matched influencer for a campaign."""
    influencer_id: str
    username: str
    full_name: Optional[str] = ""
    relevance_score: float = Field(default=50.0, ge=0, le=100)
    matching_keywords: List[str] = []
    channel_stats: Optional[ChannelStats] = None
    ai_analysis: Optional[str] = None
    status: str = "suggested"  # invited, accepted, in_progress, completed, rejected
    notes: Optional[str] = None
    added_at: Optional[str] = None
    post_url: Optional[str] = None  # URL to completed post


class CampaignInfluencersResponse(BaseModel):
    """Campaign with matched influencers."""
    campaign: CampaignResponse
    matched_influencers: List[InfluencerMatch]
    total_matches: int


class AddInfluencerRequest(BaseModel):
    """Add an influencer to a campaign."""
    influencer_id: str
    notes: Optional[str] = None


class InvitationResponse(BaseModel):
    """Respond to a campaign invitation."""
    accept: bool = Field(..., description="True to accept, False to reject")


class CampaignStatusUpdate(BaseModel):
    """Update campaign job status (influencer)."""
    status: str = Field(
        ..., 
        pattern="^(in_progress|completed|cancelled)$",
        description="New status: in_progress, completed, or cancelled"
    )
