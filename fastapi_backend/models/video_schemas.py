from pydantic import BaseModel, Field
from typing import Optional, List

class VideoGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt for the video")
    num_frames: int = Field(default=16, ge=8, le=24, description="Number of frames (default 16)")
    num_inference_steps: int = Field(default=25, ge=10, le=50, description="Steps for diffusion")
    fps: int = Field(default=8, ge=1, le=24, description="Frames per second")

class VideoGenerationResponse(BaseModel):
    success: bool
    video_url: Optional[str] = None
    error: Optional[str] = None
    prompt: str
