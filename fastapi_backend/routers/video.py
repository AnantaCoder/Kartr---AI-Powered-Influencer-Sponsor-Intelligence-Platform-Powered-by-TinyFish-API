import os
import logging
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from datetime import datetime

from models.video_schemas import VideoGenerationRequest, VideoGenerationResponse as LocalVideoGenerationResponse
from services.video_service import LocalVideoService, video_service, VIDEOS_DIR
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

# ============================================================================
# Local Video Forge Router (OSS Model)
# ============================================================================

local_router = APIRouter(prefix="/api/video", tags=["AI Video Forge"])

class VideoTaskResponse(BaseModel):
    task_id: str
    status: str

class VideoStatusResponse(BaseModel):
    task_id: str
    status: str
    result_url: Optional[str] = None
    error: Optional[str] = None
    progress: int = 0

@local_router.post("/generate", response_model=VideoTaskResponse)
async def start_video_generation(
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Start asynchronous video generation.
    Returns a task ID for status polling.
    """
    task_id = f"task_{uuid.uuid4().hex[:8]}"
    
    logger.info(f"User {current_user.get('email')} started async video generation: {request.prompt}")
    
    background_tasks.add_task(
        LocalVideoService.generate_video_async,
        task_id=task_id,
        prompt=request.prompt,
        num_frames=request.num_frames,
        num_inference_steps=request.num_inference_steps,
        fps=request.fps
    )
    
    return VideoTaskResponse(task_id=task_id, status="pending")

@local_router.get("/status/{task_id}", response_model=VideoStatusResponse)
async def get_task_status(task_id: str):
    """Check status of a video generation task."""
    status_data = LocalVideoService.get_task_status(task_id)
    
    if not status_data:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return VideoStatusResponse(
        task_id=task_id,
        status=status_data.get("status"),
        result_url=status_data.get("result_url"),
        error=status_data.get("error"),
        progress=status_data.get("progress", 0)
    )

# ============================================================================
# Remote Video Generation Router (Google Veo)
# ============================================================================

router = APIRouter(prefix="/api/videos", tags=["Video Generation"])

class GenerateStoryboardRequest(BaseModel):
    """Request model for storyboard generation"""
    prompt: str = Field(..., min_length=10, max_length=500, description="Video prompt/theme")

class StoryboardResponse(BaseModel):
    """Response model for storyboard generation"""
    success: bool
    cache_key: Optional[str] = None
    storyboard: Optional[str] = None
    prompt: Optional[str] = None
    created_at: Optional[str] = None
    error: Optional[str] = None

class GenerateVideoRequest(BaseModel):
    """Request model for video generation"""
    prompt: str = Field(..., min_length=10, max_length=500, description="Video prompt/theme")
    use_cached_storyboard: bool = Field(True, description="Use cached storyboard if available")

class VideoGenerationResponse(BaseModel):
    """Response model for video generation"""
    success: bool
    video_url: Optional[str] = None
    video_filename: Optional[str] = None
    storyboard: Optional[str] = None
    cache_key: Optional[str] = None
    model_used: Optional[str] = None
    duration_seconds: Optional[int] = None
    remaining_requests: Optional[int] = None
    created_at: Optional[str] = None
    error: Optional[str] = None

class VideoListResponse(BaseModel):
    """Response model for video list"""
    videos: list
    count: int

class RateLimitInfoResponse(BaseModel):
    """Response model for rate limit info"""
    max_per_minute: int
    remaining: int
    reset_in_seconds: int = 60

@router.post("/storyboard", response_model=StoryboardResponse)
async def generate_storyboard(
    request: GenerateStoryboardRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a video storyboard from a prompt.
    """
    user_id = current_user.get("uid", current_user.get("id", "anonymous"))
    
    try:
        result = await video_service.generate_storyboard(
            prompt=request.prompt,
            user_id=user_id
        )
        
        return StoryboardResponse(
            success=True,
            cache_key=result["cache_key"],
            storyboard=result["storyboard"],
            prompt=result["prompt"],
            created_at=result["created_at"],
        )
        
    except Exception as e:
        logger.error(f"Storyboard generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/generate", response_model=VideoGenerationResponse)
async def generate_video(
    request: GenerateVideoRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate an AI video using Veo.
    """
    user_id = current_user.get("uid", current_user.get("id", "anonymous"))
    
    try:
        result = await video_service.generate_video(
            prompt=request.prompt,
            user_id=user_id,
            use_cached_storyboard=request.use_cached_storyboard
        )
        
        return VideoGenerationResponse(
            success=True,
            video_url=result["video_url"],
            video_filename=result["video_filename"],
            storyboard=result["storyboard"],
            cache_key=result["cache_key"],
            model_used=result["model_used"],
            duration_seconds=result["duration_seconds"],
            remaining_requests=result["remaining_requests"],
            created_at=result["created_at"],
        )
        
    except RuntimeError as e:
        error_message = str(e)
        if "Rate limit exceeded" in error_message:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_message
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_message
        )
    except Exception as e:
        logger.error(f"Video generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/stream/{filename}")
async def stream_video(filename: str):
    """
    Stream a generated video file.
    """
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    filepath = os.path.join(VIDEOS_DIR, filename)
    
    if not os.path.exists(filepath):
        # Also check local output dir
        local_video_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'outputs', 'videos')
        filepath = os.path.join(local_video_dir, filename)
        if not os.path.exists(filepath):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
    
    return FileResponse(
        filepath,
        media_type="video/mp4",
        filename=filename
    )

@router.get("/download/{filename}")
async def download_video(filename: str):
    """
    Download a generated video file.
    """
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    filepath = os.path.join(VIDEOS_DIR, filename)
    
    if not os.path.exists(filepath):
        local_video_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'outputs', 'videos')
        filepath = os.path.join(local_video_dir, filename)
        if not os.path.exists(filepath):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
    
    return FileResponse(
        filepath,
        media_type="video/mp4",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/list", response_model=VideoListResponse)
async def list_user_videos(
    current_user: dict = Depends(get_current_user)
):
    """
    List all videos generated by the current user.
    """
    user_id = current_user.get("uid", current_user.get("id", "anonymous"))
    videos = video_service.list_user_videos(user_id)
    return VideoListResponse(videos=videos, count=len(videos))

@router.get("/rate-limit", response_model=RateLimitInfoResponse)
async def get_rate_limit_info(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current rate limit status for video generation.
    """
    user_id = current_user.get("uid", current_user.get("id", "anonymous"))
    remaining = video_service._get_remaining_requests(user_id)
    return RateLimitInfoResponse(
        max_per_minute=3,
        remaining=remaining,
        reset_in_seconds=60
    )

@router.get("/storyboard/{cache_key}", response_model=StoryboardResponse)
async def get_cached_storyboard(
    cache_key: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve a cached storyboard by its cache key.
    """
    result = video_service.get_cached_storyboard(cache_key)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storyboard not found in cache"
        )
    
    user_id = current_user.get("uid", current_user.get("id", "anonymous"))
    if result.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return StoryboardResponse(
        success=True,
        cache_key=result["cache_key"],
        storyboard=result["storyboard"],
        prompt=result["prompt"],
        created_at=result["created_at"],
    )
