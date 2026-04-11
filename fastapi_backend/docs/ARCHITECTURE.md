# Kartr Backend Architecture

High-level overview of the Kartr backend system design.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Bun)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      Routers                          │  │
│  │  auth │ admin │ campaign │ youtube │ bluesky │ chat   │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     Services                          │  │
│  │  AuthService │ AdminService │ CampaignService │ ...   │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │   Firebase       │  │      External APIs              │  │
│  │   Firestore      │  │  YouTube │ Gemini │ Bluesky     │  │
│  └──────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## User Types

| Type | Description | Access |
|------|-------------|--------|
| **Admin** | Platform administrator | All endpoints |
| **Sponsor** | Brand/company seeking influencers | Campaigns, discovery, tracking |
| **Influencer** | Content creator | YouTube analytics, Bluesky posting |

---

## Core Modules

### Authentication (`/api/auth`)
- JWT-based authentication
- Firebase Auth integration (Google OAuth)
- Hardcoded admin login for development
- OTP-based password reset

### Admin (`/api/admin`)
- User management (CRUD)
- Platform analytics
- Role-based filtering

### Campaigns (`/api/campaigns`)
- Campaign CRUD for sponsors
- AI-powered influencer matching
- Campaign status management

### YouTube (`/api/youtube`)
- Video/channel statistics
- AI sponsor detection (Gemini)
- Content analysis

### Bluesky (`/bluesky`)
- Account linking
- Auto-posting (text, image, video)
- Virtual influencer integration

### Chat (`/api/chat`)
- AI-powered assistant
- RAG-based knowledge retrieval
- Conversation persistence

---

## Data Flow

### User Registration
```
Frontend → /api/auth/register → AuthService
    ├── Validate input
    ├── Hash password
    ├── Create Firebase Auth user (optional)
    └── Store in Firestore/Mock DB
```

### Campaign Matching
```
Sponsor → /api/campaigns/{id}/influencers?find_new=true
    ├── Extract campaign keywords
    ├── Search influencer database
    ├── Calculate match scores
    └── Return ranked list
```

### AI Analysis
```
User → /api/youtube/analyze → YouTubeService
    ├── Fetch video metadata
    ├── Get transcript/comments
    ├── Send to Gemini API
    └── Parse and return analysis
```

---

## Database Schema

### Users Collection
```json
{
  "id": "user_abc123",
  "username": "johndoe",
  "email": "john@example.com",
  "password_hash": "...",
  "user_type": "sponsor",
  "full_name": "John Doe",
  "date_registered": "2024-01-15T10:30:00",
  "bluesky_handle": "john.bsky.social",
  "is_active": true
}
```

### Campaigns Collection
```json
{
  "id": "campaign_xyz789",
  "sponsor_id": "user_abc123",
  "name": "Summer Sale",
  "description": "...",
  "niche": "fashion",
  "keywords": ["summer", "sale"],
  "status": "active",
  "created_at": "2024-06-01T00:00:00"
}
```

### Video Analyses Collection
```json
{
  "id": "analysis_001",
  "video_id": "dQw4w9WgXcQ",
  "channel_name": "...",
  "sponsor_name": "Detected Sponsor",
  "analysis": { ... },
  "created_at": "2024-06-15T12:00:00"
}
```

---

## Security

### Authentication
- JWT tokens with expiration
- Password hashing (bcrypt)
- Firebase ID token verification

### Authorization (RBAC)
```python
from utils.rbac import require_admin, require_sponsor

@router.get("/admin-only")
async def admin_endpoint(user: dict = Depends(require_admin)):
    ...
```

### Data Protection
- Password hashes never returned in responses
- Bluesky passwords encrypted at rest (TODO)
- Rate limiting recommended for production

---

## External Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| Firebase | Auth + Firestore | `kartr-firebase-adminsdk.json` |
| YouTube Data API | Video/channel data | `YOUTUBE_API_KEY` |
| Google Gemini | AI analysis/generation | `GEMINI_API_KEY` |
| Bluesky | Social posting | Per-user credentials |
| SMTP | Password reset emails | `SMTP_*` vars |
