"""
# Force reload trigger - fix email argument name
Kartr FastAPI Backend - Main Application Entry Point

This is the main FastAPI application that serves as the backend for the Kartr
influencer-sponsor platform. It provides RESTful APIs for:
- User authentication (login, register, password reset)
- YouTube analytics (video/channel stats, analysis)
- Search functionality
- Virtual influencer management
- Social media integration
- Image generation
- Visualization and RAG-based Q&A
"""
import logging
import os
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables

# Environment variables loaded successfully
import sys
print(f"DEBUG: sys.path = {sys.path}")
load_dotenv()

# Import routers
from routers.auth import router as auth_router
from routers.youtube import router as youtube_router
from routers.search import router as search_router
from routers.virtual_influencer import router as virtual_influencer_router
from routers.social_media import router as social_media_router
from routers.image_generation import router as image_generation_router
from routers.visualization import router as visualization_router
from routers.utilities import router as utilities_router
from routers.chat import router as chat_router
from routers.bluesky import router as bluesky_router
from routers.video_script import router as video_script_router
from routers.ad_studio import router as ad_studio_router
from routers.video import router as video_router, local_router as local_video_router
from routers.influencer import router as influencer_router
from routers.admin import router as admin_router
from routers.campaign import router as campaign_router
from routers.tracking import router as tracking_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Kartr API",
    description="FastAPI backend for Kartr - Connect Influencers and Sponsors",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS - allowed origins for frontend
# Get additional origins from environment variable
ENV_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []

ALLOWED_ORIGINS = [
    "http://localhost:3000",      # Bun/React/Next.js development
    "http://127.0.0.1:3000",
    "http://localhost:3001",      # Alternative port
    "http://127.0.0.1:3001",
    "http://localhost:5173",      # Vite development
    "http://127.0.0.1:5173",
    "http://localhost:8080",      # Common dev port
    "http://127.0.0.1:8080",
] + [origin.strip() for origin in ENV_ORIGINS if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(youtube_router)
app.include_router(search_router)
app.include_router(virtual_influencer_router)
app.include_router(social_media_router)
app.include_router(image_generation_router)
app.include_router(visualization_router)
app.include_router(utilities_router)
app.include_router(chat_router)
app.include_router(bluesky_router)
app.include_router(video_script_router)
app.include_router(ad_studio_router)
app.include_router(video_router)
app.include_router(local_video_router)
app.include_router(influencer_router)
app.include_router(admin_router)
app.include_router(campaign_router)
app.include_router(tracking_router)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": "Kartr API",
        "version": "1.0.0",
        "description": "FastAPI backend for Kartr influencer-sponsor platform",
        "docs": "/docs",
        "health": "/api/health"
    }


from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    
    # If it's a known HTTP exception, let it pass through (or handle gracefully)
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
        
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    print(f"CRITICAL ERROR: {exc}") # Force output to console
    response = JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "An error occurred"
        }
    )
    
    # Manually add CORS headers since global exception handler might bypass middleware in some cases
    origin = request.headers.get("origin")
    if origin and (origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
    return response


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("Kartr FastAPI Backend starting up...")
    logger.info("API documentation available at /docs")
    
    # Check database configuration
    from database import is_firebase_configured
    from config import settings
    
    if not is_firebase_configured():
        logger.warning("Firebase not configured. Using in-memory mock database.")
    
    if not settings.YOUTUBE_API_KEY:
        logger.warning("YouTube API key not configured. Some features will be limited.")


# Static Files for Generated Output
VIDEO_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'data', 'outputs', 'videos')
os.makedirs(VIDEO_OUTPUT_DIR, exist_ok=True)
app.mount("/data/outputs/videos", StaticFiles(directory=VIDEO_OUTPUT_DIR), name="videos")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Kartr FastAPI Backend shutting down...")


# For running with uvicorn directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    )
 
 
 
 
 
