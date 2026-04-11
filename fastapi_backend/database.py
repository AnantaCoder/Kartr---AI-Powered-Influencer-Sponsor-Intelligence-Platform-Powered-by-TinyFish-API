"""
Database access layer.

This module provides database access abstraction. It uses Firebase Firestore
as the primary database, with a mock in-memory fallback for development.
"""
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Firebase availability check
try:
    from firebase_config import (
        FIREBASE_AVAILABLE,
        initialize_firebase,
        get_firestore,
        FirestoreRepository,
    )
except ImportError:
    FIREBASE_AVAILABLE = False
    initialize_firebase = lambda: False
    get_firestore = lambda: None
    FirestoreRepository = None
    logger.warning("Firebase config not found. Using mock database only.")


def is_firebase_configured() -> bool:
    """Check if Firebase is properly configured and available."""
    if not FIREBASE_AVAILABLE:
        return False
    return initialize_firebase()


def get_db_client():
    """
    Get the database client.
    
    Returns Firestore client if available, otherwise None.
    Use get_mock_db() as fallback when this returns None.
    """
    return get_firestore()


# Backward compatibility alias
def get_supabase_client():
    """
    Deprecated: Use get_db_client() instead.
    
    Kept for backward compatibility during migration.
    """
    return get_db_client()


def get_db():
    """Dependency function for FastAPI route injection."""
    return get_db_client()


# =============================================================================
# Repository Factory
# =============================================================================

def get_users_repository() -> Optional['FirestoreRepository']:
    """Get repository for users collection."""
    if not is_firebase_configured():
        return None
    return FirestoreRepository('users')


def get_youtube_channels_repository() -> Optional['FirestoreRepository']:
    """Get repository for youtube_channels collection."""
    if not is_firebase_configured():
        return None
    return FirestoreRepository('youtube_channels')


def get_searches_repository() -> Optional['FirestoreRepository']:
    """Get repository for searches collection."""
    if not is_firebase_configured():
        return None
    return FirestoreRepository('searches')


def get_chat_conversations_repository() -> Optional['FirestoreRepository']:
    """Get repository for chat_conversations collection."""
    if not is_firebase_configured():
        return None
    return FirestoreRepository('chat_conversations')


def get_chat_messages_repository() -> Optional['FirestoreRepository']:
    """Get repository for chat_messages collection."""
    if not is_firebase_configured():
        return None
    return FirestoreRepository('chat_messages')


def get_virtual_influencers_repository() -> Optional['FirestoreRepository']:
    """Get repository for virtual_influencers collection."""
    if not is_firebase_configured():
        return None
    return FirestoreRepository('virtual_influencers')


def get_campaigns_repository() -> Optional['FirestoreRepository']:
    """Get repository for campaigns collection."""
    if not is_firebase_configured():
        return None
    return FirestoreRepository('campaigns')


def get_campaign_influencers_repository() -> Optional['FirestoreRepository']:
    """Get repository for campaign_influencers collection."""
    if not is_firebase_configured():
        return None
    return FirestoreRepository('campaign_influencers')


# =============================================================================
# Mock Database for Development
# =============================================================================

