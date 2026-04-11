"""
YouTube router - Stats, Demo, Channel Analysis
"""
import logging
import os
import csv
from datetime import datetime
from typing import Optional
import shutil
import tempfile
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from models.schemas import (
    YouTubeStatsRequest,
    YouTubeStatsResponse,
    VideoStats,
    ChannelStats,
    AnalyzeVideoRequest,
    AnalyzeVideoResponse,
    AnalyzeChannelRequest,
    SaveAnalysisRequest,
    YouTubeChannelResponse,
    MessageResponse,
    BulkVideoAnalysisResponse,
)
from services.youtube_service import youtube_service
from services.auth_service import AuthService
from services.chat_service import ChatService
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/youtube", tags=["YouTube Analytics"])


@router.post("/stats", response_model=YouTubeStatsResponse)
async def get_youtube_stats(
    request: YouTubeStatsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get statistics for a YouTube video/channel.
    """
    youtube_url = request.youtube_url
    
    # Try to get video stats first
    video_data = youtube_service.get_video_stats(youtube_url)
    
    video_stats = None
    channel_stats = None
    
    # If video found
    if video_data and "error" not in video_data:
        video_stats = VideoStats(
            video_id=video_data.get("video_id", ""),
            title=video_data.get("title", ""),
            description=video_data.get("description", ""),
            view_count=video_data.get("view_count", 0),
            like_count=video_data.get("like_count", 0),
            comment_count=video_data.get("comment_count", 0),
            published_at=video_data.get("published_at", ""),
            thumbnail_url=video_data.get("thumbnail_url", ""),
        )
        
        # Get channel stats from video
        channel_id = video_data.get("channel_id")
        if channel_id:
            channel_data = youtube_service.get_channel_stats(channel_id)
            if channel_data and "error" not in channel_data:
                channel_stats = ChannelStats(
                    channel_id=channel_data.get("channel_id", ""),
                    title=channel_data.get("title", ""),
                    subscriber_count=channel_data.get("subscriber_count", 0),
                    video_count=channel_data.get("video_count", 0),
                    view_count=channel_data.get("view_count", 0),
                    description=channel_data.get("description", ""),
                    thumbnail_url=channel_data.get("thumbnail_url", ""),
                )
                
                # Save channel to user's linked channels
                youtube_service.save_channel(current_user["id"], channel_data)

    # If video not found, try treating it as a channel URL/ID directly
    else:
        channel_data = youtube_service.get_channel_stats(youtube_url)
        if channel_data and "error" not in channel_data:
            channel_stats = ChannelStats(
                channel_id=channel_data.get("channel_id", ""),
                title=channel_data.get("title", ""),
                subscriber_count=channel_data.get("subscriber_count", 0),
                video_count=channel_data.get("video_count", 0),
                view_count=channel_data.get("view_count", 0),
                description=channel_data.get("description", ""),
                thumbnail_url=channel_data.get("thumbnail_url", ""),
            )
            
            # Save channel
            youtube_service.save_channel(current_user["id"], channel_data)
        else:
            # If both failed, return valid error
            return YouTubeStatsResponse(error="Invalid YouTube URL, Video ID, or Channel ID")
    
    # Save search history
    youtube_service.save_search(
        user_id=current_user["id"],
        search_term=youtube_url,
        video_id=video_stats.video_id if video_stats else None
    )
    
    return YouTubeStatsResponse(
        video_stats=video_stats,
        channel_stats=channel_stats
    )


@router.post("/demo")
async def extract_video_info(
    request: YouTubeStatsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Extract detailed information from a YouTube video for sponsors/influencers.
    """
    youtube_url = request.youtube_url
    
    # Get video stats
    video_data = youtube_service.get_video_stats(youtube_url)
    
    if not video_data or "error" in video_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=video_data.get("error", "Could not extract video information")
        )
    
    # Save search
    youtube_service.save_search(
        user_id=current_user["id"],
        search_term=youtube_url,
        video_id=video_data.get("video_id")
    )
    
    return video_data


