# Kartr API Reference

Complete reference for all API endpoints.

---

## Authentication

### `POST /api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "user_type": "sponsor",
  "full_name": "John Doe"
}
```

**Response:** JWT token with user data.

---

### `POST /api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Admin Login:**
```json
{
  "email": "admin@email.com",
  "password": "admin@123"
}
```

---

### `POST /api/auth/google`
Login with Google (Firebase ID token).

### `GET /api/auth/me`
Get current user info. Requires auth.

### `POST /api/auth/forgot-password`
Request password reset.

### `POST /api/auth/verify-otp`
Verify OTP for password reset.

---

## Admin (Admin Only)

### `GET /api/admin/users`
List all users with pagination and filters.

**Query Params:**
- `page` (int): Page number
- `page_size` (int): Items per page
- `user_type` (string): Filter by type
- `search` (string): Search username/email
- `is_active` (bool): Filter by active status

### `GET /api/admin/users/{user_id}`
Get user details.

### `PUT /api/admin/users/{user_id}`
Update user.

### `DELETE /api/admin/users/{user_id}`
Delete user (soft delete by default).

### `GET /api/admin/sponsors`
List all sponsors.

### `GET /api/admin/influencers`
List all influencers.

### `GET /api/admin/analytics`
Get platform analytics.

### `GET /api/admin/dashboard`
Get complete dashboard data.

---

## Campaigns (Sponsor Only)

### `POST /api/campaigns`
Create a new campaign.

**Request Body:**
```json
{
  "name": "Summer Sale Campaign",
  "description": "Promoting summer products...",
  "niche": "fashion",
  "keywords": ["summer", "sale", "fashion"],
  "budget_min": 500,
  "budget_max": 2000
}
```

### `GET /api/campaigns`
List sponsor's campaigns.

### `GET /api/campaigns/{id}`
Get campaign details.

### `PUT /api/campaigns/{id}`
Update campaign.

### `DELETE /api/campaigns/{id}`
Delete campaign.

### `GET /api/campaigns/{id}/influencers?find_new=true`
Get or find matching influencers.

### `POST /api/campaigns/{id}/influencers`
Add influencer to campaign.

### `POST /api/campaigns/{id}/activate`
Activate a draft campaign.

### `POST /api/campaigns/{id}/pause`
Pause an active campaign.

### `POST /api/campaigns/{id}/complete`
Mark campaign as completed.

---

## Performance Tracking

### `POST /api/tracking/log`
Log a performance event.

**Request Body:**
```json
{
  "campaign_id": "campaign_abc123",
  "influencer_id": "user_xyz789",
  "event_type": "view",
  "value": 1
}
```

Event types: `view`, `click`, `conversion`, `engagement`

### `GET /api/tracking/campaign/{id}`
Get campaign performance metrics.

### `GET /api/tracking/influencer/{id}`
Get influencer performance across campaigns.

---

## YouTube Analytics

### `POST /api/youtube/stats`
Get video/channel statistics.

### `POST /api/youtube/extract`
Extract video information.

### `POST /api/youtube/analyze`
Analyze video with AI (sponsor detection).

### `POST /api/youtube/analyze-channel`
Analyze multiple channel videos.

### `POST /api/youtube/save-analysis`
Save analysis to database.

### `GET /api/youtube/channels`
Get user's linked channels.

---

## Bluesky Integration

### `POST /bluesky/connect`
Link Bluesky account.

**Request Body:**
```json
{
  "identifier": "user.bsky.social",
  "password": "app-password"
}
```

### `POST /bluesky/post`
Create a post on Bluesky.

**Form Data:**
- `text` (required)
- `image_path` (optional)
- `alt_text` (optional)
- `video_path` (optional)
- `image_file` (optional, file upload)

---

## Image Generation

### `POST /api/images/generate`
Generate promotional image with AI.

### `POST /api/images/generate-llm`
Generate LLM-based influencer image.

### `GET /api/images`
List generated images.

---

## Visualization & RAG

### `GET /api/visualization/graph/creator-sponsor`
Get creator-sponsor relationship graph.

### `GET /api/visualization/graph/industry`
Get industry relationship graph.

### `POST /api/visualization/question`
Ask question using RAG.

### `GET /api/visualization/dashboard`
Get visualization dashboard data.

---

## AI Chat

### `POST /api/chat/conversations`
Create new conversation.

### `GET /api/chat/conversations`
List conversations.

### `GET /api/chat/conversations/{id}`
Get conversation.

### `PUT /api/chat/conversations/{id}`
Update conversation title.

### `DELETE /api/chat/conversations/{id}`
Delete conversation.

### `GET /api/chat/conversations/{id}/messages`
Get messages.

### `POST /api/chat/conversations/{id}/messages`
Send message, get AI response.

### `POST /api/chat/quick`
Quick one-off chat.

---

## Virtual Influencers

### `GET /api/virtual-influencers`
List available virtual influencers.

### `GET /api/virtual-influencers/{id}`
Get virtual influencer details.

---

## Search

### `GET /api/search?q={query}`
Search users and channels.

### `GET /api/search/suggestions?q={query}`
Get search suggestions.

---

## Utilities

### `GET /api/health`
Health check endpoint.
