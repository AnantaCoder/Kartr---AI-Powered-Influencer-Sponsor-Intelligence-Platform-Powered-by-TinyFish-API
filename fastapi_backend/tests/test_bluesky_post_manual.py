"""
Manual Test for Bluesky Posting
Using credentials from .env
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

from services.bluesky_service import bluesky_service
from config import settings

async def main():
    print("\n" + "="*70)
    print("  🦋 BLUESKY POSTING TEST")
    print("="*70)
    
    # 1. Check credentials
    handle = settings.BLUESKY_HANDLE
    password = settings.BLUESKY_PASSWORD
    
    if not handle or not password:
        print("❌ Bluesky credentials not found in .env")
        print(f"   Handle: {handle}")
        print(f"   Password: {'Set' if password else 'Not Set'}")
        return
    
    print(f"✅ Credentials loaded for: {handle}")
    
    # 2. Define post content
    text = "🚀 Test post from Kartr AI Platform! Integrating Bluesky with our automated influencer tools. #AI #Kartr #Bluesky"
    
    print(f"\n📝 Post Content:")
    print(f"   '{text}'")
    
    # 3. Perform post
    print("\n🔄 Sending post to Bluesky...")
    
    try:
        # bluesky_service.post_text is a synchronous method in the service implementation
        result = bluesky_service.post_text(
            identifier=handle,
            password=password,
            text=text
        )
        
        if result.get("success"):
            print(f"\n✅ SUCCESS! Post created successfully.")
            print(f"   🔗 Post URI: {result.get('post_uri')}")
            print(f"   🆔 CID: {result.get('cid')}")
            print(f"\n✨ View your post at: https://bsky.app/profile/{handle}")
        else:
            print(f"\n❌ FAILED: {result.get('message')}")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