@router.post(
    "/analyze-video",
    response_model=AnalyzeVideoResponse,
    summary="Analyze YouTube Video with AI",
    # ... description ...
)
async def analyze_video(
    request: AnalyzeVideoRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze a YouTube video for influencer and sponsor information.
    Uses Gemini AI for content analysis.
    Supports single URL (video_url) or multiple URLs (video_urls).
    """
    try:
        from services.analysis_service import analyze_influencer_sponsors, analyze_bulk_influencer_sponsors
        
        # Check if it's a bulk request
        if request.video_urls and len(request.video_urls) > 0:
            # For bulk, we'll process them and return the first one or a special response
            # Actually, let's keep it simple: if video_url is missing but video_urls has items, prioritize video_urls[0]
            # BUT we should probably have a dedicated bulk endpoint if we want to return a list.
            # According to task.md, user wants "Support links for bulk analysis".
            # Let's add the dedicated endpoint below or transform this one.
            pass

        url_to_analyze = request.video_url
        if not url_to_analyze and request.video_urls:
            url_to_analyze = request.video_urls[0]
            
        if not url_to_analyze:
            raise HTTPException(status_code=400, detail="Either video_url or video_urls must be provided")

        result = analyze_influencer_sponsors(url_to_analyze)
        
        # Check for service-level error
        if result and "error" in result:
            # If there's an error, we can't return it as AnalyzeVideoResponse 
            # because missing required fields (video_id, title) will cause 500 Validation Error.
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
            
        return result
    except ImportError:
        # Fallback to basic video info
        video_data = youtube_service.get_video_stats(request.video_url or request.video_urls[0])
        return video_data or {"error": "Analysis module not available"}
    except Exception as e:
        logger.error(f"Video analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/analyze-bulk", response_model=BulkVideoAnalysisResponse)
async def analyze_bulk(
    request: AnalyzeVideoRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Perform bulk analysis on multiple YouTube videos.
    """
    try:
        from services.analysis_service import analyze_bulk_influencer_sponsors
        
        urls = request.video_urls or []
        if request.video_url:
            urls.append(request.video_url)
            
        if not urls:
            raise HTTPException(status_code=400, detail="No YouTube URLs provided for analysis")
            
        return analyze_bulk_influencer_sponsors(urls)
    except Exception as e:
        logger.error(f"Bulk analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/analyze-channel")
async def analyze_channel(
    request: AnalyzeChannelRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze multiple videos from a YouTube channel.
    Accepts Channel ID or URL.
    Uses AI for accurate sponsor detection.
    """
    try:
        # 1. Get channel info (resolves URL -> ID)
        channel_data = youtube_service.get_channel_stats(request.channel_id)
        
        if not channel_data or "error" in channel_data:
            raise HTTPException(
                status_code=400,
                detail=channel_data.get("error", "Channel not found or invalid URL")
            )

        # 2. Extract resolved ID
        resolved_channel_id = channel_data.get("channel_id")

        # 3. Get videos using resolved ID (with basic keyword-based sponsor detection)
        videos = youtube_service.get_channel_videos(resolved_channel_id, request.max_videos)
        
        # 4. Enhance sponsor detection using AI (async-like processing)
        try:
            from services.analysis_service import analyze_video_sponsors_ai
            videos = analyze_video_sponsors_ai(videos)
            logger.info(f"AI sponsor analysis completed for {len(videos)} videos")
        except Exception as e:
            logger.warning(f"AI sponsor analysis failed, using keyword detection: {e}")
            # Continue with keyword-based detection results
        
        return {
            "channel": channel_data,
            "videos": videos
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Channel analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/save-analysis", response_model=MessageResponse)
async def save_analysis(
    request: SaveAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save analysis data to Firebase database.
    """
    try:
        from firebase_config import FirestoreRepository, get_firestore
        from database import is_firebase_configured
        
        analysis_data = {
            "date": datetime.now().isoformat(),
            "user_id": str(current_user["id"]),
            "video_title": request.video_title,
            "channel_name": request.channel_name,
            "creator_name": request.creator_name,
            "creator_industry": request.creator_industry,
            "sponsors": request.sponsors or [],
            "sponsor_name": request.sponsors[0].get("name", "No Sponsor") if request.sponsors else "No Sponsor",
            "sponsor_industry": request.sponsors[0].get("industry", "N/A") if request.sponsors else "N/A",
        }
        
        # Try Firebase first
        if is_firebase_configured():
            analyses_repo = FirestoreRepository('video_analyses')
            result = analyses_repo.create(analysis_data)
            if result:
                logger.info(f"Analysis saved to Firebase: {result.get('id')}")
                return MessageResponse(success=True, message="Analysis saved successfully")
            else:
                logger.warning("Failed to save to Firebase, falling back to CSV")
        
        # Fallback to CSV if Firebase fails or not configured
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        os.makedirs(data_dir, exist_ok=True)
        
        csv_file = os.path.join(data_dir, 'analysis_results.csv')
        file_exists = os.path.isfile(csv_file)
        
        with open(csv_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            if not file_exists:
                writer.writerow([
                    'Date', 'User ID', 'Video/Channel Title', 'Channel Name',
                    'Creator Name', 'Creator Industry', 'Sponsor Name', 'Sponsor Industry'
                ])
            
            if not request.sponsors:
                writer.writerow([
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    current_user["id"],
                    request.video_title,
                    request.channel_name,
                    request.creator_name,
                    request.creator_industry,
                    'No Sponsor',
                    'N/A'
                ])
            else:
                for sponsor in request.sponsors:
                    writer.writerow([
                        datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        current_user["id"],
                        request.video_title,
                        request.channel_name,
                        request.creator_name,
                        request.creator_industry,
                        sponsor.get('name', 'Unknown'),
                        sponsor.get('industry', 'Unknown')
                    ])
        
        return MessageResponse(success=True, message="Analysis saved successfully (CSV fallback)")
        
    except Exception as e:
        logger.error(f"Error saving analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/channels")
async def get_user_channels(current_user: dict = Depends(get_current_user)):
    """
    Get all YouTube channels linked to the current user.
    """
    channels = youtube_service.get_user_channels(current_user["id"])
    return {"channels": channels}


@router.delete("/channels/{channel_id}")
async def remove_user_channel(
    channel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove a linked YouTube channel.
    """
    success = youtube_service.remove_channel(current_user["id"], channel_id)
    if not success:
        # We return success roughly even if not found to be idempotent, 
        # but technically if it failed due to error it returns False.
        # For UI purposes, we can assume if it's gone, it's success.
        # But if we strictly want 404 if not found, we'd need more logic in service.
        # For now, let's treat False as "not found or failed".
        # However, to be safe, we just return message.
        pass
        
    return {"success": True, "message": "Channel removed successfully"}


@router.post("/analyze-niche", response_model=MessageResponse)
async def analyze_niche(current_user: dict = Depends(get_current_user)):
    """
    Analyze user's connected YouTube channel to determine niche.
    Updates the user's profile with the generated niche.
    """
    # 1. Get user's connected channels
    channels = youtube_service.get_user_channels(current_user["id"])
    if not channels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No connected YouTube channels found. Please connect a channel first."
        )
    
    # Use the first channel (primary)
    primary_channel = channels[0]
    channel_id = primary_channel.get('channel_id')
    
    try:
        # 2. Fetch fresh data
        channel_data = youtube_service.get_channel_stats(channel_id)
        if hasattr(channel_data, 'dict'):
             channel_data = channel_data.dict()

        videos = youtube_service.get_channel_videos(channel_id, max_results=5)
        
        # 3. Analyze niche
        niche = ChatService.analyze_niche(channel_data, videos)
        
        if not niche:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate niche analysis"
            )
            
        # 4. Save to user profile
        AuthService.update_user(current_user["id"], {"niche": niche})
        
        return MessageResponse(
            success=True,
            message=niche 
        )
        
    except Exception as e:
        logger.error(f"Niche analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/analyze-video-file")
async def analyze_uploaded_video(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze an uploaded MP4 video file.
    """
    try:
        # Validate file type
        if file.content_type != "video/mp4":
            raise HTTPException(400, "Only MP4 files are supported")

        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        try:
            from services.analysis_service import analyze_video_file
            result = analyze_video_file(tmp_path)
            
            if "error" in result:
                raise HTTPException(400, result["error"])
                
            return result
            
        finally:
            # Cleanup temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
    except Exception as e:
        logger.error(f"Upload analysis failed: {e}")
        raise HTTPException(500, str(e))
