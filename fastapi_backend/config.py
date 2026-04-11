"""
Configuration settings for FastAPI backend
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App settings
    APP_NAME: str = "Kartr FastAPI Backend"
    DEBUG: bool = True
    SECRET_KEY: str = "kartr_secret_key_for_development"
    
    # JWT settings
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Firebase settings
    FIREBASE_CREDENTIALS: str = ""  # JSON string or path to service account file
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_API_KEY: str = ""  # For client-side auth if needed
    
    # Legacy Supabase settings (kept for reference, can be removed)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # Auth0 settings
    AUTH0_DOMAIN: str = ""
    AUTH0_CLIENT_ID: str = ""
    AUTH0_CLIENT_SECRET: str = ""
    AUTH0_API_AUDIENCE: str = ""
    
    # YouTube API
    YOUTUBE_API_KEY: str = ""
    
    # Gemini API
    GEMINI_API_KEY: str = ""
    GEMINI_TEXT_MODEL: str = "gemini-2.0-flash"  # For text generation, analysis, Q&A
    GEMINI_CHAT_MODEL: str = "gemini-2.0-flash"  # For chat conversations
    GEMINI_IMAGE_MODEL: str = "gemini-2.0-flash"  # For image generation
    GEMINI_VIDEO_MODEL: str = "veo-2.0-generate-001"  # For video generation
    
    # Grok API (xAI) - Fallback
    GROK_API_KEY: str = ""
    GROK_MODEL: str = "grok-2-latest"

    # Groq API (Fallback - Secondary)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-70b-8192"

    # Tavily Search API
    TAVILY_API_KEY: str = ""
    
    # Email/SMTP settings
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USE_TLS: bool = True
    
    # Bluesky settings
    BLUESKY_HANDLE: str = ""
    BLUESKY_PASSWORD: str = ""
    
    # Cloudinary settings
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # Resend Settings
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
