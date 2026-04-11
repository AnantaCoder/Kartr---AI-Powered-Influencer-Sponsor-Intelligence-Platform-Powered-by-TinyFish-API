"""
Pydantic schemas for request/response validation

This file re-exports all schemas from the split schema files for backward compatibility.
The schemas have been organized into separate files:
- auth_schemas.py: Authentication-related schemas
- youtube_schemas.py: YouTube-related schemas
- search_schemas.py: Search-related schemas
- social_schemas.py: Social media and virtual influencer schemas
- image_schemas.py: Image generation schemas
- common_schemas.py: Common/utility schemas
- chat_schemas.py: AI chat schemas
- ad_studio_schemas.py: Ad Studio schemas
"""

# Re-export all schemas for backward compatibility
from .auth_schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    OTPVerifyRequest,
    GoogleLoginRequest,
    UserProfileUpdate,
)

from .youtube_schemas import (
    YouTubeStatsRequest,
    YouTubeStatsResponse,
    VideoStats,
    ChannelStats,
    AnalyzeVideoRequest,
    AnalyzeVideoResponse,
    VideoAnalysis,
    AnalyzeChannelRequest,
    YouTubeChannelResponse,
    SaveAnalysisRequest,
    BulkVideoAnalysisResponse,
)

from .search_schemas import (
    SearchRequest,
    SearchResponse,
    SearchResult,
    SearchSuggestion,
)

from .social_schemas import (
    VirtualInfluencer,
    SocialMediaAgent,
    BlueskyPostRequest,
    BlueskyPostResponse,
)

from .image_schemas import (
    GenerateImageRequest,
    GenerateLLMImageRequest,
    ImageGenerationResponse,
)

from .common_schemas import (
    GraphData,
    QuestionRequest,
    QuestionResponse,
    EmailVisibilityRequest,
    PlatformStats,
    MessageResponse,
    PaginationMeta,
)

from .chat_schemas import (
    ChatMessage,
    ChatConversation,
    CreateConversationRequest,
    CreateConversationResponse,
    SendMessageRequest,
    SendMessageResponse,
    ConversationsListResponse,
    MessagesListResponse,
    UpdateConversationTitleRequest,
    DeleteConversationResponse,
)

from .ad_studio_schemas import (
    AdGenerationRequest,
    AdGenerationResponse,
    AdPostRequest,
)

# Export all for wildcard imports
__all__ = [
    # Auth
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "ForgotPasswordRequest",
    "OTPVerifyRequest",
    "GoogleLoginRequest",
    "UserProfileUpdate",
    # YouTube
    "YouTubeStatsRequest",
    "YouTubeStatsResponse",
    "VideoStats",
    "ChannelStats",
    "AnalyzeVideoRequest",
    "AnalyzeVideoResponse",
    "VideoAnalysis",
    "AnalyzeChannelRequest",
    "YouTubeChannelResponse",
    "SaveAnalysisRequest",
    "BulkVideoAnalysisResponse",
    # Search
    "SearchRequest",
    "SearchResponse",
    "SearchResult",
    "SearchSuggestion",
    # Social
    "VirtualInfluencer",
    "SocialMediaAgent",
    "BlueskyPostRequest",
    "BlueskyPostResponse",
    # Image
    "GenerateImageRequest",
    "GenerateLLMImageRequest",
    "ImageGenerationResponse",
    # Common
    "GraphData",
    "QuestionRequest",
    "QuestionResponse",
    "EmailVisibilityRequest",
    "PlatformStats",
    "MessageResponse",
    "PaginationMeta",
    # Chat
    "ChatMessage",
    "ChatConversation",
    "CreateConversationRequest",
    "CreateConversationResponse",
    "SendMessageRequest",
    "SendMessageResponse",
    "ConversationsListResponse",
    "MessagesListResponse",
    "UpdateConversationTitleRequest",
    "DeleteConversationResponse",
    # Ad Studio
    "AdGenerationRequest",
    "AdGenerationResponse",
    "AdPostRequest",
]
