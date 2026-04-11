"""
AI Chat Router - Endpoints for AI-powered chat with Kartr context.

This router provides endpoints for:
- Creating chat conversations
- Sending messages and receiving AI responses
- Retrieving chat history with pagination
- Managing conversations (update, delete)
"""
import logging
from math import ceil
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends, Query

from models.schemas import (
    CreateConversationRequest,
    CreateConversationResponse,
    SendMessageRequest,
    SendMessageResponse,
    ConversationsListResponse,
    MessagesListResponse,
    UpdateConversationTitleRequest,
    DeleteConversationResponse,
    ChatConversation,
    ChatMessage,
    PaginationMeta,
)
from services.chat_service import ChatService
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


def _create_pagination_meta(
    page: int,
    page_size: int,
    total_count: int
) -> PaginationMeta:
    """Create pagination metadata."""
    total_pages = ceil(total_count / page_size) if page_size > 0 else 0
    return PaginationMeta(
        page=page,
        page_size=page_size,
        total_count=total_count,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1
    )


# =========================================
# Conversation Management
# =========================================

@router.post("/conversations", response_model=CreateConversationResponse)
async def create_conversation(
    request: CreateConversationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new chat conversation.
    
    - **title**: Optional title for the conversation (auto-generated if not provided)
    
    Returns the created conversation.
    """
    success, conversation, error = ChatService.create_conversation(
        user_id=str(current_user["id"]),
        title=request.title,
        mode=request.mode
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error or "Failed to create conversation"
        )
    
    return CreateConversationResponse(
        success=True,
        conversation=ChatConversation(**conversation)
    )


@router.get("/conversations", response_model=ConversationsListResponse)
async def list_conversations(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get paginated list of user's chat conversations.
    
    - **page**: Page number (starting from 1)
    - **page_size**: Number of conversations per page (max 100)
    
    Returns conversations sorted by most recently updated.
    """
    conversations, total_count = ChatService.get_user_conversations(
        user_id=str(current_user["id"]),
        page=page,
        page_size=page_size
    )
    
    return ConversationsListResponse(
        success=True,
        conversations=[ChatConversation(**c) for c in conversations],
        pagination=_create_pagination_meta(page, page_size, total_count)
    )


@router.get("/conversations/{conversation_id}", response_model=CreateConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific conversation by ID.
    
    - **conversation_id**: The conversation's unique ID
    
    Returns the conversation details.
    """
    conversation = ChatService.get_conversation(
        conversation_id=conversation_id,
        user_id=str(current_user["id"])
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return CreateConversationResponse(
        success=True,
        conversation=ChatConversation(**conversation)
    )


@router.patch("/conversations/{conversation_id}", response_model=CreateConversationResponse)
async def update_conversation(
    conversation_id: str,
    request: UpdateConversationTitleRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a conversation's title.
    
    - **conversation_id**: The conversation's unique ID
    - **title**: New title for the conversation
    
    Returns the updated conversation.
    """
    success, conversation, error = ChatService.update_conversation_title(
        conversation_id=conversation_id,
        user_id=str(current_user["id"]),
        title=request.title
    )
    
    if not success:
        if "not found" in (error or "").lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error or "Failed to update conversation"
        )
    
    return CreateConversationResponse(
        success=True,
        conversation=ChatConversation(**conversation)
    )


@router.delete("/conversations/{conversation_id}", response_model=DeleteConversationResponse)
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a conversation (soft delete).
    
    - **conversation_id**: The conversation's unique ID
    
    The conversation is marked as inactive but not permanently deleted.
    """
    success, error = ChatService.delete_conversation(
        conversation_id=conversation_id,
        user_id=str(current_user["id"])
    )
    
    if not success:
        if "not found" in (error or "").lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error or "Failed to delete conversation"
        )
    
    return DeleteConversationResponse(
        success=True,
        message="Conversation deleted successfully"
    )


# =========================================
# Message Operations
# =========================================

@router.get("/conversations/{conversation_id}/messages", response_model=MessagesListResponse)
async def get_messages(
    conversation_id: str,
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=50, ge=1, le=200, description="Messages per page"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get paginated messages for a conversation.
    
    - **conversation_id**: The conversation's unique ID
    - **page**: Page number (starting from 1)
    - **page_size**: Number of messages per page (max 200)
    
    Returns messages sorted by creation time (oldest first).
    """
    # Verify conversation exists and user has access
    conversation = ChatService.get_conversation(
        conversation_id=conversation_id,
        user_id=str(current_user["id"])
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    messages, total_count = ChatService.get_conversation_messages(
        conversation_id=conversation_id,
        user_id=str(current_user["id"]),
        page=page,
        page_size=page_size
    )
    
    return MessagesListResponse(
        success=True,
        messages=[ChatMessage(**m) for m in messages],
        pagination=_create_pagination_meta(page, page_size, total_count)
    )


@router.post("/conversations/{conversation_id}/messages", response_model=SendMessageResponse)
async def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message to the AI assistant and receive a response.
    
    - **conversation_id**: The conversation's unique ID
    - **message**: Your message to the AI assistant
    
    The AI has full context of the Kartr platform and can help with:
    - Platform features and usage
    - Influencer marketing advice
    - YouTube analytics interpretation
    - Sponsor-influencer matching tips
    - General platform questions
    
    Returns both the user message and AI assistant response.
    """
    # Verify conversation exists and user has access
    conversation = ChatService.get_conversation(
        conversation_id=conversation_id,
        user_id=str(current_user["id"])
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    success, response_data, error = await ChatService.send_message_and_get_response(
        conversation_id=conversation_id,
        user_id=str(current_user["id"]),
        user_message=request.message
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error or "Failed to process message"
        )
    
    return SendMessageResponse(
        success=True,
        user_message=ChatMessage(**response_data["user_message"]),
        assistant_message=ChatMessage(**response_data["assistant_message"])
    )


# =========================================
# Quick Chat Endpoint (Create + Send)
# =========================================

@router.post("/quick", response_model=SendMessageResponse)
async def quick_chat(
    request: SendMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Quick chat - creates a new conversation and sends a message in one call.
    
    - **message**: Your message to the AI assistant
    
    This is a convenience endpoint that:
    1. Creates a new conversation
    2. Sends your message
    3. Returns the AI response
    
    Use this for one-off questions without managing conversations.
    """
    # Create new conversation
    success, conversation, error = ChatService.create_conversation(
        user_id=str(current_user["id"]),
        title=None  # Will be auto-set from the first message
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error or "Failed to create conversation"
        )
    
    # Send message and get response
    success, response_data, error = await ChatService.send_message_and_get_response(
        conversation_id=conversation["id"],
        user_id=str(current_user["id"]),
        user_message=request.message
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error or "Failed to process message"
        )
    
    return SendMessageResponse(
        success=True,
        user_message=ChatMessage(**response_data["user_message"]),
        assistant_message=ChatMessage(**response_data["assistant_message"])
    )
