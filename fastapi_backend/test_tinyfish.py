import asyncio
import os
import sys

# Add current directory to path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(current_dir, ".env"))

import logging
logging.basicConfig(level=logging.INFO)

async def test_tinyfish_integration():
    try:
        from services.tinyfish_service import TinyFishService
        from services.campaign_service import CampaignService
        
        print("=== Starting Tinyfish API Integration Test ===")
        
        api_key = os.getenv("TINYFISH_API_KEY")
        handle = os.getenv("BLUESKY_HANDLE")
        
        print(f"Loaded TINYFISH_API_KEY: {'Yes' if api_key else 'No'}")
        print(f"Loaded BLUESKY_HANDLE: {handle}")
        
        target = handle if handle else 'test.bsky.social'
        link = f"http://localhost:3000/join/camp_test?bsky={target}"
        
        print(f"\n1. Testing direct TinyFishService.invite_bluesky_influencer...")
        res = await TinyFishService.invite_bluesky_influencer(
            target_handle=target, 
            invite_link=link,
            custom_message="Hello! This is an automated test from the Kartr system."
        )
        print(f"Direct API call result: {'SUCCESS' if res else 'FAILED or TIMEOUT'}")
        
        with open(os.path.join(current_dir, "..", "tinyfish_test_report.txt"), "w") as f:
            f.write("=== TinyFish Integration Test Report ===\n")
            f.write(f"TINYFISH_API_KEY Loaded: {'Yes' if api_key else 'No'}\n")
            f.write(f"Bluesky Target Handle: {target}\n")
            f.write(f"Direct API Result: {'SUCCESS' if res else 'FAILED'}\n\n")
            f.write("=== Future Steps ===\n")
            f.write("1. Handle TinyFish API rate limiting appropriately if scaling invites.\n")
            f.write("2. Configure a webhook in TinyFish (if supported) to get an asynchronous callback on DM success, rather than waiting for completion or assuming success on run start.\n")
            f.write("3. Map the pending invite natively on the frontend UI to display as a notification badge for the user.\n")
            f.write("4. Expand the Campaign Influencer Table schema to record TinyFish Run IDs for future audit logs.\n")
            
        print("\nTest completed and report saved to 'tinyfish_test_report.txt'.")
        
    except Exception as e:
        print(f"Test failed due to an exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_tinyfish_integration())
