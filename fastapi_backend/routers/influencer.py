
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from utils.dependencies import get_current_user
from services.youtube_service import youtube_service
from services.analysis_service import analyze_influencer_sponsors, generate_sponsorship_pitch, get_ai_recommendations, create_analysis_document

from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from io import BytesIO

class PitchRequest(BaseModel):
    video_id: str
    brand_name: str
    brand_details: str

class SendEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/influencer", tags=["Influencer Insights"])

@router.get("/analytics/{video_id}")
async def get_advanced_analytics(video_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get advanced analytics for a specific video/influencer.
    """
    try:
        # Fetch base stats
        video_stats = youtube_service.get_video_stats(video_id)
        if "error" in video_stats:
            raise HTTPException(status_code=404, detail=video_stats["error"])
        
        # Perform AI Analysis for sentiment and niche
        analysis_result = analyze_influencer_sponsors(video_id)
        analysis = analysis_result.get("analysis", {})
        
        # Calculate Advanced Metrics
        view_count = video_stats.get("view_count", 0)
        like_count = video_stats.get("like_count", 0)
        comment_count = video_stats.get("comment_count", 0)
        
        engagement_rate = 0
        if view_count > 0:
            engagement_rate = ((like_count + comment_count) / view_count) * 100
        
        # Mocking some historical/advanced data for demo purposes
        sentiment_score = 85 if analysis.get("sentiment") == "Positive" else 50
        niche = analysis.get("influencer_niche", "Tech")
        
        # Use AI-derived recommendations for suggested partner
        recommendations = analysis_result.get("recommendations", [])
        suggested_partner = recommendations[0].get("name") if recommendations else "Analysis Pending"

        analytics = {
            "engagement_rate": round(engagement_rate, 2),
            "sentiment_score": sentiment_score,
            "niche": niche,
            "audience_retention_estimate": 72.5,
            "brand_safety_score": 98.0,
            "growth_potential": "High" if engagement_rate > 5 else "Moderate",
            "suggested_partner": suggested_partner,
            "potential_partners": recommendations # Pass full list for deep dive
        }
        
        return {
            "video_id": video_id,
            "title": video_stats.get("title"),
            "analytics": analytics
        }
    except Exception as e:
        logger.error(f"Error fetching advanced analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/{niche}")
async def get_potential_sponsors(niche: str, current_user: dict = Depends(get_current_user)):
    """
    Recommend potential sponsors based on the influencer's niche.
    """
    try:
        from services.campaign_service import CampaignService
        
        # 1. Fetch from Platform Database (Campaigns)
        # Note: In a real app we'd have a specialized "find_open_campaigns" method.
        # Here we list campaigns from a "demo" sponsor or all/mock.
        # For MVP we iterate typical mock/demo IDs or fetch all if possible.
        # Since CampaignService is user-centric, we might default to mock db filtering 
        # inside the service if we can't search all.
        
        # Simplification: We will rely on getting campaigns for *a* sponsor just to show data structure,
        # OR ideally we'd have a `CampaignService.find_campaigns_by_niche(niche)`
        # Let's try to mock that behavior locally:
        platform_campaigns = []
        # Attempt to access repository directly if easier, or iterate known IDs.
        # For safety/speed in MVP without altering Service interface too much:
        # We will skip complex DB queries and rely on Tavily for 'Discovery' 
        # UNLESS the user explicitly has campaigns in their DB.
        
        # 2. Fetch from Live Market (Tavily)
        live_recommendations = get_ai_recommendations(niche, perspective="creator")
        
        mapped_recs = []
        
        # Process Live Data First (Primary Discovery Source)
        for r in live_recommendations:
            mapped_recs.append({
                "name": r.get('name'),
                "industry": r.get('industry', niche),
                "fit_score": r.get('fit_score'),
                "reason": r.get('reason'),
                "logo_url": r.get('logo_url'),
                "source": "Web Search"
            })
            
        # Fallback Logic (Mock/Safety)
        if not mapped_recs:
             recommendations_map = {
                "Tech": [
                    {"name": "NordVPN", "industry": "Cybersecurity", "fit_score": 95, "reason": "High affinity with tech audience", "logo_url": "https://ui-avatars.com/api/?name=NordVPN&background=0D8ABC&color=fff"},
                    {"name": "Skillshare", "industry": "Education", "fit_score": 88, "reason": "Matches creative tech skills", "logo_url": "https://ui-avatars.com/api/?name=Skillshare&background=00FF84&color=000"},
                    {"name": "Honey", "industry": "Ecommerce", "fit_score": 82, "reason": "Popular with savvy shoppers", "logo_url": "https://ui-avatars.com/api/?name=Honey&background=FFAA00&color=fff"}
                ]
            }
             # Map defaults...
             defaults = recommendations_map.get(niche, recommendations_map["Tech"])
             for d in defaults:
                 d["source"] = "Trending"
                 mapped_recs.append(d)

        return {
            "niche": niche,
            "potential_sponsors": mapped_recs
        }
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")

from fastapi.responses import PlainTextResponse

@router.get("/export-pitch-deck/{video_id}", response_class=PlainTextResponse)
async def export_pitch_deck(video_id: str, current_user: dict = Depends(get_current_user)):
    """
    Generate and export a professional Pitch Deck in Markdown format.
    """
    try:
        # Fetch data (same logic as analytics for consistency)
        video_stats = youtube_service.get_video_stats(video_id)
        analysis_result = analyze_influencer_sponsors(video_id)
        analysis = analysis_result.get("analysis", {})
        
        view_count = video_stats.get("view_count", 0)
        like_count = video_stats.get("like_count", 0)
        comment_count = video_stats.get("comment_count", 0)
        engagement_rate = round(((like_count + comment_count) / view_count * 100), 2) if view_count > 0 else 0
        
        niche = analysis.get("influencer_niche", "Tech")
        
        # Build Markdown
        pitch_deck = f"""# KARTR INFLUENCER PITCH DECK
---
## Video: {video_stats.get('title', 'Untitled')}
**Channel:** {video_stats.get('channel_title', 'Unknown')}
**Date Generated:** {current_user.get('email', 'User')} - 2026

### 📈 Performance Metrics
- **Views:** {view_count:,}
- **Engagement Rate:** {engagement_rate}%
- **Sentiment Score:** {"Positive" if analysis.get('sentiment') == "Positive" else "Neutral"}
- **Brand Safety Score:** 98/100

### 🎯 Content Strategy
- **Niche Alignment:** {niche}
- **Key Topics:** {", ".join(analysis.get('key_topics', []))}
- **Summary:** {analysis.get('content_summary', '')}

### 💼 Recommended Brand Partnerships
Based on our AI matching engine, here are top sponsors for this content:
1. **Brand 1:** High affinity with {niche} audience.
2. **Brand 2:** Strong alignment with engagement metrics.
3. **Brand 3:** Matches creator's core demographic.

---
*Generated by Kartr - AI-Powered Influencer Ecosystem*
"""
        return PlainTextResponse(content=pitch_deck, media_type="text/markdown", headers={
            "Content-Disposition": f"attachment; filename=Pitch_Deck_{video_id}.md"
        })
    except Exception as e:
        logger.error(f"Error exporting pitch deck: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate pitch deck")

@router.post("/export-report")
async def export_analysis_report(data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """
    Generate and export a professional Analysis Report in DOCX format.
    Accepts the full analysis object (so frontend state can be downloaded directly).
    """
    try:
        docx_file = create_analysis_document(data)
        
        return StreamingResponse(
            docx_file,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename=Analysis_Report_{data.get('video_id', 'report')}.docx"
            }
        )
    except Exception as e:
        logger.error(f"Error exporting report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")

@router.post("/generate-pitch")
async def generate_pitch(request: PitchRequest, current_user: dict = Depends(get_current_user)):
    """Generate an AI-powered sponsorship pitch email."""
    try:
        return generate_sponsorship_pitch(
            request.video_id, 
            request.brand_name, 
            request.brand_details
        )
    except Exception as e:
        logger.error(f"Error generating pitch: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate pitch")


from models.campaign_schemas import InvitationResponse, CampaignStatusUpdate
from services.campaign_service import CampaignService

@router.get("/invitations")
async def get_my_invitations(current_user: dict = Depends(get_current_user)):
    """Get all campaign invitations for the current influencer."""
    return CampaignService.get_influencer_invitations(current_user["id"])

@router.post("/campaigns/{campaign_id}/respond")
async def respond_to_invitation(
    campaign_id: str,
    response: InvitationResponse,
    current_user: dict = Depends(get_current_user)
):
    """Accept or reject a campaign invitation."""
    success, error = CampaignService.respond_to_invitation(
        influencer_id=current_user["id"],
        campaign_id=campaign_id,
        accept=response.accept
    )
    if not success:
        raise HTTPException(status_code=400, detail=error or "Failed to respond to invitation")
    return {"success": True, "message": f"Invitation {'accepted' if response.accept else 'rejected'}"}

@router.post("/campaigns/{campaign_id}/status")
async def update_campaign_status(
    campaign_id: str,
    status_update: CampaignStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update working status of a campaign (in_progress, completed, etc)."""
    success, error = CampaignService.update_campaign_status(
        influencer_id=current_user["id"],
        campaign_id=campaign_id,
        new_status=status_update.status
    )
    if not success:
        raise HTTPException(status_code=400, detail=error or "Failed to update status")
    return {"success": True, "message": f"Status updated to {status_update.status}"}


@router.get("/past-campaigns")
async def get_past_campaigns(current_user: dict = Depends(get_current_user)):
    """Get past sponsorship campaigns for the influencer."""
    return {
        "campaigns": [
            {
                "id": "camp_1",
                "brand": "NordVPN",
                "status": "Completed",
                "date": "2025-11-15",
                "payout": "$1,200",
                "deliverables": "60s integrated shoutout",
                "performance": "45k clicks"
            },
            {
                "id": "camp_2",
                "brand": "Skillshare",
                "status": "In Progress",
                "date": "2026-01-10",
                "payout": "$850",
                "deliverables": "Link in description + Mention",
                "performance": "Running"
            }
        ]
    }

@router.get("/top-influencers/{niche}")
async def get_top_influencers(niche: str, current_user: dict = Depends(get_current_user)):
    """
    Get top influencers in a specific niche for brands to discover.
    """
    try:
        from services.influencer_discovery_service import influencer_discovery_service
        
        # 1. Fetch from Platform Database (DB)
        db_influencers = influencer_discovery_service.discover_influencers(
            niche=niche,
            keywords=[niche],
            campaign_description=f"Looking for {niche} influencers",
            limit=5
        )
        
        # 2. Fetch from Live Market (Tavily)
        live_recommendations = get_ai_recommendations(niche, perspective="sponsor")
        
        mapped_recs = []
        
        # Process DB Results
        for item in db_influencers:
            inf = item.get("influencer", {})
            score = item.get("relevance_score", 0)
            reason = item.get("ai_analysis") or f"Platform Match: {score}% relevance based on profile analysis."
            
            # Get thumbnail from first channel if available
            channels = inf.get("youtube_channels", [])
            thumb = channels[0].get("thumbnail_url") if channels else None
            # Or use UI Avatars
            if not thumb:
                 thumb = f"https://ui-avatars.com/api/?name={inf.get('full_name', 'User')}&background=random"

            mapped_recs.append({
                "name": inf.get("full_name") or inf.get("username", "Unknown"),
                "niche": niche,
                "thumbnail_url": thumb,
                "fit_score": int(score),
                "reason": reason,
                "source": "Platform" # To distinguish in UI if needed
            })

        # Process Live Results
        for r in live_recommendations:
            mapped_recs.append({
                "name": r.get('name'),
                "niche": r.get('industry', niche),
                "thumbnail_url": r.get('logo_url'),
                "fit_score": r.get('fit_score'),
                "reason": r.get('reason'),
                "source": "Web Search"
            })
            
        # Fallback if both empty
        if not mapped_recs:
            influencers_map = {
                "Tech": [
                    {"name": "Marques Brownlee", "handle": "@mkbhd", "engagement_rate": 8.5, "subscribers": "18.5M", "score": 98, "logo_url": "https://ui-avatars.com/api/?name=MKBHD&background=000&color=fff"},
                    {"name": "Linus Tech Tips", "handle": "@LinusTechTips", "engagement_rate": 7.2, "subscribers": "15.6M", "score": 95, "logo_url": "https://ui-avatars.com/api/?name=LTT&background=FF6600&color=fff"},
                    {"name": "iJustine", "handle": "@ijustine", "engagement_rate": 6.8, "subscribers": "7.1M", "score": 92, "logo_url": "https://ui-avatars.com/api/?name=iJustine&background=FF69B4&color=fff"}
                ]
            }
            # ... (Existing mock logic simplified for brevity, or kept as failsafe)
            mock_list = influencers_map.get(niche, influencers_map["Tech"])
            for m in mock_list:
                mapped_recs.append({
                    "name": m.get("name"),
                    "niche": niche,
                    "thumbnail_url": m.get("logo_url"),
                    "fit_score": m.get("score"),
                    "reason": "Top trending creator in this category.",
                    "source": "Trending"
                })

        # Sort by score
        mapped_recs.sort(key=lambda x: x.get("fit_score", 0), reverse=True)
            
        return {
            "niche": niche,
            "top_influencers": mapped_recs
        }
    except Exception as e:
        logger.error(f"Error fetching top influencers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch top influencers")


@router.get("/top-influencers")
async def get_top_influencers(
    niche: str = "",
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """
    Get top influencers for dashboard (Mock).
    """
    # Return list as expected by frontend
    return [
        {
            "influencer_id": "inf_top_1",
            "username": "TechReviewerPro",
            "full_name": "Tech Reviewer Pro",
            "niche": "Technology",
            "score": 98,
            "followers": 1500000,
            "engagement_rate": 8.5,
            "logo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Tech"
        },
        {
            "influencer_id": "inf_top_2",
            "username": "GadgetGuru",
            "full_name": "Gadget Guru",
            "niche": "Consumer Electronics",
            "score": 92,
            "followers": 850000,
            "engagement_rate": 7.2,
            "logo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Guru"
        },
        {
            "influencer_id": "inf_top_3",
            "username": "DailyVlogger",
            "full_name": "Daily Vlogs",
            "niche": "Lifestyle",
            "score": 85,
            "followers": 2100000,
            "engagement_rate": 4.5,
            "logo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Vlog"
        },
         {
            "influencer_id": "inf_top_4",
            "username": "CreativeSpace",
            "full_name": "Creative Space",
            "niche": "Art",
            "score": 82,
            "followers": 500000,
            "engagement_rate": 6.8,
            "logo_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Art"
        }
    ]
