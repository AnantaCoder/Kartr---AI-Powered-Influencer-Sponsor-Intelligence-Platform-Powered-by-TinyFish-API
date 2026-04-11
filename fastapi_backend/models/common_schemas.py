"""
Common/utility Pydantic schemas for request/response validation
"""
from typing import List
from pydantic import BaseModel


class GraphData(BaseModel):
    """Graph data for visualization"""
    nodes: List[dict] = []
    edges: List[dict] = []


class QuestionRequest(BaseModel):
    """Request for RAG question answering"""
    question: str


class QuestionResponse(BaseModel):
    """Response for question answering"""
    answer: str


class EmailVisibilityRequest(BaseModel):
    """Request to toggle email visibility"""
    email_visible: bool


class PlatformStats(BaseModel):
    """Platform statistics"""
    influencers: int = 0
    sponsors: int = 0
    total_users: int = 0
    partnerships: int = 0


class MessageResponse(BaseModel):
    """Generic message response"""
    success: bool
    message: str


class PaginationMeta(BaseModel):
    """Pagination metadata"""
    page: int
    page_size: int
    total_count: int
    total_pages: int
    has_next: bool
    has_previous: bool
