"""
Performance Tracking Pydantic schemas.

Provides schemas for tracking and analytics:
- Performance logging (views, clicks, conversions)
- Campaign performance reports
- Influencer performance metrics
"""
from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, Field


class PerformanceLogCreate(BaseModel):
    """Log a performance event."""
    campaign_id: str
    influencer_id: str
    event_type: str = Field(..., pattern="^(view|click|conversion|engagement)$")
    value: Optional[float] = None
    metadata: Optional[dict] = None


class PerformanceLogResponse(BaseModel):
    """Performance log entry."""
    id: str
    campaign_id: str
    influencer_id: str
    event_type: str
    value: Optional[float] = None
    metadata: Optional[dict] = None
    created_at: Union[datetime, str]


class PerformanceMetrics(BaseModel):
    """Aggregated performance metrics."""
    total_views: int = 0
    total_clicks: int = 0
    total_conversions: int = 0
    total_engagements: int = 0
    click_through_rate: float = 0.0
    conversion_rate: float = 0.0
    average_engagement: float = 0.0


class CampaignPerformance(BaseModel):
    """Campaign performance report."""
    campaign_id: str
    campaign_name: str
    metrics: PerformanceMetrics
    influencer_breakdown: List[dict] = []
    daily_trends: List[dict] = []
    start_date: Optional[Union[datetime, str]] = None
    end_date: Optional[Union[datetime, str]] = None


class InfluencerPerformance(BaseModel):
    """Influencer performance across all campaigns."""
    influencer_id: str
    influencer_name: str
    metrics: PerformanceMetrics
    campaign_breakdown: List[dict] = []
    recent_activity: List[PerformanceLogResponse] = []


class PerformanceReportRequest(BaseModel):
    """Request for generating performance report."""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    group_by: str = Field(default="day", pattern="^(hour|day|week|month)$")
