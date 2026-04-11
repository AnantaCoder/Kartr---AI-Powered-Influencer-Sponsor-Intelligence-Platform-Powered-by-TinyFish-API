"""
Search-related Pydantic schemas for request/response validation
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    """Schema for search request"""
    query: str = Field(..., min_length=1)


class SearchResult(BaseModel):
    """Single search result"""
    id: str
    text: str
    type: str
    email: Optional[str] = None


class SearchResponse(BaseModel):
    """Response for search"""
    channels: List[dict] = []
    users: List[dict] = []
    query: str


class SearchSuggestion(BaseModel):
    """Search suggestion for autocomplete"""
    id: str
    text: str
    type: str
    email: Optional[str] = None
