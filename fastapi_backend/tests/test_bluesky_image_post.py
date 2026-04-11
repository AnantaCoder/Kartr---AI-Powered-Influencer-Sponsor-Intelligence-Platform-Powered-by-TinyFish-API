"""
Manual Test for Bluesky Posting with Image and AI Caption
"""
import asyncio
import os
import sys
import httpx
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

from services.bluesky_service import bluesky_service
from config import settings

async def generate_caption(prompt, brand):
    print("🔄 Generating AI caption via Groq...")
    groq_prompt = f"Create a catchy, professional social media caption for Bluesky. \nTopic: {prompt} \nBrand: {brand} \nInclude a few relevant hashtags. Keep it concise."
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": groq_prompt}],
        "temperature": 0.7,
        "max_tokens": 150
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content'].strip().strip('"')
        else:
            print(f"⚠️ Groq failed to generate caption ({response.status_code}). Using fallback.")
            return f"Check out this amazing review of the latest laptop from {brand}! 🚀 #Tech #Review"

async def main():
    print("\n" + "="*70)
    print("  🦋 BLUESKY IMAGE POSTING TEST")
    print("="*70)
    
    # 1. Check credentials
    handle = settings.BLUESKY_HANDLE
    password = settings.BLUESKY_PASSWORD
    
    if not handle or not password:
        print("❌ Bluesky credentials not found in .env")
        return
    
    # 2. Find the image
    image_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "generated_images", "demo_20260125_104633.png")
    if not os.path.exists(image_path):
        print(f"❌ Image not found at {image_path}")
        return
    
    print(f"✅ Image found: {os.path.basename(image_path)}")
    
    # 3. Generate Caption
    prompt = "tech influencer reviewing a gaming laptop"
    brand = "TechPro"
    caption = await generate_caption(prompt, brand)
    
    print(f"\n📝 Generated Caption:")
    print(f"   '{caption}'")
    
    # 4. Perform post
    print("\n🔄 Sending image post to Bluesky...")
    
    try:
        result = bluesky_service.post_image(
            identifier=handle,
            password=password,
            text=caption,
            image_path=image_path,
            alt_text="Tech influencer reviewing a gaming laptop"
        )
        
        if result.get("success"):
            print(f"\n✅ SUCCESS! Image post created successfully.")
            print(f"   🔗 Post URI: {result.get('post_uri')}")
            print(f"\n✨ View your post at: https://bsky.app/profile/{handle}")
        else:
            print(f"\n❌ FAILED: {result.get('message')}")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
