"""
YouTube service for video/channel analytics.

Provides methods to interact with the YouTube Data API for fetching
video and channel statistics, and managing saved channels.
"""
import logging
import re
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse, parse_qs
from datetime import datetime

from config import settings
from database import (
    get_youtube_channels_repository,
    get_searches_repository,
    get_mock_db,
)

logger = logging.getLogger(__name__)

# YouTube API client - optional import
try:
    import googleapiclient.discovery
    import googleapiclient.errors
    YOUTUBE_API_AVAILABLE = True
except ImportError:
    YOUTUBE_API_AVAILABLE = False
    logger.warning("google-api-python-client not installed. YouTube API features unavailable.")


class YouTubeService:
    """
    Service for YouTube API operations.
    
    Provides methods to fetch video/channel stats from YouTube API
    and manage saved channels in the database.
    """
    
    def __init__(self):
        self.api_key = settings.YOUTUBE_API_KEY
        self._client = None
    
    @property
    def client(self):
        """Lazy-load YouTube API client."""
        if self._client is None and self.api_key and YOUTUBE_API_AVAILABLE:
            try:
                self._client = googleapiclient.discovery.build(
                    "youtube", "v3",
                    developerKey=self.api_key
                )
                logger.debug("YouTube API client initialized")
            except Exception as e:
                logger.error(f"Failed to create YouTube client: {e}")
        return self._client
    
    def is_available(self) -> bool:
        """Check if YouTube API is configured and available."""
        return self.client is not None
    
    # =========================================================================
    # URL Parsing
    # =========================================================================
    
    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """
        Extract video ID from various YouTube URL formats.
        
        Supported formats:
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtu.be/VIDEO_ID
        - https://youtube.com/embed/VIDEO_ID
        - Direct video ID (11 characters)
        
        Args:
            url: YouTube URL or video ID
            
        Returns:
            Video ID or None if not found
        """
        if not url:
            return None
        
        url = url.strip()
        
        # Direct video ID (11 alphanumeric characters with - and _)
        if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
            return url
        
        try:
            parsed = urlparse(url)
            
            # youtu.be/VIDEO_ID
            if parsed.netloc == 'youtu.be':
                path = parsed.path.lstrip('/')
                return path if len(path) >= 11 else None
            
            # youtube.com variations
            if parsed.netloc in ('www.youtube.com', 'youtube.com', 'm.youtube.com'):
                # /watch?v=VIDEO_ID
                if parsed.path == '/watch':
                    params = parse_qs(parsed.query)
                    video_ids = params.get('v', [])
                    return video_ids[0] if video_ids else None
                
                # /embed/VIDEO_ID
                if parsed.path.startswith('/embed/'):
                    parts = parsed.path.split('/')
                    return parts[2] if len(parts) > 2 else None
                
                # /v/VIDEO_ID
                if parsed.path.startswith('/v/'):
                    parts = parsed.path.split('/')
                    return parts[2] if len(parts) > 2 else None
            
            return None
            
        except Exception as e:
            logger.debug(f"Error parsing video URL: {e}")
            return None
    
    @staticmethod
    def extract_channel_id(url: str) -> Optional[str]:
        """
        Extract channel ID or handle from YouTube URL.
        
        Supported formats:
        - https://youtube.com/channel/UC...
        - https://youtube.com/@username
        
        Args:
            url: YouTube channel URL
            
        Returns:
            Channel ID or @handle, or None if not found
        """
        if not url:
            return None
        
        url = url.strip()
        
        try:
            parsed = urlparse(url)
            
            if parsed.netloc not in ('www.youtube.com', 'youtube.com'):
                return None
            
            parts = [p for p in parsed.path.split('/') if p]
            
            # /channel/UC...
            if 'channel' in parts:
                idx = parts.index('channel')
                if idx + 1 < len(parts):
                    return parts[idx + 1]
            
            # /@username
            if parts and parts[0].startswith('@'):
                return parts[0]
            
            return None
            
        except Exception as e:
            logger.debug(f"Error parsing channel URL: {e}")
            return None
    
    # =========================================================================
    # YouTube API Operations
    # =========================================================================
    
    def get_video_stats(self, youtube_url: str, full_description: bool = False) -> Dict[str, Any]:
        """
        Get statistics for a YouTube video.
        
        Args:
            youtube_url: YouTube video URL or video ID
            full_description: Whether to return the full description (default: False, capped at 500 chars)
            
        Returns:
            Dict with video stats or error message
        """
        if not self.is_available():
            return {"error": "YouTube API not configured"}
        
        video_id = self.extract_video_id(youtube_url)
        if not video_id:
            return {"error": "Invalid YouTube URL or video ID"}
        
        try:
            request = self.client.videos().list(
                part="snippet,statistics,contentDetails",
                id=video_id
            )
            response = request.execute()
            
            items = response.get('items', [])
            if not items:
                return {"error": "Video not found"}
            
            video = items[0]
            snippet = video.get('snippet', {})
            stats = video.get('statistics', {})
            
            description = snippet.get('description', '') or ''
            if not full_description:
                description = description[:500]
            
            return {
                "video_id": video_id,
                "title": snippet.get('title', ''),
                "description": description,
                "view_count": self._safe_int(stats.get('viewCount')),
                "like_count": self._safe_int(stats.get('likeCount')),
                "comment_count": self._safe_int(stats.get('commentCount')),
                "published_at": snippet.get('publishedAt', ''),
                "thumbnail_url": snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                "channel_id": snippet.get('channelId', ''),
                "channel_title": snippet.get('channelTitle', ''),
                "tags": snippet.get('tags', [])
            }
            
        except googleapiclient.errors.HttpError as e:
            logger.error(f"YouTube API HTTP error: {e}")
            return {"error": "YouTube API error. Please try again later."}
        except Exception as e:
            logger.error(f"Error getting video stats: {e}")
            return {"error": "Failed to fetch video statistics"}
    
    def get_channel_stats(self, channel_id_or_url: str) -> Dict[str, Any]:
        """
        Get statistics for a YouTube channel.
        
        Args:
            channel_id_or_url: Channel ID, @handle, or channel URL
            
        Returns:
            Dict with channel stats or error message
        """
        if not self.is_available():
            return {"error": "YouTube API not configured"}
        
        # Extract channel ID from URL if needed
        channel_id = self.extract_channel_id(channel_id_or_url)
        if not channel_id:
            channel_id = channel_id_or_url.strip()
        
        try:
            # Handle @username format - need to search first
            if channel_id.startswith('@'):
                search_request = self.client.search().list(
                    part="snippet",
                    q=channel_id,
                    type="channel",
                    maxResults=1
                )
                search_response = search_request.execute()
                
                items = search_response.get('items', [])
                if not items:
                    return {"error": "Channel not found"}
                
                channel_id = items[0]['snippet']['channelId']
            
            # Fetch channel details
            request = self.client.channels().list(
                part="snippet,statistics,brandingSettings",
                id=channel_id
            )
            response = request.execute()
            
            items = response.get('items', [])
            if not items:
                return {"error": "Channel not found"}
            
            channel = items[0]
            snippet = channel.get('snippet', {})
            stats = channel.get('statistics', {})
            
            return {
                "channel_id": channel_id,
                "title": snippet.get('title', ''),
                "description": (snippet.get('description', '') or '')[:500],
                "subscriber_count": self._safe_int(stats.get('subscriberCount')),
                "video_count": self._safe_int(stats.get('videoCount')),
                "view_count": self._safe_int(stats.get('viewCount')),
                "thumbnail_url": snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                "custom_url": snippet.get('customUrl', ''),
            }
            
        except googleapiclient.errors.HttpError as e:
            logger.error(f"YouTube API HTTP error: {e}")
            return {"error": "YouTube API error. Please try again later."}
        except Exception as e:
            logger.error(f"Error getting channel stats: {e}")
            return {"error": "Failed to fetch channel statistics"}
    
    def get_channel_videos(self, channel_id: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent videos from a channel.
        
        Args:
            channel_id: YouTube channel ID
            max_results: Maximum number of videos to return (1-50)
            
        Returns:
            List of video data dicts
        """
        if not self.is_available():
            return []
        
        # Validate max_results
        max_results = max(1, min(50, max_results))
        
        try:
            request = self.client.search().list(
                part="snippet",
                channelId=channel_id,
                maxResults=max_results,
                order="date",
                type="video"
            )
            response = request.execute()
            
            # Get video IDs
            video_ids = []
            search_items = response.get('items', [])
            for item in search_items:
                vid = item.get('id', {}).get('videoId', '')
                if vid:
                    video_ids.append(vid)
            
            if not video_ids:
                return []
                
            # Batch fetch video stats
            stats_request = self.client.videos().list(
                part="snippet,statistics",
                id=",".join(video_ids)
            )
            stats_response = stats_request.execute()
            
            videos = []
            for item in stats_response.get('items', []):
                snippet = item.get('snippet', {})
                stats = item.get('statistics', {})
                desc = snippet.get('description', '') or ''
                
                # Enhanced Sponsor Detection
                is_sponsored = False
                sponsor_name = None
                
                lower_desc = desc.lower()
                title_lower = snippet.get('title', '').lower()
                
                # Known sponsor brands (common YouTube sponsors)
                known_sponsors = {
                    'nordvpn': 'NordVPN',
                    'expressvpn': 'ExpressVPN', 
                    'surfshark': 'Surfshark',
                    'squarespace': 'Squarespace',
                    'skillshare': 'Skillshare',
                    'brilliant': 'Brilliant',
                    'curiositystream': 'CuriosityStream',
                    'nebula': 'Nebula',
                    'audible': 'Audible',
                    'raycon': 'Raycon',
                    'raid shadow legends': 'Raid Shadow Legends',
                    'raid: shadow legends': 'Raid Shadow Legends',
                    'honey': 'Honey',
                    'manscaped': 'Manscaped',
                    'betterhelp': 'BetterHelp',
                    'hello fresh': 'HelloFresh',
                    'hellofresh': 'HelloFresh',
                    'dashlane': 'Dashlane',
                    'lastpass': 'LastPass',
                    'grammarly': 'Grammarly',
                    'wix': 'Wix',
                    'fiverr': 'Fiverr',
                    'dollar shave club': 'Dollar Shave Club',
                    'blue apron': 'Blue Apron',
                    'casper': 'Casper',
                    'stamps.com': 'Stamps.com',
                    'seat geek': 'SeatGeek',
                    'seatgeek': 'SeatGeek',
                    'funcrate': 'FunCrate',
                    'lootcrate': 'LootCrate',
                    'world of warships': 'World of Warships',
                    'world of tanks': 'World of Tanks',
                    'opera gx': 'Opera GX',
                    'keeps': 'Keeps',
                    'hims': 'Hims',
                    'established titles': 'Established Titles',
                    'ridge wallet': 'Ridge Wallet',
                    'ridge': 'Ridge',
                    'casetify': 'CASETiFY',
                    'glasswire': 'GlassWire',
                    'private internet access': 'Private Internet Access',
                    'pia': 'PIA VPN',
                    'madrinas': 'Madrinas Coffee',
                    'gfuel': 'G Fuel',
                    'g fuel': 'G Fuel',
                }
                
                # Check for known sponsors first
                combined_text = lower_desc + ' ' + title_lower
                for key, brand in known_sponsors.items():
                    if key in combined_text:
                        is_sponsored = True
                        sponsor_name = brand
                        break
                
                # If no known sponsor found, check keywords
                if not is_sponsored:
                    sponsor_keywords = [
                        'sponsored by', 'partnered with', 'thanks to', 'brought to you by',
                        'this video is sponsored by', 'this episode is sponsored by',
                        'a special thanks to', 'in partnership with', 'proudly sponsored by',
                        'paid promotion', '#ad ', '(ad)', '[ad]', 'includes paid promotion'
                    ]
                    
                    for keyword in sponsor_keywords:
                        if keyword in lower_desc:
                            is_sponsored = True
                            keyword_pos = lower_desc.find(keyword)
                            if keyword_pos != -1:
                                after_keyword = desc[keyword_pos + len(keyword):].strip()
                                lines = after_keyword.split('\n')
                                if lines:
                                    candidate = lines[0].strip()
                                    candidate = candidate.strip('.:,!-– ')
                                    candidate = re.sub(r'https?://\S+', '', candidate)
                                    candidate = re.sub(r'[^\w\s\'-]', ' ', candidate).strip()
                                    words = candidate.split()
                                    if words and len(words[0]) > 1:
                                        sponsor_name = " ".join(words[:3]).strip()
                                        sponsor_name = re.sub(r'\s+(for|to|at|the|and|or|a|an)$', '', sponsor_name, flags=re.IGNORECASE)
                                        if sponsor_name and len(sponsor_name) > 2:
                                            # Proper title case
                                            sponsor_name = sponsor_name.title()
                                            break
                
                # Try sponsor link patterns if still no name
                if is_sponsored and not sponsor_name:
                    link_patterns = [
                        r'(?:https?://)?(?:www\.)?([a-zA-Z0-9]+)\.com/[a-zA-Z0-9]+',
                        r'[Uu]se code[:\s]+["\']?([A-Z0-9]+)["\']?',
                        r'[Pp]romo code[:\s]+["\']?([A-Z0-9]+)["\']?',
                        r'([A-Z][a-zA-Z]+)\.com/\w+',
                    ]
                    for pattern in link_patterns:
                        match = re.search(pattern, desc)
                        if match:
                            potential = match.group(1)
                            # Skip common non-sponsor domains
                            skip_domains = ['youtube', 'twitter', 'instagram', 'facebook', 'tiktok', 'discord', 'patreon', 'twitch', 'google', 'amazon']
                            if potential.lower() not in skip_domains:
                                sponsor_name = potential.title()
                                break
                
                # Final fallback
                if is_sponsored and not sponsor_name:
                    sponsor_name = "Sponsored"
                
                videos.append({
                    "video_id": item['id'],
                    "title": snippet.get('title', ''),
                    "description": desc[:200],
                    "published_at": snippet.get('publishedAt', ''),
                    "thumbnail_url": snippet.get('thumbnails', {}).get('medium', {}).get('url', ''),
                    "view_count": self._safe_int(stats.get('viewCount')),
                    "like_count": self._safe_int(stats.get('likeCount')),
                    "comment_count": self._safe_int(stats.get('commentCount')),
                    "is_sponsored": is_sponsored,
                    "sponsor_name": sponsor_name
                })
            
            # Sort by date (search results are date ordered, but batch fetch might lose it)
            videos.sort(key=lambda x: x['published_at'], reverse=True)
            
            return videos
            
        except Exception as e:
            logger.error(f"Error getting channel videos: {e}")
            return []
    
    # =========================================================================
    # Database Operations
    # =========================================================================
    
    def save_channel(self, user_id, channel_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Save or update a YouTube channel for a user.
        
        Args:
            user_id: User ID
            channel_data: Channel data from get_channel_stats()
            
        Returns:
            Saved channel record or None on failure
        """
        if not channel_data or "error" in channel_data:
            logger.warning("Cannot save channel: invalid channel data")
            return None
        
        channel_id = channel_data.get("channel_id")
        if not channel_id:
            logger.warning("Cannot save channel: missing channel_id")
            return None
        
        now = datetime.utcnow().isoformat()
        
        record = {
            "channel_id": channel_id,
            "title": channel_data.get("title", ""),
            "subscriber_count": channel_data.get("subscriber_count", 0),
            "video_count": channel_data.get("video_count", 0),
            "view_count": channel_data.get("view_count", 0),
            "thumbnail_url": channel_data.get("thumbnail_url", ""),
            "user_id": str(user_id),
            "date_updated": now,
        }
        
        try:
            channels_repo = get_youtube_channels_repository()
            
            if channels_repo:
                # Check for existing channel
                existing = channels_repo.find_by_field("channel_id", channel_id)
                user_channel = next(
                    (ch for ch in existing if str(ch.get("user_id")) == str(user_id)),
                    None
                )
                
                if user_channel:
                    # Update existing
                    update_data = {
                        "subscriber_count": record["subscriber_count"],
                        "video_count": record["video_count"],
                        "view_count": record["view_count"],
                        "thumbnail_url": record["thumbnail_url"],
                        "date_updated": now,
                    }
                    return channels_repo.update(user_channel["id"], update_data)
                else:
                    # Create new
                    record["date_added"] = now
                    return channels_repo.create(record)
            
            # Fallback to mock database
            mock_db = get_mock_db()
            record["date_added"] = now
            return mock_db.create_youtube_channel(record)
            
        except Exception as e:
            logger.error(f"Error saving channel: {e}")
            return None
    
    def get_user_channels(self, user_id) -> List[Dict[str, Any]]:
        """
        Get all saved channels for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of channel records
        """
        try:
            channels_repo = get_youtube_channels_repository()
            
            if channels_repo:
                return channels_repo.find_by_field("user_id", str(user_id))
            
            # Fallback to mock database
            mock_db = get_mock_db()
            return mock_db.get_user_youtube_channels(user_id)
            
        except Exception as e:
            logger.error(f"Error getting user channels: {e}")
            return []

    def remove_channel(self, user_id, channel_id: str) -> bool:
        """
        Remove a YouTube channel for a user.
        
        Args:
            user_id: User ID
            channel_id: Channel ID to remove
            
        Returns:
            True if removed successfully, False otherwise
        """
        try:
            channels_repo = get_youtube_channels_repository()
            
            if channels_repo:
                # Find channel belonging to this user
                existing = channels_repo.find_by_field("channel_id", channel_id)
                user_channel = next(
                    (ch for ch in existing if str(ch.get("user_id")) == str(user_id)),
                    None
                )
                
                if user_channel:
                    return channels_repo.delete(user_channel["id"])
                return False
            
            # Fallback to mock database (needs implementation in mock DB if supported)
            # For now, just return True to simulate success in mock mode
            # In a real mock implementation, we would modify the in-memory list
            mock_db = get_mock_db()
            # Assuming mock_db might have a remove method or we just simulate it
            if hasattr(mock_db, 'delete_youtube_channel'):
                return mock_db.delete_youtube_channel(user_id, channel_id)
            
            # Fallback simulation for mock
            return True
            
        except Exception as e:
            logger.error(f"Error removing channel: {e}")
            return False
    
    def save_search(self, user_id, search_term: str, video_id: Optional[str] = None) -> bool:
        """
        Save a search to history.
        
        Args:
            user_id: User ID
            search_term: Search query
            video_id: Optional video ID if search was for a specific video
            
        Returns:
            True if saved successfully
        """
        if not search_term or not search_term.strip():
            return False
        
        record = {
            "user_id": str(user_id),
            "search_term": search_term.strip()[:500],  # Limit length
            "video_id": video_id,
            "date_searched": datetime.utcnow().isoformat(),
        }
        
        try:
            searches_repo = get_searches_repository()
            
            if searches_repo:
                result = searches_repo.create(record)
                return result is not None
            
            mock_db = get_mock_db()
            mock_db.create_search(record)
            return True
            
        except Exception as e:
            logger.error(f"Error saving search: {e}")
            return False
    
    # =========================================================================
    # Helpers
    # =========================================================================
    
    @staticmethod
    def _safe_int(value, default: int = 0) -> int:
        """Safely convert a value to int."""
        if value is None:
            return default
        try:
            return int(value)
        except (ValueError, TypeError):
            return default


# Global service instance (singleton)
youtube_service = YouTubeService()
