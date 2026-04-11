
import logging
import os
import base64
import httpx
import json
import urllib.parse
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from models.schemas import AdGenerationRequest, AdGenerationResponse, AdPostRequest
from utils.dependencies import get_current_user
from config import settings
from routers.bluesky import create_post
from fastapi import Form, UploadFile, File
from services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ad-studio", tags=["AI Ad Studio"])

@router.post("/generate-ad", response_model=AdGenerationResponse)
async def generate_ad(
    request: AdGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a full advertisement (Image + Caption) using AI.
    """
    logger.info(f"Ad generation request for product: {request.product_name}")
    
    # 1. ENHANCE PROMPT & GENERATE CAPTION with GROQ
    enhanced_prompt = f"Professional ad for {request.product_name}"
    caption = f"Check out the new {request.product_name}!"
    
    if settings.GROQ_API_KEY:
        try:
            groq_prompt = (
                f"Create 1. A detailed image prompt and 2. A catchy social media caption for: '{request.product_name}'.\n"
                f"Target Audience: {request.target_audience}\n"
                f"Tone: {request.tone}\n"
                f"Brand Identity: {request.brand_identity}\n"
                "Return as JSON with keys 'image_prompt' and 'caption'."
            )
            
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.GROQ_MODEL,
                "messages": [{"role": "user", "content": groq_prompt}],
                "temperature": 0.7,
                "response_format": {"type": "json_object"}
            }
            
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = json.loads(data['choices'][0]['message']['content'])
                    enhanced_prompt = content.get('image_prompt', enhanced_prompt)
                    caption = content.get('caption', caption)
                    logger.info("Groq successfully generated ad content")
        except Exception as e:
            logger.warning(f"Groq ad generation failed: {e}")

    # 2. GENERATE IMAGE
    image_base64 = None
    try:
        # Fallback to Pollinations for speed and reliability in demo
        encoded_prompt = urllib.parse.quote(enhanced_prompt)
        import random
        seed = random.randint(0, 1000000)
        # Optimization: Use 512x512 for demo speed and space
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=512&height=512&nologo=true&seed={seed}&model=flux"
        
        async with httpx.AsyncClient(timeout=60.0) as img_client:
            img_resp = await img_client.get(image_url)
            if img_resp.status_code == 200:
                image_base64 = base64.b64encode(img_resp.content).decode('utf-8')
                logger.info("Image successfully generated via Pollinations")
            else:
                logger.error(f"Image generation failed: {img_resp.status_code}")
    except Exception as e:
        logger.error(f"Image generation error: {e}")

    if not image_base64:
        return AdGenerationResponse(
            success=False,
            error="Failed to generate image assets."
        )

    # Return both Cloudinary URL and base64 for compatibility
    cloudinary_url = None
    if image_base64:
        # We need the bytes for Cloudinary, which were in img_resp if it succeeded
        try:
            cloudinary_url = cloudinary_service.upload_image(base64.b64decode(image_base64))
        except:
            logger.warning("Cloudinary upload failed for ad studio, falling back to base64 only")

    return AdGenerationResponse(
        success=True,
        image_base64=image_base64,
        image_url=cloudinary_url,
        caption=caption,
        enhanced_prompt=enhanced_prompt
    )

@router.post("/post-ad")
async def post_ad(
    request: AdPostRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Post the generated ad to selected platforms.
    Currently supports Bluesky.
    """
    if "bluesky" not in request.platforms:
        return {"success": False, "message": "Only Bluesky is supported at this time."}
    
    try:
        # Save base64 image to temporary file for the existing post_image logic
        temp_filename = f"temp_ad_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        temp_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", temp_filename)
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        
        with open(temp_path, "wb") as f:
            f.write(base64.b64decode(request.image_base64))
            
        # Call the existing bluesky post logic
        # We'll use the service or router logic. Router is easiest if we wrap it.
        # But create_post expects Form data. Let's call the service directly.
        from services.bluesky_service import bluesky_service
        from services.auth_service import AuthService
        
        user_full = AuthService.get_user_by_id(current_user["id"])
        handle = user_full.get("bluesky_handle")
        password = user_full.get("bluesky_password")
        
        if not handle or not password:
            raise HTTPException(status_code=400, detail="Bluesky account not linked.")
            
        result = bluesky_service.post_image(
            identifier=handle,
            password=password,
            text=request.caption,
            image_path=temp_path,
            alt_text="AI Generated Ad"
        )
        
        # Cleanup
        try: os.remove(temp_path)
        except: pass
        
        return result
    except Exception as e:
        logger.error(f"Error posting ad: {e}")
        return {"success": False, "message": str(e)}
