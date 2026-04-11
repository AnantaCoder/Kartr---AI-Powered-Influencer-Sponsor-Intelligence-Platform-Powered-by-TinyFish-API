"""
Campaign Service - Business logic for campaign management.

Provides methods for sponsors to:
- Create and manage campaigns
- Find matching influencers using AI + keyword matching
- Track campaign performance
"""
import logging
import re
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from database import (
    get_mock_db,
    is_firebase_configured
)

logger = logging.getLogger(__name__)


class CampaignService:
    """Service for sponsor campaign operations."""
    
    # In-memory storage for campaigns (will be replaced with Firebase)
    _campaigns: Dict[str, Dict[str, Any]] = {}
    _campaign_influencers: Dict[str, List[Dict[str, Any]]] = {}
    
    @staticmethod
    def create_campaign(sponsor_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new campaign."""
        campaign_id = f"campaign_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow().isoformat()
        
        campaign_data = {
            "id": campaign_id,
            "sponsor_id": sponsor_id,
            "name": data.get("name"),
            "description": data.get("description"),
            "niche": data.get("niche"),
            "target_audience": data.get("target_audience"),
            "budget_min": data.get("budget_min"),
            "budget_max": data.get("budget_max"),
            "keywords": data.get("keywords", []),
            "requirements": data.get("requirements"),
            "status": "active",  # Campaigns are active by default
            "created_at": now,
            "updated_at": now,
            "matched_influencers_count": 0
        }
        
        if is_firebase_configured():
            from database import get_campaigns_repository
            repo = get_campaigns_repository()
            if repo:
                result = repo.create(campaign_data, campaign_id)
                if result:
                    logger.info(f"Campaign {campaign_id} saved to Firebase successfully")
                else:
                    logger.error(f"Failed to save campaign {campaign_id} to Firebase")
            else:
                logger.error("Campaigns repository is None - Firebase may not be configured correctly")
        else:
            get_mock_db().create_campaign(campaign_data)
            logger.info(f"Campaign {campaign_id} saved to mock database")
        
        logger.info(f"Created campaign {campaign_id} for sponsor {sponsor_id}")
        return campaign_data
    
    @staticmethod
    def list_campaigns(sponsor_id: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """List campaigns for a sponsor."""
        campaigns = []
        if is_firebase_configured():
            from database import get_campaigns_repository
            repo = get_campaigns_repository()
            if repo:
                all_campaigns = repo.find_by_field("sponsor_id", sponsor_id) or []
                campaigns = all_campaigns
        else:
            campaigns = get_mock_db().list_campaigns(sponsor_id)
        
        # Enrich each campaign with influencer stage counts
        for campaign in campaigns:
            campaign["influencer_stages"] = CampaignService._get_influencer_stages(campaign.get("id"))
        
        # Sort by created_at descending
        campaigns.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        total_count = len(campaigns)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        return {
            "campaigns": campaigns[start_idx:end_idx],
            "total_count": total_count,
            "page": page,
            "page_size": page_size
        }
    
    @staticmethod
    def get_latest_campaign(sponsor_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent campaign for a sponsor."""
        campaigns = []
        if is_firebase_configured():
            from database import get_campaigns_repository
            repo = get_campaigns_repository()
            if repo:
                all_campaigns = repo.find_by_field("sponsor_id", sponsor_id) or []
                campaigns = all_campaigns
        else:
            campaigns = get_mock_db().list_campaigns(sponsor_id)
        
        if not campaigns:
            return None
            
        # Sort by created_at descending and get the first one
        campaigns.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        latest = campaigns[0]
        
        # Enrich with stages
        latest["influencer_stages"] = CampaignService._get_influencer_stages(latest.get("id"))
        return latest
    
    @staticmethod
    def _get_influencer_stages(campaign_id: str) -> Dict[str, int]:
        """Get influencer stage counts for a campaign."""
        stages = {
            "invited": 0,
            "accepted": 0,
            "in_progress": 0,
            "completed": 0,
            "rejected": 0
        }
        
        if not campaign_id:
            return stages
            
        records = []
        if is_firebase_configured():
            from database import get_campaign_influencers_repository
            repo = get_campaign_influencers_repository()
            if repo:
                records = repo.find_by_field("campaign_id", campaign_id) or []
        else:
            records = get_mock_db().get_campaign_influencers(campaign_id) or []
        
        for record in records:
            status = record.get("status", "invited")
            if status in stages:
                stages[status] += 1
            else:
                stages["invited"] += 1  # Default to invited for unknown status
        
        return stages
    
    @staticmethod
    def get_campaign(campaign_id: str, sponsor_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get campaign by ID."""
        campaign = None
        if is_firebase_configured():
            from database import get_campaigns_repository
            repo = get_campaigns_repository()
            if repo:
                campaign = repo.find_by_id(campaign_id)
        else:
            campaign = get_mock_db().get_campaign(campaign_id)
        
        if not campaign:
            return None
        
        if sponsor_id and campaign.get("sponsor_id") != sponsor_id:
            return None
        
        return campaign
    
    @staticmethod
    def update_campaign(campaign_id: str, sponsor_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a campaign."""
        campaign = CampaignService.get_campaign(campaign_id, sponsor_id)
        if not campaign:
            return None
        
        # Filter update data
        update_data = {k: v for k, v in data.items() if v is not None and k not in ["id", "sponsor_id", "created_at"]}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        if is_firebase_configured():
            from database import get_campaigns_repository
            repo = get_campaigns_repository()
            if repo:
                repo.update(campaign_id, update_data)
                # Merge for return
                campaign.update(update_data)
        else:
            get_mock_db().update_campaign(campaign_id, update_data)
            campaign.update(update_data)
        
        return campaign
    
    @staticmethod
    def delete_campaign(campaign_id: str, sponsor_id: str) -> bool:
        """Delete a campaign."""
        campaign = CampaignService.get_campaign(campaign_id, sponsor_id)
        if not campaign:
            return False
            
        if is_firebase_configured():
            from database import get_campaigns_repository
            repo = get_campaigns_repository()
            if repo:
                repo.delete(campaign_id)
        else:
            get_mock_db().delete_campaign(campaign_id)
            
        logger.info(f"Deleted campaign {campaign_id}")
        return True
    
    @staticmethod
    def find_matching_influencers(campaign_id: str, sponsor_id: str) -> List[Dict[str, Any]]:
        """Find matching influencers."""
        campaign = CampaignService.get_campaign(campaign_id, sponsor_id)
        if not campaign:
            return []
            
        from services.influencer_discovery_service import influencer_discovery_service
        matched = influencer_discovery_service.discover_influencers(
            niche=campaign.get("niche", ""),
            keywords=campaign.get("keywords", []),
            campaign_description=campaign.get("description", ""),
            budget_min=campaign.get("budget_min"),
            budget_max=campaign.get("budget_max"),
            limit=20
        )
        
        # Update match count
        CampaignService.update_campaign(campaign_id, sponsor_id, {"matched_influencers_count": len(matched)})
        return matched
    
    @staticmethod
    def add_influencer_to_campaign(campaign_id: str, sponsor_id: str, influencer_id: str, notes: Optional[str] = None) -> bool:
        """Add influencer to campaign."""
        campaign = CampaignService.get_campaign(campaign_id, sponsor_id)
        if not campaign:
            return False
            
        # Check existing
        existing = False
        if is_firebase_configured():
            from database import get_campaign_influencers_repository
            repo = get_campaign_influencers_repository()
            if repo:
                records = repo.find_by_field("campaign_id", campaign_id) or []
                existing = any(r.get("influencer_id") == influencer_id for r in records)
        else:
            existing = get_mock_db().get_campaign_influencer_record(campaign_id, influencer_id) is not None
            
        if existing:
            logger.info(f"Influencer {influencer_id} is already in campaign {campaign_id} (skipping duplicate add)")
            return True
            
        record_data = {
            "campaign_id": campaign_id,
            "influencer_id": influencer_id,
            "notes": notes,
            "status": "invited",
            "added_at": datetime.utcnow().isoformat()
        }
        
        if is_firebase_configured():
            from database import get_campaign_influencers_repository
            repo = get_campaign_influencers_repository()
            if repo:
                # Generate a unique ID for the campaign-influencer record
                rec_id = f"ci_{uuid.uuid4().hex[:12]}"
                result = repo.create(record_data, rec_id)
                if result:
                    logger.info(f"Created invitation {rec_id} for influencer {influencer_id} in campaign {campaign_id}")
                else:
                    logger.error(f"Failed to create invitation for influencer {influencer_id} in campaign {campaign_id}")
                    return False
        else:
            get_mock_db().add_campaign_influencer(record_data)
            
        logger.info(f"Influencer {influencer_id} added to campaign {campaign_id} with status 'invited'")
        return True
    
    @staticmethod
    def get_campaign_influencers(campaign_id: str, sponsor_id: str) -> List[Dict[str, Any]]:
        """Get influencers for a campaign."""
        campaign = CampaignService.get_campaign(campaign_id, sponsor_id)
        if not campaign:
            return []
            
        records = []
        if is_firebase_configured():
            from database import get_campaign_influencers_repository
            repo = get_campaign_influencers_repository()
            if repo:
                records = repo.find_by_field("campaign_id", campaign_id) or []
        else:
            records = get_mock_db().get_campaign_influencers(campaign_id)
            
        # Enrich with influencer details and return flat structure matching InfluencerMatch schema
        from services.influencer_discovery_service import influencer_discovery_service
        results = []
        for record in records:
            inf = influencer_discovery_service.get_influencer_details(record["influencer_id"])
            if inf:
                match_score = CampaignService._calculate_match_score(
                    inf, set(campaign.get("keywords", [])), campaign.get("niche", "")
                )
                # Flatten the structure to match InfluencerMatch schema
                results.append({
                    "influencer_id": record["influencer_id"],
                    "username": inf.get("username") or inf.get("channel_title") or "Unknown",
                    "full_name": inf.get("full_name") or inf.get("channel_title") or "",
                    "relevance_score": match_score,
                    "matching_keywords": list(set(campaign.get("keywords", [])) & set(inf.get("keywords", []))),
                    "status": record.get("status", "invited"),
                    "notes": record.get("notes"),
                    "ai_analysis": inf.get("ai_analysis"),
                    "added_at": record.get("added_at"),
                    "post_url": record.get("post_url")  # For completed posts
                })
        return results

    @staticmethod
    def get_influencer_invitations(influencer_id: str) -> List[Dict[str, Any]]:
        """
        Get all campaign invitations for an influencer.
        
        Args:
            influencer_id: The ID of the influencer
            
        Returns:
            List of campaigns with status
        """
        records = []
        if is_firebase_configured():
            from database import get_campaign_influencers_repository
            repo = get_campaign_influencers_repository()
            if repo:
                records = repo.find_by_field("influencer_id", influencer_id) or []
                logger.info(f"Found {len(records)} invitation records for influencer {influencer_id}")
        else:
            records = get_mock_db().get_influencer_campaigns(influencer_id)
            
        # Enrich with campaign details
        results = []
        for record in records:
            # We need to fetch campaign details. 
            # Note: get_campaign requires sponsor_id ownership check usually, 
            # so we need a bypass or separate method. 
            # safe fetch by ID directly from DB
            
            campaign = None
            if is_firebase_configured():
                from database import get_campaigns_repository
                c_repo = get_campaigns_repository()
                if c_repo:
                    campaign = c_repo.find_by_id(record["campaign_id"])
            else:
                campaign = get_mock_db().get_campaign(record["campaign_id"])
                
            if campaign:
                # Fetch sponsor name
                sponsor_name = "Unknown Sponsor"
                if is_firebase_configured():
                    from database import get_users_repository
                    u_repo = get_users_repository()
                    if u_repo:
                        sponsor = u_repo.find_by_id(campaign.get("sponsor_id"))
                        if sponsor:
                            sponsor_name = sponsor.get("full_name") or sponsor.get("username")
                else:
                    sponsor = get_mock_db().get_user_by_id(campaign.get("sponsor_id"))
                    if sponsor:
                        sponsor_name = sponsor.get("full_name") or sponsor.get("username")

                # Only show invitation if it's still active/relevant
                # Assuming all invited records are valid for display
                results.append({
                    "campaign": campaign,
                    "sponsor_name": sponsor_name,
                    "status": record.get("status"),
                    "invited_at": record.get("added_at"),
                    "notes": record.get("notes")
                })
                 
        # Sort by invited_at desc
        results.sort(key=lambda x: x.get("invited_at", ""), reverse=True)
        return results

    @staticmethod
    def respond_to_invitation(
        influencer_id: str, 
        campaign_id: str, 
        accept: bool
    ) -> Tuple[bool, Optional[str]]:
        """
        Allow influencer to respond to a campaign invitation.
        
        Args:
            influencer_id: The ID of the influencer responding
            campaign_id: The ID of the campaign
            accept: True to accept, False to reject
            
        Returns:
            Tuple of (success, error_message)
        """
        # Find the campaign-influencer record
        record = None
        record_id = None
        
        if is_firebase_configured():
            from database import get_campaign_influencers_repository
            repo = get_campaign_influencers_repository()
            if repo:
                # Find records for this influencer and campaign
                records = repo.find_by_field("campaign_id", campaign_id) or []
                for r in records:
                    if r.get("influencer_id") == influencer_id:
                        record = r
                        record_id = r.get("id")
                        break
        else:
            record = get_mock_db().get_campaign_influencer_record(campaign_id, influencer_id)
            if record:
                record_id = record.get("id")
        
        if not record:
            return False, "Invitation not found"
            
        # Check current status - can only respond to invited status
        current_status = record.get("status")
        if current_status != "invited":
            return False, f"Cannot respond to invitation with status: {current_status}"
        
        # Update status
        new_status = "accepted" if accept else "rejected"
        update_data = {
            "status": new_status,
            "responded_at": datetime.utcnow().isoformat()
        }
        
        if is_firebase_configured():
            from database import get_campaign_influencers_repository
            repo = get_campaign_influencers_repository()
            if repo and record_id:
                repo.update(record_id, update_data)
        else:
            if record_id:
                get_mock_db().update_campaign_influencer(record_id, update_data)
        
        logger.info(f"Influencer {influencer_id} {new_status} campaign {campaign_id}")
        return True, None

    @staticmethod
    def update_campaign_status(
        influencer_id: str,
        campaign_id: str,
        new_status: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Allow influencer to update their job status for a campaign.
        
        Valid status transitions:
        - accepted -> in_progress
        - in_progress -> completed
        - in_progress -> cancelled
        
        Args:
            influencer_id: The ID of the influencer
            campaign_id: The ID of the campaign
            new_status: New status (in_progress, completed, cancelled)
            
        Returns:
            Tuple of (success, error_message)
        """
        valid_statuses = {"in_progress", "completed", "cancelled"}
        if new_status not in valid_statuses:
            return False, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        
        # Find the campaign-influencer record
        record = None
        record_id = None
        
        if is_firebase_configured():
            from database import get_campaign_influencers_repository
            repo = get_campaign_influencers_repository()
            if repo:
                records = repo.find_by_field("campaign_id", campaign_id) or []
                for r in records:
                    if r.get("influencer_id") == influencer_id:
                        record = r
                        record_id = r.get("id")
                        break
        else:
            record = get_mock_db().get_campaign_influencer_record(campaign_id, influencer_id)
            if record:
                record_id = record.get("id")
        
        if not record:
            return False, "Campaign record not found"
        
        current_status = record.get("status")
        
        # Validate status transitions
        valid_transitions = {
            "accepted": {"in_progress"},
            "in_progress": {"completed", "cancelled"}
        }
        
        if current_status not in valid_transitions:
            return False, f"Cannot update from status: {current_status}"
            
        if new_status not in valid_transitions.get(current_status, set()):
            return False, f"Invalid transition from {current_status} to {new_status}"
        
        # Update status
        update_data = {
            "status": new_status,
            "status_updated_at": datetime.utcnow().isoformat()
        }
        
        if new_status == "completed":
            update_data["completed_at"] = datetime.utcnow().isoformat()
        
        if is_firebase_configured():
            from database import get_campaign_influencers_repository
            repo = get_campaign_influencers_repository()
            if repo and record_id:
                repo.update(record_id, update_data)
        else:
            if record_id:
                get_mock_db().update_campaign_influencer(record_id, update_data)
        
        logger.info(f"Influencer {influencer_id} updated campaign {campaign_id} status to {new_status}")
        return True, None

    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        """Extract keywords from text using simple regex."""
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        stop_words = {
            "this", "that", "with", "from", "have", "been", "were", "will",
            "would", "could", "should", "about", "their", "what", "when",
            "where", "which", "while", "more", "other", "some", "than"
        }
        return [w for w in words if w not in stop_words][:10]
    
    @staticmethod
    def _calculate_match_score(influencer: Dict[str, Any], keywords: set, niche: str) -> float:
        """Calculate match score."""
        score = 0.0
        username = influencer.get("username", "").lower()
        full_name = influencer.get("full_name", "").lower()
        for keyword in keywords:
            if keyword in username or keyword in full_name:
                score += 20
        if niche and (niche in username or niche in full_name):
            score += 30
        if influencer.get("user_type") == "influencer":
            score += 10
        return min(score, 100)
