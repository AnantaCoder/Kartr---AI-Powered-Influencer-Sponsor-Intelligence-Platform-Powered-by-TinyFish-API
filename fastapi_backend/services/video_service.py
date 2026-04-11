import logging
import os
import time
import uuid
import asyncio
import hashlib
import requests
import cv2
import numpy as np
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

from config import settings
from services.storage_service import storage_service
from services.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

# Lazy imports for ML libraries to allow backend to start without them
torch = None
DiffusionPipeline = None
DPMSolverMultistepScheduler = None
export_to_video = None

def _import_ml_libs():
    global torch, DiffusionPipeline, DPMSolverMultistepScheduler, export_to_video
    try:
        import torch
        from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler
        from diffusers.utils import export_to_video
        return True
    except Exception as e:
        logger.warning(f"ML libraries for video generation not available or incompatible: {e}")
        return False

class LocalVideoService:
    _pipe = None
    _video_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'outputs', 'videos')
    _tasks: Dict[str, Dict[str, Any]] = {}  # task_id -> {status, result, error, progress}

    @classmethod
    def _initialize_pipeline(cls):
        if cls._pipe is not None:
            return True
        
        if not _import_ml_libs():
            return False
            
        try:
            logger.info("Initializing Video Diffusion Pipeline (damo-vilab/text-to-video-ms-1.7b)...")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            dtype = torch.float16 if device == "cuda" else torch.float32
            variant = "fp16" if device == "cuda" else None
            
            logger.info(f"Using device: {device}, dtype: {dtype}, variant: {variant}")
            
            cls._pipe = DiffusionPipeline.from_pretrained(
                "damo-vilab/text-to-video-ms-1.7b", 
                torch_dtype=dtype, 
                variant=variant
            )
            cls._pipe.scheduler = DPMSolverMultistepScheduler.from_config(cls._pipe.scheduler.config)
            
            # Optimization for GPU memory
            if device == "cuda":
                logger.info("Enabling GPU memory optimizations (CPU offload + VAE slicing)")
                cls._pipe.enable_model_cpu_offload()
                cls._pipe.enable_vae_slicing()
            else:
                logger.info("Running on CPU. Expect slow generation.")
                cls._pipe.to("cpu")
                
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Video pipeline: {e}", exc_info=True)
            return False

    @classmethod
    def generate_video(
        cls, 
        prompt: str, 
        num_frames: int = 16, 
        num_inference_steps: int = 15, # Optimized for demo (was 25)
        fps: int = 8
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Generate a video from a text prompt.
        Returns: (success, video_rel_path, error_message)
        """
        # 1. Check Dependencies First
        if not _import_ml_libs():
             return False, None, "AI dependencies missing. Please run: pip install torch diffusers accelerate"

        # 2. Initialize Model (Downloads on first run)
        if not cls._initialize_pipeline():
            # Check if it was a CPU limitation
            device_msg = " (Running on CPU)" if torch and not torch.cuda.is_available() else ""
            return False, None, f"Video Model is still loading or failed to initialize{device_msg}. First run downloads ~4GB. Check terminal logs."

        try:
            # Create video directory if not exists
            os.makedirs(cls._video_dir, exist_ok=True)
            
            # Optimization: Cleanup old videos (older than 2 hours)
            storage_service.cleanup_directory(cls._video_dir, max_age_hours=2)
            
            video_filename = f"gen_video_{uuid.uuid4().hex[:8]}_{int(time.time())}.mp4"
            video_path = os.path.join(cls._video_dir, video_filename)
            
            logger.info(f"Generating video for prompt: '{prompt}'")
            
            # Generate frames
            # Note: num_frames is usually small for this model (e.g. 16)
            result = cls._pipe(
                prompt, 
                num_inference_steps=num_inference_steps, 
                num_frames=num_frames
            )
            video_frames = result.frames # List of numpy arrays or tensors
            
            # Process frames for export
            processed_frames = []
            for frame in video_frames[0]: # Result frames is often a list containing the batch
                if isinstance(frame, torch.Tensor):
                    frame = frame.detach().cpu().float().numpy()

                # If (C, H, W), transpose to (H, W, C)
                if frame.ndim == 3 and frame.shape[0] in [1, 3, 4]:
                    frame = frame.transpose(1, 2, 0)

                # Normalize and convert to uint8
                frame = (frame.clip(0, 1) * 255).astype(np.uint8)
                
                # Convert RGB to BGR for OpenCV
                frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                processed_frames.append(frame_bgr)

            # Export using OpenCV
            if not processed_frames:
                return False, None, "No frames generated."
                
            height, width, _ = processed_frames[0].shape
            
            # Try H.264 (X264) first as it's more web-compatible, fallback to mp4v
            # Common FourCC codes: 'avc1', 'X264', 'mp4v'
            fourcc_options = ['avc1', 'X264', 'mp4v']
            out = None
            
            for f_code in fourcc_options:
                try:
                    fourcc = cv2.VideoWriter_fourcc(*f_code)
                    out = cv2.VideoWriter(video_path, fourcc, fps, (width, height))
                    if out.isOpened():
                        logger.info(f"Successfully opened VideoWriter with FourCC: {f_code}")
                        break
                except:
                    continue
            
            if out is None or not out.isOpened():
                error_msg = "Could not open VideoWriter with any compatible FourCC."
                if np and hasattr(np, '__version__') and np.__version__.startswith('2.'):
                    error_msg += " (Note: NumPy 2.x detected, which may cause compatibility issues with some ML-driven OpenCV operations. Attempting to proceed...)"
                return False, None, error_msg
            
            for frame in processed_frames:
                out.write(frame)
            out.release()
            
            # Upload to Cloudinary
            cloudinary_url = cloudinary_service.upload_video(video_path)
            if cloudinary_url:
                logger.info(f"Video uploaded to Cloudinary: {cloudinary_url}")
                # Optional: delete local file after successful upload
                try: os.remove(video_path)
                except: pass
                return True, cloudinary_url, None

            # Return relative path for frontend access (fallback)
            rel_path = f"/data/outputs/videos/{video_filename}"
            logger.info(f"Video saved locally to: {video_path}")
            return True, rel_path, None
        except Exception as e:
            logger.error(f"Video generation error: {e}", exc_info=True)
    @classmethod
    async def generate_slideshow_fallback(cls, prompt: str, user_id: str) -> Dict[str, Any]:
        """
        Generate a slideshow video locally using Pollinations.ai images + OpenCV.
        100% Free fallback when other methods fail.
        """
        try:
            logger.info("Initializing Slideshow Fallback generation...")
            
            # 1. Generate Image Prompts using Gemini (or simple split if unavailable)
            image_prompts = []
            try:
                # Import here to avoid circular dep or issues
                from google import genai
                from config import settings
                
                if settings.GEMINI_API_KEY:
                    client = genai.Client(api_key=settings.GEMINI_API_KEY)
                    # Ask for 4 visual scenes
                    response = client.models.generate_content(
                        model=settings.GEMINI_TEXT_MODEL or "gemini-2.0-flash",
                        contents=f"Create 4 distinct, detailed visual image descriptions to tell a story for the video concept: '{prompt}'. Return ONLY the descriptions, one per line."
                    )
                    image_prompts = [line.strip() for line in response.text.split('\n') if line.strip() and len(line) > 10][:4]
            except Exception as e:
                logger.warning(f"Could not generate intelligent prompts for slideshow: {e}")
            
            # Fallback prompts if AI failed
            if not image_prompts:
                image_prompts = [
                    f"{prompt}, cinematic, establishing shot",
                    f"{prompt}, close up details, high quality",
                    f"{prompt}, action shot, dynamic lighting",
                    f"{prompt}, chaotic finale, dramatic",
                ]

            # 2. Generate Images via Pollinations.ai
            images = []
            import httpx
            import urllib.parse
            import random
            
            async with httpx.AsyncClient(follow_redirects=True) as http_client:
                for target_prompt in image_prompts:
                    try:
                        encoded = urllib.parse.quote(target_prompt)
                        seed = random.randint(0, 999999)
                        # Use Flux model for best quality
                        url = f"https://image.pollinations.ai/prompt/{encoded}?width=1280&height=720&model=flux&nologo=true&seed={seed}"
                        
                        logger.info(f"Generating slide: {url}")
                        resp = await http_client.get(url, timeout=60.0)
                        
                        if resp.status_code == 200:
                            # Convert to numpy array for OpenCV
                            image_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
                            img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                            if img is not None:
                                images.append(img)
                            else:
                                logger.warning(f"Failed to decode image from Pollinations for prompt: {target_prompt}")
                        else:
                            logger.warning(f"Pollinations returned status {resp.status_code} for prompt: {target_prompt}")
                            
                    except Exception as e:
                        logger.warning(f"Failed to generate slide for '{target_prompt}': {e}")
            
            if len(images) < 2:
                logger.warning("Pollinations.ai failed to generate enough images. Falling back to LOCAL TEXT SLIDES.")
                images = [] # Reset
                width, height = 1280, 720
                
                # Ensure we have at least some prompts
                if not image_prompts:
                    image_prompts = [prompt]

                for i, txt in enumerate(image_prompts):
                    try:
                        # Create black image
                        img = np.zeros((height, width, 3), dtype=np.uint8)
                        
                        # Add text
                        font = cv2.FONT_HERSHEY_SIMPLEX
                        font_scale = 1.0
                        color = (255, 255, 255)
                        thickness = 2
                        
                        # Simple text wrapping
                        words = txt.split()
                        lines = []
                        current_line = []
                        for word in words:
                            current_line.append(word)
                            if len(' '.join(current_line)) > 50: # Approx char limit
                                lines.append(' '.join(current_line[:-1]))
                                current_line = [word]
                        lines.append(' '.join(current_line))
                        
                        # Draw lines centered
                        total_text_height = len(lines) * 50
                        y = (height - total_text_height) // 2
                        
                        for line in lines:
                            text_size = cv2.getTextSize(line, font, font_scale, thickness)[0]
                            x = (width - text_size[0]) // 2
                            # Ensure x is positive
                            x = max(10, x)
                            cv2.putText(img, line, (x, y + 40), font, font_scale, color, thickness)
                            y += 50
                            
                        images.append(img)
                    except Exception as e_text:
                        logger.error(f"Failed to create text slide: {e_text}")
                
                if not images:
                    # Final fallback if even text fails (should effectively never happen)
                    img = np.zeros((720, 1280, 3), dtype=np.uint8)
                    cv2.putText(img, "Video Generation Failed", (400, 360), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 2)
                    images.append(img)

            # 3. Create Video using OpenCV
            video_filename = f"slideshow_{uuid.uuid4().hex[:8]}.mp4"
            output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'outputs', 'videos')
            os.makedirs(output_dir, exist_ok=True)
            video_path = os.path.join(output_dir, video_filename)
            
            # Setup Video Writer
            height, width, _ = images[0].shape
            fourcc = cv2.VideoWriter_fourcc(*'mp4v') # Universal fallback
            fps = 24
            duration_per_slide = 2 # seconds
            frames_per_slide = fps * duration_per_slide
            
            out = cv2.VideoWriter(video_path, fourcc, fps, (width, height))
            
            for img in images:
                # Resize if needed to match first frame
                if img.shape[:2] != (height, width):
                    img = cv2.resize(img, (width, height))
                
                # Write static frame for duration
                for _ in range(frames_per_slide):
                    out.write(img)
                    
            out.release()
            
            # 4. Return formatted response (mimicking Veo response)
            rel_path = f"/api/videos/download/{video_filename}" # Serve via API
            
            return {
                "success": True,
                "video_url": rel_path,
                "video_filename": video_filename,
                "storyboard": "\n\n".join(image_prompts),
                "cache_key": "fallback_slideshow",
                "model_used": "pollinations-slideshow (free)",
                "duration_seconds": len(images) * duration_per_slide,
                "remaining_requests": 999,
                "created_at": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Slideshow fallback failed: {e}")
            raise e

    @classmethod
    def get_task_status(cls, task_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve task state."""
        return cls._tasks.get(task_id)

    @classmethod
    async def generate_video_async(cls, task_id: str, prompt: str, **kwargs):
        """Background worker for video generation."""
        cls._tasks[task_id] = {"status": "processing", "progress": 10, "prompt": prompt}
        
        try:
            success, result_url, error_msg = cls.generate_video(prompt, **kwargs)
            
            if success:
                cls._tasks[task_id].update({
                    "status": "completed",
                    "progress": 100,
                    "result_url": result_url
                })
                logger.info(f"Task {task_id} completed successfully.")
            else:
                cls._tasks[task_id].update({
                    "status": "failed",
                    "error": error_msg
                })
                logger.error(f"Task {task_id} failed: {error_msg}")
                
        except Exception as e:
            cls._tasks[task_id].update({
                "status": "failed",
                "error": str(e)
            })
            logger.error(f"Async Task Error {task_id}: {e}")

# Rate limiting storage (in-memory for simplicity)
_rate_limit_cache: Dict[str, list] = defaultdict(list)
_storyboard_cache: Dict[str, Dict[str, Any]] = {}

# Constants
VIDEOS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "videos")
MAX_VIDEOS_PER_MINUTE = 3
VIDEO_DURATION_SECONDS = 8


