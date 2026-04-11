"""
Authentication Pydantic schemas for request/response validation
"""
from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for user registration"""
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=8)
    user_type: str = Field(..., pattern="^(influencer|sponsor|admin)$")
    full_name: Optional[str] = Field(default="", max_length=128)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response - supports both Firebase (string) and SQL (int) IDs"""
    id: Union[int, str]
    username: str
    email: str
    user_type: str
    full_name: Optional[str] = ""
    date_registered: Union[datetime, str]  # Accept both datetime and ISO string
    email_visible: bool = False
    bluesky_handle: Optional[str] = None
    keywords: Optional[list[str]] = []
    niche: Optional[str] = None
    # Never return bluesky_password

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request"""
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    """Schema for OTP verification"""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class GoogleLoginRequest(BaseModel):
    """Schema for Google Login using Firebase ID token"""
    id_token: str
    user_type: Optional[str] = "influencer"  # Default to influencer if not specified


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = None
    keywords: Optional[list[str]] = None
    # niche is read-only, updated via analysis
    email_visible: Optional[bool] = None

