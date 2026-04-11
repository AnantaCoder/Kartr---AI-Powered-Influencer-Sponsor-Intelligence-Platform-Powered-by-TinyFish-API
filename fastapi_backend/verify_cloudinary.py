import os
import sys
import base64
from dotenv import load_dotenv
import cloudinary.uploader

# Load .env explicitly for standalone test
load_dotenv()

def test_cloudinary_integration():
    print("--- Testing Cloudinary Integration (Direct Params) ---")
    
    try:
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")
        
        print(f"DEBUG: CN='{cloud_name}', AK='{api_key}'")

        if not all([cloud_name, api_key, api_secret]):
            print("❌ Missing credentials in .env")
            return

        # Test small image upload
        dummy_pixel_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
        dummy_pixel = base64.b64decode(dummy_pixel_b64)
        
        print("Uploading dummy image...")
        # Passing params directly to bypass config issues
        result = cloudinary.uploader.upload(
            dummy_pixel, 
            folder="kartr/test",
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )
        
        url = result.get("secure_url")
        if url:
            print(f"✅ Image upload successful: {url}")
        else:
            print(f"❌ Image upload failed: {result}")
            
    except Exception as e:
        print(f"❌ Error during image test: {e}")

if __name__ == "__main__":
    test_cloudinary_integration()
