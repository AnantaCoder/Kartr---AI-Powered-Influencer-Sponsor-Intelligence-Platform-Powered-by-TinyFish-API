"""
Video Script Generation router - AI-powered video script creation
"""
import logging
import httpx
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from utils.dependencies import get_current_user
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video-scripts", tags=["Video Script Generation"])


class VideoScriptRequest(BaseModel):
    """Request model for video script generation"""
    topic: str
    brand_name: str
    duration_seconds: int = 60
    target_audience: str = "general audience"
    tone: str = "professional and engaging"
    include_sponsor_mention: bool = True


class ScriptScene(BaseModel):
    """Model for a single scene in the script"""
    scene_number: int
    duration_seconds: int
    visual_description: str
    dialogue: str
    camera_notes: Optional[str] = None


class VideoScriptResponse(BaseModel):
    """Response model for generated video script"""
    success: bool
    title: str
    description: str
    total_duration: int
    scenes: List[ScriptScene]
    production_notes: Optional[str] = None
    error: Optional[str] = None


@router.post("/generate", response_model=VideoScriptResponse)
async def generate_video_script(
    request: VideoScriptRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a professional video script using Groq AI.
    
    Creates detailed scene-by-scene scripts with:
    - Visual descriptions
    - Dialogue/narration
    - Camera notes
    - Timing guidance
    - Brand integration
    
    Perfect for influencers creating sponsored content or product reviews.
    """
    
    user_id = current_user.get("uid", "anonymous")
    logger.info(f"Video script generation request from user {user_id}")
    
    if not settings.GROQ_API_KEY:
        return VideoScriptResponse(
            success=False,
            title="",
            description="",
            total_duration=0,
            scenes=[],
            error="Groq API key not configured"
        )
    
    try:
        # Construct detailed prompt for Groq
        groq_prompt = f"""You are a professional video scriptwriter for influencer content.

Create a detailed video script with the following specifications:
- Topic: {request.topic}
- Brand: {request.brand_name}
- Duration: {request.duration_seconds} seconds
- Target Audience: {request.target_audience}
- Tone: {request.tone}
- Include Sponsor Mention: {request.include_sponsor_mention}

Format your response as a structured video script with:

TITLE: [Catchy video title]

DESCRIPTION: [Brief 2-sentence description]

SCENES:
For each scene, provide:
Scene [number] ([duration]s)
VISUAL: [What the camera shows]
DIALOGUE: [What is said/narrated]
CAMERA: [Camera angles/movements]

Create {request.duration_seconds // 10} to {request.duration_seconds // 8} scenes that flow naturally.
Each scene should be 8-12 seconds.
Make it engaging, professional, and perfect for social media.
{f"Naturally integrate {request.brand_name} as the sponsor." if request.include_sponsor_mention else ""}

PRODUCTION NOTES: [Any special effects, music suggestions, or post-production tips]

Be specific and actionable!"""

        # Call Groq API
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [{"role": "user", "content": groq_prompt}],
            "temperature": 0.8,
            "max_tokens": 2000,
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            if response.status_code != 200:
                logger.error(f"Groq API error: {response.status_code}")
                return VideoScriptResponse(
                    success=False,
                    title="",
                    description="",
                    total_duration=0,
                    scenes=[],
                    error=f"Groq API error: {response.status_code}"
                )
            
            data = response.json()
            script_text = data['choices'][0]['message']['content']
            
            # Parse the script (simple parsing - you can enhance this)
            lines = script_text.split('\n')
            
            title = ""
            description = ""
            scenes = []
            production_notes = ""
            
            current_scene = None
            parsing_mode = None
            
            for line in lines:
                line = line.strip()
                
                if line.startswith("TITLE:"):
                    title = line.replace("TITLE:", "").strip()
                elif line.startswith("DESCRIPTION:"):
                    description = line.replace("DESCRIPTION:", "").strip()
                elif line.startswith("Scene ") or line.startswith("SCENE "):
                    # New scene
                    if current_scene:
                        scenes.append(current_scene)
                    
                    # Parse scene header
                    try:
                        scene_num = len(scenes) + 1
                        duration = 10  # default
                        if "(" in line and "s)" in line:
                            dur_str = line.split("(")[1].split("s)")[0]
                            duration = int(dur_str)
                        
                        current_scene = {
                            "scene_number": scene_num,
                            "duration_seconds": duration,
                            "visual_description": "",
                            "dialogue": "",
                            "camera_notes": ""
                        }
                    except:
                        pass
                        
                elif line.startswith("VISUAL:") and current_scene:
                    current_scene["visual_description"] = line.replace("VISUAL:", "").strip()
                elif line.startswith("DIALOGUE:") and current_scene:
                    current_scene["dialogue"] = line.replace("DIALOGUE:", "").strip()
                elif line.startswith("CAMERA:") and current_scene:
                    current_scene["camera_notes"] = line.replace("CAMERA:", "").strip()
                elif line.startswith("PRODUCTION NOTES:"):
                    production_notes = line.replace("PRODUCTION NOTES:", "").strip()
                elif production_notes and line and not line.startswith("Scene"):
                    production_notes += " " + line
            
            # Add last scene
            if current_scene:
                scenes.append(current_scene)
            
            # Convert to ScriptScene objects
            scene_objects = [ScriptScene(**scene) for scene in scenes]
            
            total_duration = sum(scene.duration_seconds for scene in scene_objects)
            
            logger.info(f"Generated script with {len(scene_objects)} scenes, {total_duration}s total")
            
            return VideoScriptResponse(
                success=True,
                title=title or f"{request.brand_name} - {request.topic}",
                description=description or f"Professional video script for {request.topic}",
                total_duration=total_duration,
                scenes=scene_objects,
                production_notes=production_notes or None
            )
            
    except Exception as e:
        logger.error(f"Video script generation failed: {e}")
        return VideoScriptResponse(
            success=False,
            title="",
            description="",
            total_duration=0,
            scenes=[],
            error=str(e)
        )


@router.get("/examples")
async def get_script_examples(current_user: dict = Depends(get_current_user)):
    """Get example video script requests for inspiration"""
    return {
        "examples": [
            {
                "topic": "Laptop Review",
                "brand_name": "TechPro",
                "duration_seconds": 60,
                "tone": "enthusiastic and informative"
            },
            {
                "topic": "Makeup Tutorial",
                "brand_name": "BeautyBrand",
                "duration_seconds": 90,
                "tone": "friendly and creative"
            },
            {
                "topic": "Product Unboxing",
                "brand_name": "GadgetCo",
                "duration_seconds": 45,
                "tone": "exciting and detailed"
            }
        ]
    }
