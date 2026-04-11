# Kartr Backend Setup Guide

Step-by-step guide to set up the Kartr FastAPI backend.

---

## Prerequisites

- Python 3.10+
- pip or pipenv
- Firebase project (optional, uses mock DB if not configured)
- YouTube Data API key
- Gemini API key

---

## Installation

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd Full_project/fastapi_backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Configuration

### Create `.env` File

Copy `.env.example` to `.env` and fill in values:

```env
# App Settings
DEBUG=true
SECRET_KEY=your-super-secret-key-here

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Firebase (optional)
FIREBASE_CREDENTIALS_PATH=./kartr-firebase-adminsdk.json

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Firebase Setup (Optional)

1. Create a Firebase project
2. Enable Authentication (Email/Password + Google)
3. Create Firestore database
4. Download service account JSON
5. Place as `kartr-firebase-adminsdk.json`

---

## Running the Server

### Development Mode

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Access Points

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/health

---

## Admin Access

The admin account is hardcoded for simplicity:

- **Email**: `admin@email.com`
- **Password**: `admin@123`

Login via `/api/auth/login` with these credentials to access admin endpoints.

---

## Project Structure

```
fastapi_backend/
├── main.py              # App entry point
├── config.py            # Configuration settings
├── database.py          # Database layer
├── firebase_config.py   # Firebase setup
├── routers/             # API endpoints
│   ├── admin.py         # Admin endpoints
│   ├── auth.py          # Authentication
│   ├── campaign.py      # Campaign management
│   ├── youtube.py       # YouTube analytics
│   └── ...
├── services/            # Business logic
│   ├── admin_service.py
│   ├── auth_service.py
│   ├── campaign_service.py
│   └── ...
├── models/              # Pydantic schemas
├── utils/               # Utilities
│   ├── rbac.py          # Role-based access
│   └── ...
├── tests/               # Test files
└── docs/                # Documentation
```

---

## Common Issues

### Port Already in Use
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process
taskkill /PID <pid> /F
```

### Module Not Found
Ensure virtual environment is activated:
```bash
.\venv\Scripts\activate
```

### Firebase Not Configured
If you see "Using in-memory mock database", this is normal for development without Firebase.
