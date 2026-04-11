# Kartr FastAPI Backend

A modern, RESTful API backend for the Kartr influencer-sponsor platform built with FastAPI and Supabase.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Development](#development)
- [Testing](#testing)

---

## 🎯 Overview

Kartr FastAPI Backend provides a complete API for connecting influencers with sponsors. It includes:

- **User Management**: Registration, authentication with email/password or Google OAuth
- **YouTube Analytics**: Video and channel statistics, content analysis
- **Search**: Find influencers and sponsors
- **Virtual Influencers**: Rent AI-powered virtual influencers
- **Social Media Integration**: Post to multiple platforms
- **Image Generation**: Create promotional content
- **Data Visualization**: Relationship graphs and analytics

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Email/password + Google OAuth via Supabase |
| 📊 **YouTube Analytics** | Video stats, channel analysis, sponsor detection |
| 🔍 **Search** | Find users, channels with autocomplete |
| 🤖 **Virtual Influencers** | AI influencer marketplace |
| 📱 **Social Media** | Multi-platform posting |
| 🖼️ **Image Generation** | AI-powered promotional images |
| 📈 **Visualization** | Creator-sponsor relationship graphs |
| ❓ **RAG Q&A** | AI-powered question answering |

---

## 📁 Project Structure

```
fastapi_backend/
├── main.py                 # Application entry point
├── config.py               # Configuration settings
├── database.py             # Database connection (Supabase/Mock)
├── requirements.txt        # Python dependencies
├── .env.example            # Environment template
├── README.md               # This documentation
│
├── models/
│   ├── __init__.py
│   └── schemas.py          # Pydantic request/response models
│
├── routers/
│   ├── __init__.py
│   ├── auth.py             # Authentication endpoints
│   ├── youtube.py          # YouTube analytics endpoints
│   ├── search.py           # Search endpoints
│   ├── virtual_influencer.py
│   ├── social_media.py
│   ├── image_generation.py
│   ├── visualization.py
│   └── utilities.py
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py     # Authentication logic
│   ├── youtube_service.py  # YouTube API integration
│   └── email_service.py    # Email notifications
│
├── utils/
│   ├── __init__.py
│   ├── security.py         # Password hashing, JWT tokens
│   └── dependencies.py     # FastAPI dependencies
│
├── data/                   # Local data storage
└── venv/                   # Virtual environment
```

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.11 or higher
- Supabase account (optional, falls back to mock database)

### Installation Steps

1. **Navigate to fastapi_backend directory**
   ```bash
   cd fastapi_backend
   ```

2. **Activate virtual environment**
   ```bash
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies** (if not already installed)
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   # Copy example to .env
   copy .env.example .env
   
   # Edit .env with your credentials
   ```

5. **Run the server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

6. **Access the API**
   - API Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc
   - Health Check: http://localhost:8000/api/health

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# App Settings
DEBUG=true
SECRET_KEY=your-secret-key-min-32-characters

# Firebase (Required for production)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS=path-to-firebase-service-account.json

# YouTube API (Optional)
YOUTUBE_API_KEY=your-youtube-api-key

# Gemini API (Required for AI features)
GEMINI_API_KEY=your-gemini-api-key

# Gemini Models
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_CHAT_MODEL=gemini-2.5-flash-lite
GEMINI_IMAGE_MODEL=gemini-2.0-flash-exp-image-generation

# Email/SMTP (Optional, for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
```

### Gemini Model Configuration

All Gemini AI models are configured via `.env` for easy switching:

| Setting | Default Model | Used For |
|---------|---------------|----------|
| `GEMINI_TEXT_MODEL` | `gemini-2.5-flash` | Video analysis, Q&A, RAG |
| `GEMINI_CHAT_MODEL` | `gemini-2.5-flash-lite` | AI chat conversations |
| `GEMINI_IMAGE_MODEL` | `gemini-2.0-flash-exp-image-generation` | Image generation |

**Available Models:**
- `gemini-2.5-flash` - Fast, efficient for general text tasks
- `gemini-2.5-pro` - More capable, better reasoning
- `gemini-2.5-flash-lite` - Lightweight, optimized for chat
- `gemini-2.0-flash-exp-image-generation` - Experimental image generation

> **Note:** Free tier has rate limits. For production, enable billing in [Google AI Studio](https://aistudio.google.com/).

### Supabase Setup for Google OAuth

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set redirect URL to: `http://localhost:8000/api/auth/callback`

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login with email/password | No |
| GET | `/google` | Start Google OAuth | No |
| GET | `/callback` | OAuth callback | No |
| POST | `/logout` | Logout user | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/verify-otp` | Verify OTP | No |
| GET | `/me` | Get current user | Yes |

### YouTube Analytics (`/api/youtube`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/stats` | Get video/channel stats | Yes |
| POST | `/demo` | Extract video info | Yes |
| POST | `/analyze-video` | AI video analysis | Yes |
| POST | `/analyze-channel` | Batch channel analysis | Yes |
| POST | `/save-analysis` | Save analysis to DB | Yes |
| GET | `/channels` | List user's channels | Yes |

### Search (`/api/search`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Search users/channels | Yes |
| GET | `/suggestions` | Autocomplete | No |

### Virtual Influencers (`/api/virtual-influencers`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List virtual influencers | Yes |
| GET | `/{id}` | Get influencer details | Yes |

### Social Media (`/api/social-media`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/agents` | List social media agents | Yes |
| POST | `/post-bluesky` | Post to Bluesky | Yes |
| GET | `/images` | List available images | Yes |

### Image Generation (`/api/images`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/generate` | Generate promo image | Yes |
| POST | `/generate-llm` | LLM image generation | Yes |
| GET | `/generated` | List generated images | Yes |

### Visualization (`/api`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/graphs/creator-sponsor` | Creator-sponsor graph | Yes |
| GET | `/graphs/industry` | Industry graph | Yes |
| POST | `/questions/ask` | RAG Q&A | Yes |
| GET | `/visualization/data` | Dashboard data | Yes |

### Utilities (`/api`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/user/toggle-email-visibility` | Toggle email visibility | Yes |
| GET | `/user/profile` | Get user profile | Yes |
| GET | `/stats/platform` | Platform statistics | No |
| GET | `/health` | Health check | No |
| GET | `/contact` | Contact info | No |

### AI Chat (`/api/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/conversations` | Create new conversation | Yes |
| GET | `/conversations` | List conversations (paginated) | Yes |
| GET | `/conversations/{id}` | Get conversation by ID | Yes |
| PATCH | `/conversations/{id}` | Update conversation title | Yes |
| DELETE | `/conversations/{id}` | Delete conversation | Yes |
| GET | `/conversations/{id}/messages` | Get messages (paginated) | Yes |
| POST | `/conversations/{id}/messages` | Send message & get AI response | Yes |
| POST | `/quick` | Quick chat (create + send) | Yes |

---

## 🔐 Authentication

### JWT Token Authentication

1. **Register or Login** to receive a JWT token
2. **Include token** in Authorization header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

### Google OAuth Flow

1. Redirect user to `GET /api/auth/google`
2. User authenticates with Google
3. Callback redirects to `/api/auth/callback` with tokens
4. Receive JWT token for your application

---

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(256),
    user_type VARCHAR(20) NOT NULL,  -- 'influencer' or 'sponsor'
    date_registered TIMESTAMP DEFAULT NOW(),
    email_visible BOOLEAN DEFAULT FALSE,
    supabase_auth_id UUID,
    avatar_url TEXT
);
```

### YouTube Channels Table

```sql
CREATE TABLE youtube_channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(120) NOT NULL,
    title VARCHAR(120) NOT NULL,
    subscriber_count INTEGER,
    video_count INTEGER,
    view_count INTEGER,
    date_added TIMESTAMP DEFAULT NOW(),
    date_updated TIMESTAMP DEFAULT NOW(),
    user_id INTEGER REFERENCES users(id)
);
```

### Searches Table

```sql
CREATE TABLE searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    search_term VARCHAR(255) NOT NULL,
    video_id VARCHAR(20),
    date_searched TIMESTAMP DEFAULT NOW()
);
```

---

## 💻 Development

### Running in Development Mode

```bash
# Activate virtual environment
.\venv\Scripts\activate

# Run with auto-reload
uvicorn main:app --reload --port 8000
```

### Code Style

- Follow PEP 8 guidelines
- Use type hints for all functions
- Document all public functions with docstrings
- Use Pydantic for request/response validation

---

## 🧪 Testing

### Structural Testing

To verify the structure without API keys:

```bash
# Activate venv
.\venv\Scripts\activate

# Test imports
python -c "from main import app; print('✓ App loads successfully')"

# Test individual modules
python -c "from config import settings; print('✓ Config OK')"
python -c "from database import get_mock_db; print('✓ Database OK')"
python -c "from models.schemas import UserCreate; print('✓ Models OK')"
python -c "from utils.security import hash_password; print('✓ Security OK')"
```

### API Testing

1. Start the server
2. Go to http://localhost:8000/docs
3. Test endpoints using Swagger UI

---

## 📝 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ using FastAPI and Supabase**
