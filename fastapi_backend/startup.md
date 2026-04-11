# Kartr Backend - Startup Guide

## Quick Start

### 1. Prerequisites

- Python 3.9 or higher
- pip (Python package manager)

### 2. Setup Virtual Environment

```bash
# Navigate to project root
cd d:\PROJECTS\KARTR

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

1. Copy the example environment file:
   ```bash
   cd fastapi_backend
   copy .env.example .env   # Windows
   # or: cp .env.example .env  # Linux/Mac
   ```

2. Edit `.env` and configure:
   - `SECRET_KEY` - Change this for production!
   - `FIREBASE_CREDENTIALS` - Path to Firebase service account JSON
   - `YOUTUBE_API_KEY` - Optional, for YouTube features
   - `GEMINI_API_KEY` - Required for AI Chat feature (Get from https://makersuite.google.com/)

### 5. Firebase Setup (Optional)

For production use with a database:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to **Project Settings → Service Accounts**
4. Click **"Generate new private key"**
5. Save the JSON file as `firebase-service-account.json` in `fastapi_backend/`
6. Update `.env`:
   ```
   FIREBASE_CREDENTIALS=firebase-service-account.json
   ```

**Note:** Without Firebase configured, the app uses an in-memory mock database (data is lost on restart).

---

## Starting the Server

### Development Mode (with auto-reload)

```bash
cd fastapi_backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Production Mode

```bash
cd fastapi_backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using the main.py directly

```bash
cd fastapi_backend
python main.py
```

---

## API Endpoints

Once running, the API is available at:

| URL | Description |
|-----|-------------|
| http://127.0.0.1:8000 | API root |
| http://127.0.0.1:8000/docs | Swagger UI documentation |
| http://127.0.0.1:8000/redoc | ReDoc documentation |
| http://127.0.0.1:8000/openapi.json | OpenAPI specification |

---

## CORS Configuration

The backend is configured to accept requests from these frontend origins:

| Origin | Framework |
|--------|-----------|
| `http://localhost:3000` | React / Next.js |
| `http://127.0.0.1:3000` | React / Next.js |
| `http://localhost:5173` | Vite |
| `http://127.0.0.1:5173` | Vite |
| `http://localhost:8080` | Vue |
| `http://127.0.0.1:8080` | Vue |

To add more origins, edit `ALLOWED_ORIGINS` in `fastapi_backend/main.py`.

---

## Frontend Connection

From your frontend (e.g., React on port 3000):

```javascript
const API_BASE = 'http://127.0.0.1:8000';

// Example: Login
const response = await fetch(`${API_BASE}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  }),
});

const data = await response.json();
console.log(data.access_token);
```

---

## Verify Setup

Run the structural tests to verify everything is configured correctly:

```bash
cd fastapi_backend
python test_structure.py
```

Expected output:
```
✅ All tests passed! (23/23)
```

---

## Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt
```

### Firebase not connecting
- Verify `firebase-service-account.json` exists in `fastapi_backend/`
- Check `.env` has correct `FIREBASE_CREDENTIALS` path

### CORS errors in browser
- Ensure your frontend URL is in `ALLOWED_ORIGINS` in `main.py`
- Restart the backend after changes

### Port already in use
```bash
# Use a different port
python -m uvicorn main:app --port 8001
```