class MockDatabase:
    """
    In-memory mock database for development without Firebase.
    
    Provides the same interface as the Firebase repositories for testing
    and development purposes. Data is not persisted between restarts.
    """
    
    def __init__(self):
        self._users: Dict[str, Dict[str, Any]] = {}
        self._youtube_channels: Dict[str, Dict[str, Any]] = {}
        self._searches: Dict[str, Dict[str, Any]] = {}
        self._campaigns: Dict[str, Dict[str, Any]] = {}
        self._campaign_influencers: Dict[str, Dict[str, Any]] = {}
        self._id_counters = {
            'users': 0,
            'youtube_channels': 0,
            'searches': 0,
            'virtual_influencers': 0,
            'campaigns': 0,
            'campaign_influencers': 0,
        }
        self._virtual_influencers: Dict[str, Dict[str, Any]] = {}
        
        # Initialize default virtual influencers
        self._initialize_default_vis()
        
        # Initialize default users with BlueSky creds from env
        self._initialize_default_users()

    def _initialize_default_users(self):
        from config import settings
        from utils.security import hash_password
        
        bs_handle = getattr(settings, 'BLUESKY_HANDLE', None)
        bs_password = getattr(settings, 'BLUESKY_PASSWORD', None)
        
        # Create a default sponsor user if creds exist
        if bs_handle and bs_password:
             self.create_user({
                 "username": "sponsor_demo",
                 "email": "sponsor@kartr.ai",
                 "password_hash": hash_password("demo123"), # Default password
                 "user_type": "sponsor",
                 "full_name": "Demo Sponsor",
                 "bluesky_handle": bs_handle,
                 "bluesky_password": bs_password,
                 "date_registered": "2024-01-01T00:00:00Z"
             })
             logger.info(f"Initialized default Sponsor with BlueSky: {bs_handle}")

    def _initialize_default_vis(self):
        defaults = [
            {
                "id": "vi_001",
                "name": "Luna Digital",
                "description": "AI-powered lifestyle and fashion influencer with engaging content creation abilities.",
                "avatar_url": "/static/images/virtual_influencer_1.png",
                "specialties": ["Fashion", "Lifestyle", "Beauty"],
                "price_range": "$500 - $2000 per post"
            },
            {
                "id": "vi_002",
                "name": "TechBot Max",
                "description": "Virtual tech reviewer and gadget enthusiast for product demonstrations.",
                "avatar_url": "/static/images/virtual_influencer_2.png",
                "specialties": ["Technology", "Gaming", "Reviews"],
                "price_range": "$750 - $3000 per video"
            },
            {
                "id": "vi_003",
                "name": "FitVirtual",
                "description": "AI fitness coach and wellness advocate for health brand partnerships.",
                "avatar_url": "/static/images/virtual_influencer_3.png",
                "specialties": ["Fitness", "Health", "Nutrition"],
                "price_range": "$400 - $1500 per campaign"
            },
            {
                "id": "vi_004",
                "name": "Artisan AI",
                "description": "Creative virtual artist for design and art-focused brand collaborations.",
                "avatar_url": "/static/images/virtual_influencer_4.png",
                "specialties": ["Art", "Design", "Creativity"],
                "price_range": "$600 - $2500 per project"
            },
        ]
        for vi in defaults:
            self._virtual_influencers[vi['id']] = vi
    
    def _generate_id(self, collection: str) -> str:
        """Generate a unique ID for a collection."""
        self._id_counters[collection] += 1
        return str(self._id_counters[collection])
    
    # -------------------------------------------------------------------------
    # User Operations
    # -------------------------------------------------------------------------
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user."""
        user_id = self._generate_id('users')
        user = user_data.copy()
        user['id'] = user_id
        self._users[user_id] = user
        logger.debug(f"MockDB: Created user {user_id}")
        return user
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email address."""
        for user in self._users.values():
            if user.get('email') == email:
                return user
        return None
    
    def get_user_by_id(self, user_id) -> Optional[Dict[str, Any]]:
        """Get user by ID."""
        return self._users.get(str(user_id))
    
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username."""
        for user in self._users.values():
            if user.get('username') == username:
                return user
        return None
    
    def update_user(self, user_id, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user data."""
        user_id = str(user_id)
        if user_id not in self._users:
            return None
        self._users[user_id].update(data)
        logger.debug(f"MockDB: Updated user {user_id}")
        return self._users[user_id]
    
    # -------------------------------------------------------------------------
    # YouTube Channel Operations
    # -------------------------------------------------------------------------
    
    def create_youtube_channel(self, channel_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a YouTube channel record."""
        channel_id = self._generate_id('youtube_channels')
        channel = channel_data.copy()
        channel['id'] = channel_id
        self._youtube_channels[channel_id] = channel
        logger.debug(f"MockDB: Created youtube_channel {channel_id}")
        return channel
    
    def get_channels_by_user(self, user_id) -> List[Dict[str, Any]]:
        """Get all channels for a user."""
        user_id_str = str(user_id)
        return [
            ch for ch in self._youtube_channels.values()
            if str(ch.get('user_id')) == user_id_str
        ]
    
    def get_channel_by_id(self, channel_id: str, user_id) -> Optional[Dict[str, Any]]:
        """Get a specific channel for a user."""
        channel = self._youtube_channels.get(str(channel_id))
        if channel and str(channel.get('user_id')) == str(user_id):
            return channel
        return None
    
    def update_youtube_channel(self, channel_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a YouTube channel record."""
        channel_id = str(channel_id)
        if channel_id not in self._youtube_channels:
            return None
        self._youtube_channels[channel_id].update(data)
        return self._youtube_channels[channel_id]
    
    def search_channels(self, query: str) -> List[Dict[str, Any]]:
        """Search channels by title (case-insensitive)."""
        query_lower = query.lower()
        return [
            ch for ch in self._youtube_channels.values()
            if query_lower in ch.get('title', '').lower()
        ]
    
    # -------------------------------------------------------------------------
    # Search History Operations
    # -------------------------------------------------------------------------
    
    def create_search(self, search_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a search history record."""
        search_id = self._generate_id('searches')
        search = search_data.copy()
        search['id'] = search_id
        self._searches[search_id] = search
        logger.debug(f"MockDB: Created search record {search_id}")
        return search
    
    def get_searches_by_user(self, user_id, limit: int = 50) -> List[Dict[str, Any]]:
        """Get search history for a user."""
        user_id_str = str(user_id)
        results = [
            s for s in self._searches.values()
            if str(s.get('user_id')) == user_id_str
        ]
        # Sort by date descending and limit
        results.sort(key=lambda x: x.get('date_searched', ''), reverse=True)
        return results[:limit]

    # -------------------------------------------------------------------------
    # Virtual Influencer Operations
    # -------------------------------------------------------------------------

    def create_virtual_influencer(self, vi_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new virtual influencer."""
        # Use provided ID if available, else generate one
        vi_id = vi_data.get('id') or self._generate_id('virtual_influencers')
        vi = vi_data.copy()
        vi['id'] = vi_id
        self._virtual_influencers[vi_id] = vi
        logger.debug(f"MockDB: Created virtual_influencer {vi_id}")
        return vi

    def get_all_virtual_influencers(self) -> List[Dict[str, Any]]:
        """Get all virtual influencers."""
        return list(self._virtual_influencers.values())

    def get_virtual_influencer_by_id(self, vi_id: str) -> Optional[Dict[str, Any]]:
        """Get virtual influencer by ID."""
        return self._virtual_influencers.get(str(vi_id))

    # -------------------------------------------------------------------------
    # Campaign Operations
    # -------------------------------------------------------------------------
    
    def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a campaign."""
        # Use provided ID if available (from Service uuid generation) or generate one
        campaign_id = campaign_data.get('id') or self._generate_id('campaigns')
        campaign = campaign_data.copy()
        campaign['id'] = campaign_id
        self._campaigns[campaign_id] = campaign
        return campaign
        
    def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Get campaign by ID."""
        return self._campaigns.get(str(campaign_id))
        
    def list_campaigns(self, sponsor_id: str) -> List[Dict[str, Any]]:
        """List campaigns for a sponsor."""
        return [
            c for c in self._campaigns.values() 
            if str(c.get('sponsor_id')) == str(sponsor_id)
        ]
        
    def update_campaign(self, campaign_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update campaign."""
        campaign_id = str(campaign_id)
        if campaign_id not in self._campaigns:
            return None
        self._campaigns[campaign_id].update(data)
        return self._campaigns[campaign_id]
        
    def delete_campaign(self, campaign_id: str) -> bool:
        """Delete campaign."""
        campaign_id = str(campaign_id)
        if campaign_id in self._campaigns:
            del self._campaigns[campaign_id]
            return True
        return False

    # -------------------------------------------------------------------------
    # Campaign Influencer Operations
    # -------------------------------------------------------------------------
    
    def add_campaign_influencer(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Add influencer to campaign (create record)."""
        record_id = self._generate_id('campaign_influencers')
        record = data.copy()
        record['id'] = record_id
        self._campaign_influencers[record_id] = record
        return record
        
    def get_campaign_influencers(self, campaign_id: str) -> List[Dict[str, Any]]:
        """Get all influencers for a campaign."""
        return [
            i for i in self._campaign_influencers.values()
            if str(i.get('campaign_id')) == str(campaign_id)
        ]
        
    def get_influencer_campaigns(self, influencer_id: str) -> List[Dict[str, Any]]:
        """Get all campaigns for an influencer."""
        return [
            i for i in self._campaign_influencers.values()
            if str(i.get('influencer_id')) == str(influencer_id)
        ]
        
    def get_campaign_influencer_record(self, campaign_id: str, influencer_id: str) -> Optional[Dict[str, Any]]:
        """Get specific campaign-influencer record."""
        for record in self._campaign_influencers.values():
            if str(record.get('campaign_id')) == str(campaign_id) and \
               str(record.get('influencer_id')) == str(influencer_id):
                return record
        return None
    
    def update_campaign_influencer(self, record_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update campaign-influencer record."""
        record_id = str(record_id)
        if record_id not in self._campaign_influencers:
            return None
        self._campaign_influencers[record_id].update(data)
        return self._campaign_influencers[record_id]


# Global mock database instance (singleton)
_mock_db: Optional[MockDatabase] = None


def get_mock_db() -> MockDatabase:
    """
    Get the mock database instance.
    
    This is used when Firebase is not configured or for testing.
    """
    global _mock_db
    if _mock_db is None:
        _mock_db = MockDatabase()
        logger.info("Initialized mock database for development")
    return _mock_db