class VideoService:
    """Service for generating videos using Google Veo models"""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure video storage directory exists"""
        os.makedirs(VIDEOS_DIR, exist_ok=True)
    
    def _get_client(self):
        """Lazy initialization of Gemini client"""
        if self.client is None:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except ImportError:
                raise RuntimeError("google-genai package not installed")
        return self.client
    
    def _check_rate_limit(self, user_id: str) -> bool:
        """
        Check if user has exceeded rate limit (3 videos per minute).
        Returns True if allowed, False if rate limited.
        """
        now = datetime.now()
        one_minute_ago = now - timedelta(minutes=1)
        
        # Clean old entries
        _rate_limit_cache[user_id] = [
            ts for ts in _rate_limit_cache[user_id] 
            if ts > one_minute_ago
        ]
        
        # Check limit
        if len(_rate_limit_cache[user_id]) >= MAX_VIDEOS_PER_MINUTE:
            return False
        
        return True
    
    def _record_request(self, user_id: str):
        """Record a video generation request for rate limiting"""
        _rate_limit_cache[user_id].append(datetime.now())
    
    def _get_remaining_requests(self, user_id: str) -> int:
        """Get remaining requests for this minute"""
        now = datetime.now()
        one_minute_ago = now - timedelta(minutes=1)
        
        # Clean old entries
        _rate_limit_cache[user_id] = [
            ts for ts in _rate_limit_cache[user_id] 
            if ts > one_minute_ago
        ]
        
        return MAX_VIDEOS_PER_MINUTE - len(_rate_limit_cache[user_id])
    
    def _generate_cache_key(self, prompt: str, user_id: str) -> str:
        """Generate a cache key for the storyboard"""
        content = f"{prompt}:{user_id}:{datetime.now().strftime('%Y%m%d%H')}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def generate_storyboard(self, prompt: str, user_id: str) -> Dict[str, Any]:
        """
        Generate a video storyboard using Gemini.
        Caches the result for potential reuse.
        """
        cache_key = self._generate_cache_key(prompt, user_id)
        
        # Check cache first
        if cache_key in _storyboard_cache:
            logger.info(f"Returning cached storyboard for key {cache_key[:8]}")
            return _storyboard_cache[cache_key]
        
        client = self._get_client()
        
        storyboard_prompt = f"""
