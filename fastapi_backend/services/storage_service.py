import os
import time
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class StorageService:
    """
    Service for managing local storage, specifically cleaning up 
    large media files generated for demo/MVP purposes.
    """
    
    @staticmethod
    def cleanup_directory(directory_path: str, max_age_hours: int = 1):
        """
        Delete files in a directory that are older than max_age_hours.
        """
        if not os.path.exists(directory_path):
            return
            
        now = time.time()
        cutoff = now - (max_age_hours * 3600)
        
        count = 0
        try:
            for filename in os.listdir(directory_path):
                file_path = os.path.join(directory_path, filename)
                if os.path.isfile(file_path):
                    if os.path.getmtime(file_path) < cutoff:
                        os.remove(file_path)
                        count += 1
            if count > 0:
                logger.info(f"StorageService: Cleaned up {count} files in {directory_path}")
        except Exception as e:
            logger.error(f"StorageService Cleanup Error: {e}")

storage_service = StorageService()
