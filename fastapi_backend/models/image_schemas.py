"""
Image generation Pydantic schemas for request/response validation
"""
from typing import Optional
from pydantic import BaseModel


class GenerateImageRequest(BaseModel):
    """Request to generate promotional image"""
    prompt: str
    brand_name: str = "YourBrand"


class GenerateLLMImageRequest(BaseModel):
    """Request to generate LLM influencer image"""
    prompt: str


class ImageGenerationResponse(BaseModel):
    """Response for image generation"""
    success: bool
    image_base64: Optional[str] = None
    error: Optional[str] = None
    model_used: Optional[str] = None  # Track which model generated the image

