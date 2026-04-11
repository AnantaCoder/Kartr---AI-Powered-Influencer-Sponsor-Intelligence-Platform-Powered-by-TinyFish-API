"""Models package for database models and Pydantic schemas"""

# Authentication schemas
from models.auth_schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    OTPVerifyRequest,
    GoogleLoginRequest,
)

# YouTube schemas
from models.youtube_schemas import (
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
)

# Search schemas
from models.search_schemas import (
    SearchRequest,
    SearchResponse,
    SearchResult,
    SearchSuggestion,
)

# Social media schemas
from models.social_schemas import (
    VirtualInfluencer,
    SocialMediaAgent,
    BlueskyPostRequest,
    BlueskyPostResponse,
)

# Image schemas
from models.image_schemas import (
    GenerateImageRequest,
    GenerateLLMImageRequest,
    ImageGenerationResponse,
)

# Common schemas
from models.common_schemas import (
    GraphData,
    QuestionRequest,
    QuestionResponse,
    EmailVisibilityRequest,
    PlatformStats,
    MessageResponse,
    PaginationMeta,
)

# Chat schemas
from models.chat_schemas import (
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

# Admin schemas
from models.admin_schemas import (
    AdminUserResponse,
    UserListResponse,
    UserUpdateRequest,
    UserFilterParams,
    PlatformAnalytics,
    AdminDashboardResponse,
)

# Campaign schemas
from models.campaign_schemas import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignListResponse,
    InfluencerMatch,
    CampaignInfluencersResponse,
    AddInfluencerRequest,
)

# Virtual influencer schemas (database-driven)
from models.virtual_influencer_schemas import (
    VirtualInfluencerCreate,
    VirtualInfluencerUpdate,
    VirtualInfluencerResponse,
    VirtualInfluencerListResponse,
    RentVirtualInfluencerRequest,
    RentalResponse,
    AutoPostRequest,
)

# Performance tracking schemas
from models.tracking_schemas import (
    PerformanceLogCreate,
    PerformanceLogResponse,
    PerformanceMetrics,
    CampaignPerformance,
    InfluencerPerformance,
    PerformanceReportRequest,
)

