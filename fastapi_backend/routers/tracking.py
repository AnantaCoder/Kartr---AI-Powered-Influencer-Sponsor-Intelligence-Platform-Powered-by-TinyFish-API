"""
Performance Tracking Router - Endpoints for analytics and metrics.

Provides endpoints for:
- Logging performance events (views, clicks, conversions)
- Campaign performance reports
- Influencer performance metrics
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, status, Depends, Query

from models.tracking_schemas import (
    PerformanceLogCreate,
    PerformanceLogResponse,
    PerformanceMetrics,
    CampaignPerformance,
    InfluencerPerformance,
    PerformanceReportRequest
)
from models.schemas import MessageResponse
from utils.rbac import require_sponsor_or_admin
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tracking", tags=["Performance Tracking"])


# In-memory storage for performance logs
_performance_logs: List[Dict[str, Any]] = []


# =============================================================================
# Performance Logging
# =============================================================================

@router.post("/log", response_model=PerformanceLogResponse, status_code=status.HTTP_201_CREATED)
async def log_performance_event(
    log_data: PerformanceLogCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Log a performance event.
    
    Event types: view, click, conversion, engagement
    """
    log_id = f"log_{uuid.uuid4().hex[:12]}"
    now = datetime.utcnow().isoformat()
    
    log_entry = {
        "id": log_id,
        "campaign_id": log_data.campaign_id,
        "influencer_id": log_data.influencer_id,
        "event_type": log_data.event_type,
        "value": log_data.value,
        "metadata": log_data.metadata,
        "created_at": now,
        "logged_by": current_user["id"]
    }
    
    _performance_logs.append(log_entry)
    
    logger.info(f"Logged performance event: {log_data.event_type} for campaign {log_data.campaign_id}")
    
    return PerformanceLogResponse(**log_entry)


# =============================================================================
# Campaign Performance
# =============================================================================

@router.get("/campaign/{campaign_id}", response_model=CampaignPerformance)
async def get_campaign_performance(
    campaign_id: str,
    current_user: dict = Depends(require_sponsor_or_admin)
):
    """
    Get performance metrics for a campaign.
    
    Sponsor (own campaigns) or admin only.
    """
    campaign_logs = [
        log for log in _performance_logs
        if log.get("campaign_id") == campaign_id
    ]
    
    metrics = _calculate_metrics(campaign_logs)
    influencer_breakdown = _get_influencer_breakdown(campaign_logs)
    daily_trends = _get_daily_trends(campaign_logs)
    
    return CampaignPerformance(
        campaign_id=campaign_id,
        campaign_name=f"Campaign {campaign_id}",
        metrics=PerformanceMetrics(**metrics),
        influencer_breakdown=influencer_breakdown,
        daily_trends=daily_trends
    )


# =============================================================================
# Influencer Performance
# =============================================================================

@router.get("/influencer/{influencer_id}", response_model=InfluencerPerformance)
async def get_influencer_performance(
    influencer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get performance metrics for an influencer across all campaigns.
    """
    influencer_logs = [
        log for log in _performance_logs
        if log.get("influencer_id") == influencer_id
    ]
    
    metrics = _calculate_metrics(influencer_logs)
    campaign_breakdown = _get_campaign_breakdown(influencer_logs)
    
    recent = sorted(
        influencer_logs,
        key=lambda x: x.get("created_at", ""),
        reverse=True
    )[:10]
    
    return InfluencerPerformance(
        influencer_id=influencer_id,
        influencer_name=f"Influencer {influencer_id}",
        metrics=PerformanceMetrics(**metrics),
        campaign_breakdown=campaign_breakdown,
        recent_activity=[PerformanceLogResponse(**log) for log in recent]
    )


# =============================================================================
# Helper Functions
# =============================================================================

def _calculate_metrics(logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate aggregated metrics from performance logs."""
    total_views = sum(1 for log in logs if log.get("event_type") == "view")
    total_clicks = sum(1 for log in logs if log.get("event_type") == "click")
    total_conversions = sum(1 for log in logs if log.get("event_type") == "conversion")
    total_engagements = sum(1 for log in logs if log.get("event_type") == "engagement")
    
    click_through_rate = (total_clicks / total_views * 100) if total_views > 0 else 0.0
    conversion_rate = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0.0
    average_engagement = total_engagements / len(logs) if logs else 0.0
    
    return {
        "total_views": total_views,
        "total_clicks": total_clicks,
        "total_conversions": total_conversions,
        "total_engagements": total_engagements,
        "click_through_rate": round(click_through_rate, 2),
        "conversion_rate": round(conversion_rate, 2),
        "average_engagement": round(average_engagement, 2)
    }


def _get_influencer_breakdown(logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group metrics by influencer."""
    influencer_groups = {}
    
    for log in logs:
        influencer_id = log.get("influencer_id")
        
        if influencer_id not in influencer_groups:
            influencer_groups[influencer_id] = []
        
        influencer_groups[influencer_id].append(log)
    
    breakdown = []
    for influencer_id, influencer_logs in influencer_groups.items():
        metrics = _calculate_metrics(influencer_logs)
        breakdown.append({
            "influencer_id": influencer_id,
            "metrics": metrics
        })
    
    return breakdown


def _get_campaign_breakdown(logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group metrics by campaign."""
    campaign_groups = {}
    
    for log in logs:
        campaign_id = log.get("campaign_id")
        
        if campaign_id not in campaign_groups:
            campaign_groups[campaign_id] = []
        
        campaign_groups[campaign_id].append(log)
    
    breakdown = []
    for campaign_id, campaign_logs in campaign_groups.items():
        metrics = _calculate_metrics(campaign_logs)
        breakdown.append({
            "campaign_id": campaign_id,
            "metrics": metrics
        })
    
    return breakdown


def _get_daily_trends(logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Get daily aggregated trends."""
    daily_groups = {}
    
    for log in logs:
        created_at = log.get("created_at", "")
        
        if not created_at:
            continue
        
        day = created_at[:10]
        
        if day not in daily_groups:
            daily_groups[day] = []
        
        daily_groups[day].append(log)
    
    trends = []
    for day, day_logs in sorted(daily_groups.items()):
        metrics = _calculate_metrics(day_logs)
        trends.append({
            "date": day,
            "metrics": metrics
        })
    
    return trends