Create a detailed cinematic storyboard for a {VIDEO_DURATION_SECONDS}-second video.

Theme/Prompt: {prompt}

Requirements:
- Create 3-4 scenes that fit within {VIDEO_DURATION_SECONDS} seconds total
- Each scene should include:
  - Scene number
  - Shot description (visual details)
  - Camera movement (pan, zoom, static, etc.)
  - Duration in seconds
  - Mood/lighting notes
- Style: Cinematic, professional, engaging

Output the storyboard in a clear numbered format.
"""
        
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_TEXT_MODEL,
                contents=storyboard_prompt,
            )
            
            storyboard_text = ""
            for candidate in response.candidates or []:
                for part in candidate.content.parts or []:
                    if hasattr(part, "text"):
                        storyboard_text += part.text
            
            result = {
                "cache_key": cache_key,
                "prompt": prompt,
                "storyboard": storyboard_text,
                "created_at": datetime.now().isoformat(),
                "user_id": user_id,
            }
            
            # Cache the storyboard
            _storyboard_cache[cache_key] = result
            logger.info(f"Generated and cached storyboard for key {cache_key[:8]}")
            
            return result
            
        except Exception as e:
            logger.error(f"Storyboard generation failed: {e}")
            raise RuntimeError(f"Failed to generate storyboard: {str(e)}")
    
    def _find_best_veo_model(self) -> str:
        """Find the best available Veo model"""
        client = self._get_client()
        
        # Priority order: Veo 3.1 > Veo 3.0 > Veo 2.0
        model_priorities = ["veo-3.1", "veo-3.0", "veo-2.0"]
        
        try:
            for priority in model_priorities:
                for m in client.models.list():
                    if priority in m.name.lower() and "generate" in m.name.lower():
                        return m.name.split("/")[-1]
        except Exception as e:
            logger.warning(f"Model search failed: {e}")
        
        # Fallback
        return "veo-2.0-generate-001"
    
    async def generate_video(
        self, 
        prompt: str, 
        user_id: str,
        use_cached_storyboard: bool = True
    ) -> Dict[str, Any]:
    
        """
        Generate a video using Veo.
        
        1. Check rate limit
        2. Generate storyboard (cached)
        3. Generate video
        4. Save to data/videos
        5. Return result
        """
        # Check rate limit
        if not self._check_rate_limit(user_id):
            remaining_seconds = 60  # Approximate
            raise RuntimeError(
                f"Rate limit exceeded. Maximum {MAX_VIDEOS_PER_MINUTE} videos per minute. "
                f"Please wait {remaining_seconds} seconds."
            )
        
        # Record this request
        self._record_request(user_id)
        
        try:
            # Generate storyboard first
            storyboard_result = await self.generate_storyboard(prompt, user_id)
            
            # Get best Veo model
            veo_model = self._find_best_veo_model()
            logger.info(f"Using Veo model: {veo_model}")
            
            # Build video prompt from original prompt + storyboard context
            video_prompt = f"{prompt}. Cinematic quality, professional lighting, smooth camera movements."
        
            from google.genai import types
            
            client = self._get_client()
            
            # Start video generation
            operation = client.models.generate_videos(
                model=veo_model,
                prompt=video_prompt,
                config=types.GenerateVideosConfig(
                    number_of_videos=1,
                    duration_seconds=VIDEO_DURATION_SECONDS,
                )
            )
            
            # Poll for completion
            logger.info("Video generation started, polling for completion...")
            while not operation.done:
                await asyncio.sleep(5)
                operation = client.operations.get(operation)
            
            # Check result
            if not operation.result or not operation.result.generated_videos:
                raise RuntimeError("Video generation returned no result")
            
            generated_video = operation.result.generated_videos[0]
            
            # Download video from URI
            if not hasattr(generated_video.video, 'uri'):
                raise RuntimeError("No video URI in response")
            
            uri = generated_video.video.uri
            
            # Add API key for auth
            if '?' in uri:
                auth_uri = f"{uri}&key={self.api_key}"
            else:
                auth_uri = f"{uri}?key={self.api_key}"
            
            # Download
            response = requests.get(auth_uri, timeout=120)
            if response.status_code != 200:
                raise RuntimeError(f"Failed to download video: HTTP {response.status_code}")
            
            # Save video
            timestamp = int(time.time())
            safe_user_id = user_id.replace("@", "_").replace(".", "_")[:20]
            filename = f"video_{safe_user_id}_{timestamp}.mp4"
            filepath = os.path.join(VIDEOS_DIR, filename)
            
            with open(filepath, "wb") as f:
                f.write(response.content)
            
            logger.info(f"Video saved to: {filepath}")
            
            return {
                "success": True,
                "video_path": filepath,
                "video_filename": filename,
                "video_url": f"/api/videos/stream/{filename}",
                "storyboard": storyboard_result["storyboard"],
                "cache_key": storyboard_result["cache_key"],
                "model_used": veo_model,
                "duration_seconds": VIDEO_DURATION_SECONDS,
                "remaining_requests": self._get_remaining_requests(user_id),
                "created_at": datetime.now().isoformat(),
            }
            
        except Exception as e:
            logger.warning(f"Veo video generation failed: {e}. Attempting free fallback (Slideshow)...")
            try:
                # Fallback to free slideshow generator
                return await LocalVideoService.generate_slideshow_fallback(prompt, user_id)
            except Exception as e_fallback:
                logger.error(f"Fallback video generation also failed: {e_fallback}")
                raise RuntimeError(f"Video generation failed: {str(e)} -> Fallback error: {str(e_fallback)}")
    
    def get_cached_storyboard(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Retrieve a cached storyboard"""
        return _storyboard_cache.get(cache_key)
    
    def list_user_videos(self, user_id: str) -> list:
        """List all videos for a user"""
        safe_user_id = user_id.replace("@", "_").replace(".", "_")[:20]
        videos = []
        
        if not os.path.exists(VIDEOS_DIR):
            return videos
        
        for filename in os.listdir(VIDEOS_DIR):
            if filename.startswith(f"video_{safe_user_id}_") and filename.endswith(".mp4"):
                filepath = os.path.join(VIDEOS_DIR, filename)
                stat = os.stat(filepath)
                videos.append({
                    "filename": filename,
                    "url": f"/api/videos/stream/{filename}",
                    "size_bytes": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                })
        
        return sorted(videos, key=lambda x: x["created_at"], reverse=True)


# Singleton instance
video_service = VideoService()
