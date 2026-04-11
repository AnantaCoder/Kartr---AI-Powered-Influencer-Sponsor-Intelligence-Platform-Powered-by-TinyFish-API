"""
Influencer Discovery Service - AI-powered influencer matching for sponsors.

Uses a hybrid approach:
1. Keyword matching against influencer profiles
2. YouTube channel analytics and content analysis
3. Gemini AI for semantic relevance scoring
"""
import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

from config import settings
from database import (
    get_mock_db,
    get_users_repository,
    get_youtube_channels_repository,
    is_firebase_configured
)

logger = logging.getLogger(__name__)

# Gemini initialization
GEMINI_AVAILABLE = False
try:
    import google.generativeai as genai
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
except ImportError:
    logger.warning("google-generativeai not installed. AI matching unavailable.")


class InfluencerDiscoveryService:
    """Service for discovering and matching influencers to campaigns."""
    
    @staticmethod
    def discover_influencers(
        niche: str,
        keywords: List[str],
        campaign_description: str,
        name: str = "",
        budget_min: Optional[float] = None,
        budget_max: Optional[float] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Discover influencers matching campaign criteria.
        
        Args:
            niche: Campaign niche (e.g., "home appliances", "fashion")
            keywords: List of relevant keywords
            campaign_description: Full campaign description for AI matching
            name: Filter by name/username
            budget_min: Minimum budget (for future filtering)
            budget_max: Maximum budget (for future filtering)
            limit: Maximum results to return
            
        Returns:
            List of matched influencers with scores and analytics
        """
        all_keywords = set([k.lower() for k in keywords])
        niche_lower = niche.lower()
        name_lower = name.lower().strip() if name else ""
        
        # Step 1: Get all influencers with their YouTube data
        influencers_with_data = InfluencerDiscoveryService._get_influencers_with_youtube()

        # Filter by name if provided
        if name_lower:
            influencers_with_data = [
                inf for inf in influencers_with_data
                if name_lower in inf.get("full_name", "").lower() or name_lower in inf.get("username", "").lower()
            ]
        
        # Step 2: Calculate base scores using keyword matching
        scored_influencers = []
        for influencer in influencers_with_data:
            base_score = InfluencerDiscoveryService._calculate_keyword_score(
                influencer,
                all_keywords,
                niche_lower
            )
            
            if base_score > 0:
                scored_influencers.append({
                    "influencer": influencer,
                    "base_score": base_score,
                    "matching_keywords": list(all_keywords)
                })
        
        # Step 3: Enhance scores with AI if available and we have candidates
        if GEMINI_AVAILABLE and scored_influencers:
            scored_influencers = InfluencerDiscoveryService._enhance_with_ai(
                scored_influencers,
                niche,
                keywords,
                campaign_description
            )
        
        # Sort by final score
        scored_influencers.sort(key=lambda x: x.get("final_score", x.get("base_score", 0)), reverse=True)
        
        # Format results
        results = []
        for item in scored_influencers[:limit]:
            inf = item["influencer"]
            youtube_data = inf.get("youtube_channels", [])
            
            # Aggregate channel stats
            channel_stats = None
            if youtube_data:
                total_subs = sum(ch.get("subscriber_count", 0) for ch in youtube_data)
                total_views = sum(ch.get("view_count", 0) for ch in youtube_data)
                avg_videos = sum(ch.get("video_count", 0) for ch in youtube_data) // len(youtube_data)
                channel_stats = {
                    "total_subscribers": total_subs,
                    "total_views": total_views,
                    "total_channels": len(youtube_data),
                    "average_videos": avg_videos,
                    "channels": [
                        {
                            "title": ch.get("title", ""),
                            "subscribers": ch.get("subscriber_count", 0),
                            "niche": ch.get("niche", "")
                        }
                        for ch in youtube_data[:3]  # Top 3 channels
                    ]
                }
            
            results.append({
                "influencer_id": inf.get("id"),
                "username": inf.get("username"),
                "full_name": inf.get("full_name", ""),
                "relevance_score": round(item.get("final_score", item.get("base_score", 0)), 1),
                "matching_keywords": item.get("matching_keywords", [])[:5],
                "channel_stats": channel_stats,
                "ai_analysis": item.get("ai_analysis"),
                "status": "suggested"
            })
        
        return results
    
    @staticmethod
    def _get_influencers_with_youtube() -> List[Dict[str, Any]]:
        """Get all influencers with their linked YouTube channels."""
        influencers = []
        
        if is_firebase_configured():
            users_repo = get_users_repository()
            channels_repo = get_youtube_channels_repository()
            
            if users_repo:
                try:
                    all_users = users_repo.find_all(limit=1000) or []
                    influencer_users = [
                        u for u in all_users 
                        if u.get("user_type") == "influencer"
                    ]
                    
                    # Get YouTube channels for each influencer
                    if channels_repo:
                        for inf in influencer_users:
                            channels = channels_repo.find_by_field("user_id", inf.get("id")) or []
                            inf["youtube_channels"] = channels
                    
                    influencers = influencer_users
                except Exception as e:
                    logger.error(f"Error fetching influencers from Firebase: {e}")
        else:
            # Mock database
            mock_db = get_mock_db()
            influencer_users = [
                u for u in mock_db._users.values()
                if u.get("user_type") == "influencer"
            ]
            
            # Get channels for each
            for inf in influencer_users:
                channels = mock_db.get_channels_by_user(inf.get("id"))
                inf["youtube_channels"] = channels
            
            influencers = influencer_users
        
        return influencers
    
    @staticmethod
    def _calculate_keyword_score(
        influencer: Dict[str, Any],
        keywords: set,
        niche: str
    ) -> float:
        """Calculate base relevance score using keyword matching."""
        score = 0.0
        
        username = influencer.get("username", "").lower()
        full_name = influencer.get("full_name", "").lower()
        
        # Check keywords in profile
        for keyword in keywords:
            if keyword in username:
                score += 15
            if keyword in full_name:
                score += 10
        
        # Check niche match
        if niche:
            if niche in username:
                score += 20
            if niche in full_name:
                score += 15
        
        # Check YouTube channel data
        youtube_channels = influencer.get("youtube_channels", [])
        for channel in youtube_channels:
            channel_title = channel.get("title", "").lower()
            channel_desc = channel.get("description", "").lower()
            channel_niche = channel.get("niche", "").lower()
            
            # Niche match in channel
            if niche and niche in channel_niche:
                score += 25
            elif niche and niche in channel_title:
                score += 20
            elif niche and niche in channel_desc:
                score += 10
            
            # Keyword match in channel
            for keyword in keywords:
                if keyword in channel_title:
                    score += 15
                if keyword in channel_desc:
                    score += 5
            
            # Subscriber bonus
            subs = channel.get("subscriber_count", 0)
            if subs > 1000000:
                score += 15
            elif subs > 100000:
                score += 10
            elif subs > 10000:
                score += 5
        
        # Base score for being an active influencer with channels
        if youtube_channels:
            score += 5
        
        return min(score, 100)
    
    @staticmethod
    def _enhance_with_ai(
        candidates: List[Dict[str, Any]],
        niche: str,
        keywords: List[str],
        campaign_description: str
    ) -> List[Dict[str, Any]]:
        """Use Gemini AI to enhance relevance scoring."""
        if not GEMINI_AVAILABLE:
            return candidates
        
        # Prepare batch analysis for efficiency
        influencer_summaries = []
        for item in candidates[:10]:  # Limit AI calls
            inf = item["influencer"]
            channels = inf.get("youtube_channels", [])
            
            channel_info = ""
            if channels:
                channel_info = ", ".join([
                    f"{ch.get('title', 'Unknown')} ({ch.get('subscriber_count', 0)} subs)"
                    for ch in channels[:3]
                ])
            
            influencer_summaries.append({
                "index": candidates.index(item),
                "username": inf.get("username", ""),
                "full_name": inf.get("full_name", ""),
                "channels": channel_info
            })
        
        prompt = f"""
You are helping a sponsor find the best influencers for their campaign.

Campaign Details:
- Niche: {niche}
- Keywords: {', '.join(keywords)}
- Description: {campaign_description[:500]}

Here are the candidate influencers:
{json.dumps(influencer_summaries, indent=2)}

For each candidate, provide a relevance score (0-100) and a brief reason.
Return ONLY a valid JSON array like this:
[
  {{"index": 0, "ai_score": 85, "reason": "Strong match because..."}},
  {{"index": 1, "ai_score": 70, "reason": "Moderate match..."}}
]
"""
        
        try:
            model = genai.GenerativeModel(settings.GEMINI_TEXT_MODEL)
            response = model.generate_content(prompt)
            
            if response.text:
                # Parse AI response
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                
                ai_results = json.loads(text.strip())
                
                # Merge AI scores
                for ai_result in ai_results:
                    idx = ai_result.get("index")
                    if idx is not None and idx < len(candidates):
                        ai_score = ai_result.get("ai_score", 0)
                        base_score = candidates[idx].get("base_score", 0)
                        
                        # Weighted combination: 40% keyword, 60% AI
                        final_score = (base_score * 0.4) + (ai_score * 0.6)
                        
                        candidates[idx]["ai_score"] = ai_score
                        candidates[idx]["final_score"] = final_score
                        candidates[idx]["ai_analysis"] = ai_result.get("reason", "")
                        
        except Exception as e:
            logger.error(f"AI enhancement failed: {e}")
            # Fall back to base scores
            for item in candidates:
                item["final_score"] = item.get("base_score", 0)
        
        return candidates
    
    @staticmethod
    def get_influencer_details(influencer_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific influencer."""
        influencer = None
        
        if is_firebase_configured():
            users_repo = get_users_repository()
            channels_repo = get_youtube_channels_repository()
            
            if users_repo:
                influencer = users_repo.find_by_id(influencer_id)
                
                if influencer and channels_repo:
                    channels = channels_repo.find_by_field("user_id", influencer_id) or []
                    influencer["youtube_channels"] = channels
        else:
            mock_db = get_mock_db()
            influencer = mock_db.get_user_by_id(influencer_id)
            
            if influencer:
                channels = mock_db.get_channels_by_user(influencer_id)
                influencer["youtube_channels"] = channels
        
        if influencer:
            # Remove sensitive data
            influencer.pop("password_hash", None)
            influencer.pop("bluesky_password", None)
        
        return influencer


# Global service instance
influencer_discovery_service = InfluencerDiscoveryService()
