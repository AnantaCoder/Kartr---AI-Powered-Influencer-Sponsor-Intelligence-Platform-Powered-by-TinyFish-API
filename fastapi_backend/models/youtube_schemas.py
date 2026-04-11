"""
YouTube-related Pydantic schemas for request/response validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class YouTubeStatsRequest(BaseModel):
    """Schema for YouTube stats request"""
    youtube_url: str


class VideoStats(BaseModel):
    """Video statistics"""
    video_id: str
    title: str
    description: Optional[str] = None
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    published_at: Optional[str] = None
    thumbnail_url: Optional[str] = None


class ChannelStats(BaseModel):
    """Channel statistics"""
    channel_id: str
    title: str
    subscriber_count: int = 0
    video_count: int = 0
    view_count: int = 0
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None


class YouTubeStatsResponse(BaseModel):
    """Response for YouTube stats"""
    video_stats: Optional[VideoStats] = None
    channel_stats: Optional[ChannelStats] = None
    error: Optional[str] = None


class AnalyzeVideoRequest(BaseModel):
    """Request to analyze a video for influencer and sponsor information"""
    video_url: Optional[str] = Field(None, description="Single YouTube video URL to analyze")
    video_urls: Optional[List[str]] = Field(default=None, description="Optional list of multiple YouTube video URLs to analyze")


class VideoAnalysis(BaseModel):
    """AI-generated analysis of a video"""
    is_sponsored: Optional[bool] = Field(None, description="Whether the video appears to be sponsored")
    sponsor_name: Optional[str] = Field(None, description="Name of the sponsor if detected")
    sponsor_industry: Optional[str] = Field(None, description="Industry of the sponsor")
    influencer_niche: Optional[str] = Field(None, description="Primary content niche of the creator")
    content_summary: Optional[str] = Field(None, description="Brief summary of the video content")
    sentiment: Optional[str] = Field(None, description="Overall sentiment: Positive, Neutral, or Negative")
    key_topics: Optional[List[str]] = Field(default=[], description="Main topics discussed in the video")
    error: Optional[str] = Field(None, description="Error message if analysis failed")


class Recommendation(BaseModel):
    """A live recommendation from Tavily search"""
    name: str
    industry: Optional[str] = None
    fit_score: int
    reason: str
    handle: Optional[str] = None
    subscribers: Optional[str] = None
    engagement_rate: Optional[float] = None


class AnalyzeVideoResponse(BaseModel):
    """Response from video analysis endpoint with Gemini AI insights"""
    video_id: str = Field(..., description="YouTube video ID")
    title: str = Field(..., description="Video title")
    description: Optional[str] = Field(None, description="Video description")
    view_count: int = Field(0, description="Number of views")
    like_count: int = Field(0, description="Number of likes")
    comment_count: int = Field(0, description="Number of comments")
    published_at: Optional[str] = Field(None, description="Video publish date (ISO format)")
    thumbnail_url: Optional[str] = Field(None, description="URL to video thumbnail")
    channel_id: Optional[str] = Field(None, description="YouTube channel ID")
    channel_title: Optional[str] = Field(None, description="Channel name")
    tags: Optional[List[str]] = Field(default=[], description="Video tags")
    analysis: Optional[VideoAnalysis] = Field(None, description="AI-generated analysis from Gemini")
    recommendations: Optional[List[Recommendation]] = Field(default=[], description="Live market recommendations from Tavily")
    gemini_raw_response: Optional[str] = Field(None, description="Raw text response from Gemini AI")
    error: Optional[str] = Field(None, description="Error message if video fetch failed")


class AnalyzeChannelRequest(BaseModel):
    """Request to analyze a channel"""
    channel_id: str
    max_videos: int = 5


class YouTubeChannelResponse(BaseModel):
    """Response for linked YouTube channel"""
    id: int
    channel_id: str
    title: str
    subscriber_count: Optional[int] = None
    video_count: Optional[int] = None
    view_count: Optional[int] = None
    date_added: datetime
    date_updated: datetime


class SaveAnalysisRequest(BaseModel):
    """Request to save analysis"""
    video_title: str
    channel_name: str
    creator_name: str
    creator_industry: str
    sponsors: Optional[List[dict]] = None
class BulkVideoAnalysisResponse(BaseModel):
    """Response for bulk video analysis"""
    results: List[AnalyzeVideoResponse]
    total_count: int
    success_count: int
    failed_count: int
