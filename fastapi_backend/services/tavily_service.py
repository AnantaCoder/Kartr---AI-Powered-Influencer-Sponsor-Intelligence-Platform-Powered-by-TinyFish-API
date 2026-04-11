"""
Service for real-time market search using Tavily API.
"""
import logging
from typing import List, Dict, Any, Optional
from tavily import TavilyClient
from config import settings

logger = logging.getLogger(__name__)

class TavilyService:
    def __init__(self):
        self.client = None
        if settings.TAVILY_API_KEY:
            try:
                self.client = TavilyClient(api_key=settings.TAVILY_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Tavily client: {e}")

    def search_recommendations(self, query: str, context: str = "") -> List[Dict[str, Any]]:
        """
        Perform a search to find relevant sponsors or influencers.
        """
        if not self.client:
            logger.warning("Tavily client not initialized. Returning empty results.")
            return []

        try:
            # Combine query and context for better search results
            search_query = f"{query} {context}".strip()
            
            # Use Tavily's search capability
            # We use 'search' for general discovery
            response = self.client.search(
                query=search_query,
                search_depth="advanced",
                max_results=5
            )
            
            # In a real implementation, we would pass these results to an LLM 
            # to rank and format them into the Recommendation schema.
            # For now, we return the raw search data structured for the generator.
            return response.get("results", [])
            
        except Exception as e:
            logger.error(f"Tavily search failed: {e}")
            return []

    def get_live_market_data(self, niche: str, is_creator: bool = True) -> List[Dict[str, Any]]:
        """
        Get tailored recommendations based on niche and perspective.
        """
        if is_creator:
            query = f"top active sponsors and brands currently partnering with {niche} youtube creators"
        else:
            query = f"fastest growing up and coming {niche} influencers and youtube creators for brand deals"
            
        results = self.search_recommendations(query)
        return results

tavily_service = TavilyService()
