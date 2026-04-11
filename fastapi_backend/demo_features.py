"""
🎨 WORKING IMAGE & VIDEO SCRIPT DEMO
Run from: kartr/fastapi_backend/
"""
import asyncio
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load .env file explicitly
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

from config import settings
import httpx
import urllib.parse
import json


async def demo_image_generation():
    """Demo: Groq-Enhanced Image Generation"""
    print("\n" + "="*70)
    print("  🎨 IMAGE GENERATION DEMO")
    print("="*70)
    
    # Check config
    if not settings.GROQ_API_KEY:
        print("❌ GROQ_API_KEY not found in .env")
        return False
    
    print(f"✅ Groq API Key loaded: {settings.GROQ_API_KEY[:15]}...")
    
    # User input
    simple_prompt = "tech influencer reviewing a gaming laptop"
    brand = "TechPro"
    
    print(f"\n📱 Input:")
    print(f"   Prompt: '{simple_prompt}'")
    print(f"   Brand: {brand}")
    
    # Step 1: Groq enhances prompt
    print("\n--- STEP 1: Groq Prompt Enhancement ---")
    
    groq_prompt = f"Create a detailed image generation prompt for: '{simple_prompt}' for brand '{brand}'. Be professional and specific about lighting, composition, colors. Return only the enhanced prompt."
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": groq_prompt}],
        "temperature": 0.7,
        "max_tokens": 200
    }
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            if response.status_code != 200:
                print(f"❌ Groq failed: {response.status_code}")
                print(response.text[:200])
                return False
            
            data = response.json()
            enhanced = data['choices'][0]['message']['content'].strip().strip('"').strip("'")
            
            print(f"✅ Enhanced prompt ({len(enhanced)} chars):")
            print(f"   {enhanced}")
            
            improvement = len(enhanced) / len(simple_prompt)
            print(f"\n   📊 {improvement:.1f}x more detailed!")
            
            # Step 2: Generate image
            print("\n--- STEP 2: Generate Image ---")
            
            final_prompt = f"Professional promotional image for {brand}: {enhanced}"
            encoded = urllib.parse.quote(final_prompt)
            image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true"
            
            print("🎨 Generating image...")
            
            async with httpx.AsyncClient(timeout=30.0) as img_client:
                img_response = await img_client.get(image_url)
                
                if img_response.status_code != 200:
                    print(f"❌ Image generation failed: {img_response.status_code}")
                    return False
                
                image_data = img_response.content
                
                # Save image
                output_dir = os.path.join(os.path.dirname(__file__), 'data', 'generated_images')
                os.makedirs(output_dir, exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"demo_{timestamp}.png"
                filepath = os.path.join(output_dir, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(image_data)
                
                print(f"✅ Image saved!")
                print(f"   📁 {filepath}")
                print(f"   📊 {len(image_data)/1024:.1f} KB")
                
                return True
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def demo_video_script():
    """Demo: Video Script Generation"""
    print("\n" + "="*70)
    print("  🎬 VIDEO SCRIPT GENERATION DEMO")
    print("="*70)
    
    from routers.video_script import VideoScriptRequest, generate_video_script
    
    class MockUser:
        def get(self, key, default=None):
            return "demo_user" if key == "uid" else default
    
    # Create request
    request = VideoScriptRequest(
        topic="Gaming Laptop Review for Streamers",
        brand_name="TechPro",
        duration_seconds=60,
        target_audience="Gamers and streamers",
        tone="enthusiastic and technical",
        include_sponsor_mention=True
    )
    
    print(f"\n📋 Request:")
    print(f"   Topic: {request.topic}")
    print(f"   Brand: {request.brand_name}")
    print(f"   Duration: {request.duration_seconds}s")
    
    print("\n🔄 Generating script with Groq...")
    
    try:
        mock_user = MockUser()
        response = await generate_video_script(request, mock_user)
        
        if not response.success:
            print(f"❌ Failed: {response.error}")
            return False
        
        print(f"\n✅ Script generated!")
        print(f"\n🎬 Title: {response.title}")
        print(f"📝 Description: {response.description}")
        print(f"⏱️  Duration: {response.total_duration}s")
        print(f"🎥 Scenes: {len(response.scenes)}")
        
        # Show scenes
        print("\n--- Scenes ---")
        for scene in response.scenes[:3]:  # Show first 3
            print(f"\nScene {scene.scene_number} ({scene.duration_seconds}s):")
            print(f"  VISUAL: {scene.visual_description[:80]}...")
            print(f"  DIALOGUE: {scene.dialogue[:80]}...")
            if scene.camera_notes:
                print(f"  CAMERA: {scene.camera_notes[:60]}...")
        
        if len(response.scenes) > 3:
            print(f"\n  ... and {len(response.scenes) - 3} more scenes")
        
        # Save script
        output_dir = os.path.join(os.path.dirname(__file__), 'data', 'video_scripts')
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"demo_script_{timestamp}.json"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(response.dict(), f, indent=2)
        
        print(f"\n✅ Script saved!")
        print(f"   📁 {filepath}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run both demos"""
    print("\n🎬" * 35)
    print("\n   KARTR AI FEATURES - LIVE DEMO")
    print("   Image Generation + Video Scripts")
    print("\n🎬" * 35)
    
    results = {}
    
    # Demo 1: Image Generation
    results['images'] = await demo_image_generation()
    await asyncio.sleep(2)
    
    # Demo 2: Video Scripts
    results['scripts'] = await demo_video_script()
    
    # Summary
    print("\n" + "="*70)
    print("  DEMO RESULTS")
    print("="*70)
    
    for feature, status in results.items():
        icon = "✅" if status else "❌"
        print(f"{icon} {feature.upper()}")
    
    if all(results.values()):
        print("\n🎉 ALL FEATURES WORKING!")
        print("🚀 Check the data/ folder for generated files")
    
    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    print("\n🚀 Starting Kartr AI Demo...")
    asyncio.run(main())
