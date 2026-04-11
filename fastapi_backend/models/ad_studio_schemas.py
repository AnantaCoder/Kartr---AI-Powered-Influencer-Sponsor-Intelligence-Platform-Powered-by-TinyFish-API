from pydantic import BaseModel
from typing import Optional, List

class AdGenerationRequest(BaseModel):
    product_name: str
    target_audience: Optional[str] = "General"
    tone: Optional[str] = "Professional"
    brand_identity: Optional[str] = ""

class AdGenerationResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    caption: Optional[str] = None
    enhanced_prompt: Optional[str] = None
    error: Optional[str] = None

class AdPostRequest(BaseModel):
    caption: str
    image_base64: str
    platforms: List[str] # ["bluesky", "twitter", "instagram"] - focusing on bluesky for now
