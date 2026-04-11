import cloudinary
import cloudinary.uploader
import logging
import os
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)

class CloudinaryService:
    def __init__(self):
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")

        if all([cloud_name, api_key, api_secret]):
            logger.info(f"Configuring Cloudinary with Cloud Name: '{cloud_name}'")
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True
            )
            self.configured = True
            logger.info("Cloudinary configured successfully")
        else:
            logger.warning(f"Cloudinary missing credentials. CN: {bool(cloud_name)}, AK: {bool(api_key)}, AS: {bool(api_secret)}")
            self.configured = False

    def upload_image(self, image_data: bytes, folder: str = "kartr/images") -> Optional[str]:
        """Uploads image bytes to Cloudinary and returns the URL."""
        if not self.configured:
            return None
        try:
            result = cloudinary.uploader.upload(
                image_data,
                folder=folder,
                resource_type="image"
            )
            return result.get("secure_url")
        except Exception as e:
            logger.error(f"Cloudinary image upload failed: {e}")
            return None

    def upload_video(self, video_path: str, folder: str = "kartr/videos") -> Optional[str]:
        """Uploads a video file to Cloudinary and returns the URL."""
        if not self.configured:
            return None
        try:
            result = cloudinary.uploader.upload(
                video_path,
                folder=folder,
                resource_type="video"
            )
            return result.get("secure_url")
        except Exception as e:
            logger.error(f"Cloudinary video upload failed: {e}")
            return None

cloudinary_service = CloudinaryService()
