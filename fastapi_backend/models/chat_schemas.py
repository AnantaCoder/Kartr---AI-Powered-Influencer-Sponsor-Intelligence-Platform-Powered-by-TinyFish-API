"""
AI Chat Pydantic schemas for request/response validation
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from .common_schemas import PaginationMeta


class ChatMessage(BaseModel):
    """A single chat message"""
    id: str
    conversation_id: str
    user_id: str
    content: str
    role: str = Field(..., pattern="^(user|assistant)$")
    created_at: str


class ChatConversation(BaseModel):
    """A chat conversation"""
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0
    is_active: bool = True
    mode: str = "standard"  # "standard" or "agentic"


class CreateConversationRequest(BaseModel):
    """Request to create a new conversation"""
    title: Optional[str] = Field(default=None, max_length=255)
    mode: str = Field(default="standard", pattern="^(standard|agentic)$")


class CreateConversationResponse(BaseModel):
    """Response for conversation creation"""
    success: bool
    conversation: Optional[ChatConversation] = None
    error: Optional[str] = None


class SendMessageRequest(BaseModel):
    """Request to send a chat message"""
    message: str = Field(..., min_length=1, max_length=10000)


class SendMessageResponse(BaseModel):
    """Response for sending a message"""
    success: bool
    user_message: Optional[ChatMessage] = None
    assistant_message: Optional[ChatMessage] = None
    error: Optional[str] = None


class ConversationsListResponse(BaseModel):
    """Paginated list of conversations"""
    success: bool
    conversations: List[ChatConversation] = []
    pagination: Optional[PaginationMeta] = None
    error: Optional[str] = None


class MessagesListResponse(BaseModel):
    """Paginated list of messages"""
    success: bool
    messages: List[ChatMessage] = []
    pagination: Optional[PaginationMeta] = None
    error: Optional[str] = None


class UpdateConversationTitleRequest(BaseModel):
    """Request to update conversation title"""
    title: str = Field(..., min_length=1, max_length=255)


class DeleteConversationResponse(BaseModel):
    """Response for deleting a conversation"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None
