import os
import logging
import time
import requests
import asyncio
from atproto import Client, models
from fastapi import HTTPException
from PIL import Image
import io

logger = logging.getLogger(__name__)

class BlueskyService:
    """
    Stateless service for Bluesky interactions.
    Requires credentials for every operation to support multiple users.
    """
    
    MAX_IMAGE_SIZE = 976.56 * 1024  # Bluesky max: ~976.56KB
    VIDEO_SERVICE_URL = "https://video.bsky.app"
    
    def _compress_image(self, image_path: str, max_size: int = int(MAX_IMAGE_SIZE)) -> bytes:
        """Compress image to fit Bluesky's size limit (~1MB)"""
        try:
            img = Image.open(image_path)
            
            if img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img
            
            quality = 85
            while quality > 10:
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=quality, optimize=True)
                img_bytes = buffer.getvalue()
                
                if len(img_bytes) <= max_size:
                    return img_bytes
                
                quality -= 5
            
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=70, optimize=True)
            return buffer.getvalue()
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image compression failed: {str(e)}")
    
    def _get_client(self, identifier: str, password: str) -> Client:
        """Helper to get an authenticated client."""
        client = Client()
        try:
            client.login(identifier, password)
            return client
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Bluesky login failed: {str(e)}")

    def verify_credentials(self, identifier: str, password: str) -> bool:
        """Verify if credentials are valid."""
        try:
            self._get_client(identifier, password)
            return True
        except HTTPException:
            return False

    def post_text(self, identifier: str, password: str, text: str) -> dict:
        """Post text only"""
        client = self._get_client(identifier, password)
        try:
            post = client.send_post(text=text)
            return {
                "success": True, 
                "post_uri": post.uri, 
                "cid": post.cid,
                "message": "Text post created successfully"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to post text: {str(e)}")

    def post_image(self, identifier: str, password: str, text: str, image_path: str, alt_text: str = "") -> dict:
        """Post text with image"""
        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail=f"Image file not found: {image_path}")
            
        client = self._get_client(identifier, password)
        try:
            img_data = self._compress_image(image_path)
            
            post = client.send_image(text=text, image=img_data, image_alt=alt_text)
            return {
                "success": True,
                "post_uri": post.uri,
                "cid": post.cid,
                "message": "Image post created successfully"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to post image: {str(e)}")

    async def _upload_video_to_service(self, client: Client, video_path: str) -> dict:
        """
        Upload video to Bluesky's video processing service.
        This is the proper way to upload videos - they require transcoding.
        """
        import httpx
        
        did = client.me.did
        file_size = os.path.getsize(video_path)
        
        # Step 1: Get service auth token for video upload
        logger.info("Getting service auth token...")
        try:
            # We need to get the service auth for the VIDEO service, but scoped correctly.
            # According to the error: "should be the user's PDS DID".
            # The AtProto client handles this somewhat automatically if we ask for the right thing.
            # Based on docs/examples, for video upload we usually need the video service DID as 'aud',
            # BUT some PDSs require their own DID as 'aud' for the proxying. 
            
            # Let's try to get the PDS's DID first.
            # client.me.did is the user's DID.
            # We can find the PDS endpoint from the session or resolve it.
            
            # Using 'did:web:video.bsky.app' directly caused the error.
            # The error suggests using "did:web:discina.us-west.host.bsky.network" (YOUR PDS).
            
            # The correct way is usually to ask the client to get a token for the *service* we are using.
            # If we are uploading directly to video.bsky.app, we need a token for IT.
            # However, the error comes FROM video.bsky.app saying the token aud is wrong.
            
            # UPDATE: The service auth token scope/lxm must be `com.atproto.repo.uploadBlob`
            # even though we're using the video upload endpoint. The video service validates
            # the token against this scope.
            
            pds_info = client.com.atproto.server.describe_server()
            pds_did = pds_info.did
            
            logger.info(f"Target PDS DID for auth: {pds_did}")
            
            service_auth = client.com.atproto.server.get_service_auth(
                models.ComAtprotoServerGetServiceAuth.Params(
                    aud=pds_did,
                    lxm="com.atproto.repo.uploadBlob",  # CORRECT scope for video uploads
                    exp=int(time.time()) + 30 * 60  # 30 minute expiry
                )
            )
        except Exception as e:
            raise Exception(f"Failed to get service auth token: {str(e)}")
        
        # Step 2: Upload video to video service with retries
        logger.info(f"Uploading {file_size} bytes from {video_path} to video service...")
        
        upload_url = f"{self.VIDEO_SERVICE_URL}/xrpc/app.bsky.video.uploadVideo"
        headers = {
            "Authorization": f"Bearer {service_auth.token}",
            "Content-Type": "video/mp4",
            "Content-Length": str(file_size),
            "User-Agent": "Kartr/1.0 (FastAPI Backend; Windows)"
        }
        params = {
            "did": did,
            "name": f"video_{int(time.time())}.mp4"
        }
        
        # Use httpx for robust connection handling
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        timeout = httpx.Timeout(300.0, connect=60.0)  # 5 min total, 60s connect
        
        async with httpx.AsyncClient(limits=limits, timeout=timeout) as http_client:
            try:
                # Read file content into memory for async upload
                with open(video_path, 'rb') as f:
                    video_bytes = f.read()
                    
                response = await http_client.post(
                    upload_url, 
                    headers=headers, 
                    params=params, 
                    content=video_bytes
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"Video upload status: {response.status_code} - {error_text}")
                    
                    # Handle "already_exists" error (success case)
                    try:
                        error_json = response.json()
                        if error_json.get("error") == "already_exists" and error_json.get("jobId"):
                            logger.info(f"Video already processed. Using existing Job ID: {error_json.get('jobId')}")
                            job_status = error_json
                        else:
                            # Check for unconfirmed email error
                            if "unconfirmed_email" in error_text:
                                raise Exception("UNCONFIRMED_EMAIL: Please verify your email in Bluesky settings before uploading videos.")
                            
                            raise Exception(f"Video upload failed: {error_text}")
                    except ValueError:
                         # JSON parsing failed, treat as string error
                        if "unconfirmed_email" in error_text:
                            raise Exception("UNCONFIRMED_EMAIL: Please verify your email in Bluesky settings before uploading videos.")
                        raise Exception(f"Video upload failed: {error_text}")
                        
                else:
                    job_status = response.json()
                    logger.info(f"Video upload started, job ID: {job_status.get('jobId')}")
            except Exception as e:
                logger.error(f"Video upload failed: {str(e)}")
                raise
        
        # Step 3: Poll for job completion
        job_id = job_status.get("jobId")
        if not job_id:
            if job_status.get("blob"):
                return job_status
            raise Exception("No job ID or blob in response")
        
        status_url = f"{self.VIDEO_SERVICE_URL}/xrpc/app.bsky.video.getJobStatus"
        max_attempts = 60
        
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            for attempt in range(max_attempts):
                await asyncio.sleep(5)
                
                try:
                    status_response = await http_client.get(
                        status_url,
                        headers={"Authorization": f"Bearer {service_auth.token}"},
                        params={"jobId": job_id}
                    )
                    
                    if status_response.status_code != 200:
                        logger.warning(f"Status check failed: {status_response.text}")
                        continue
                    
                    status = status_response.json().get("jobStatus", {})
                    state = status.get("state")
                    logger.info(f"Video processing status: {state} (attempt {attempt + 1})")
                    
                    if state == "JOB_STATE_COMPLETED":
                        blob = status.get("blob")
                        if blob:
                            logger.info("Video processing completed!")
                            return {"blob": blob}
                        raise Exception("Job completed but no blob returned")
                    
                    elif state == "JOB_STATE_FAILED":
                        error = status.get("error", "Unknown error")
                        raise Exception(f"Video processing failed: {error}")
                        
                except Exception as e:
                    logger.warning(f"Checking status failed (network error): {str(e)}")
                    continue
        
        raise Exception("Video processing timed out after 5 minutes")

    async def post_video(self, identifier: str, password: str, text: str, video_path: str, alt_text: str = "Video") -> dict:
        """Post text with video using Bluesky's video processing service with manual flow for robust handling"""
        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail=f"Video file not found: {video_path}")
        
        file_size = os.path.getsize(video_path)
        logger.info(f"Video file size: {file_size / (1024*1024):.2f} MB at {video_path}")
        
        # Bluesky limits
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Video exceeds 50MB limit")
            
        client = self._get_client(identifier, password)
        
        try:
            logger.info("Uploading video to processing service...")
            # Upload to video service and wait for processing
            video_result = await self._upload_video_to_service(client, video_path)
            
            # Create post with video embed
            blob_data = video_result.get("blob")
            if not blob_data:
                raise Exception("No blob data returned from video service")
            
            logger.info("Video processing complete. Waiting 10s for CDN propagation...")
            await asyncio.sleep(10)
            
            # Direct blob usage - passed as dict
            # The atproto SDK will validate this against the schema
            
            # Create video embed
            # We skip aspect ratio to allow auto-detection/default to prevent player errors
            embed = models.AppBskyEmbedVideo.Main(
                video=blob_data,
                alt=alt_text
            )
            
            logger.info("Sending post with video embed...")
            
            # Send post (run in thread to not block)
            loop = asyncio.get_running_loop()
            post = await loop.run_in_executor(None, lambda: client.send_post(text=text, embed=embed))
            
            logger.info(f"Video posted successfully: {post.uri}")
            return {
                "success": True,
                "post_uri": post.uri,
                "cid": post.cid,
                "message": "Video post created successfully"
            }

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to post video: {error_msg}")
            
            # Check for unconfirmed email error in the exception message
            if "unconfirmed_email" in error_msg.lower() or "verify your email" in error_msg.lower():
                 raise HTTPException(status_code=400, detail="UNCONFIRMED_EMAIL: Please verify your email in Bluesky settings before uploading videos.")
            
            raise HTTPException(status_code=500, detail=f"Failed to post video: {error_msg}")

        except HTTPException:
            raise
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to post video: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Failed to post video: {error_msg}")

bluesky_service = BlueskyService()
