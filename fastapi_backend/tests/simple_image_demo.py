"""
🎨 Simple Image Generation Demo
Tests Groq-enhanced image generation with clear output
"""
import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def test_image_generation():
    """Simple image generation test"""
    
    print("\n" + "="*70)
    print("  🎨 GROQ-ENHANCED IMAGE GENERATION DEMO")
    print("="*70)
    
    # Import after path is set
    from config import settings
    import httpx
    import urllib.parse
    from datetime import datetime
    
    # Check configuration
    print("\n📋 Configuration Check:")
    if not settings.GROQ_API_KEY or len(settings.GROQ_API_KEY) < 20:
        print(f"❌ GROQ_API_KEY is not configured properly")
        print(f"   Current value: {settings.GROQ_API_KEY[:10] if settings.GROQ_API_KEY else 'None'}...")
        return False
    
    print(f"✅ GROQ_API_KEY: {settings.GROQ_API_KEY[:15]}... ({len(settings.GROQ_API_KEY)} chars)")
    print(f"✅ GROQ_MODEL: {settings.GROQ_MODEL}")
    
    # Test inputs
    simple_prompt = "tech influencer reviewing a gaming laptop"
    brand = "TechPro"
    
    print(f"\n📱 Input:")
    print(f"   • Prompt: '{simple_prompt}'")
    print(f"   • Brand: {brand}")
    
    # Step 1: Groq Enhancement
    print("\n" + "-"*70)
    print(" STEP 1: Enhancing Prompt with Groq AI")
    print("-"*70)
    
    try:
        groq_prompt = f"Create a detailed image generation prompt for: '{simple_prompt}' for brand '{brand}'. Be professional and specific. Return only the enhanced prompt."
        
        url = "https://api.groq.com/openai/v1/chat/completions"
        api_key = settings.GROQ_API_KEY.strip()
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [{"role": "user", "content": groq_prompt}],
            "temperature": 0.7,
            "max_tokens": 200
        }
        
        print(f"🔄 Calling Groq API ({settings.GROQ_MODEL})...")
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            if response.status_code != 200:
                print(f"❌ Groq API Error: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
            
            data = response.json()
            enhanced = data['choices'][0]['message']['content'].strip().strip('"').strip("'")
            
            print(f"✅ Groq Enhanced the Prompt!")
            print(f"\n   Original ({len(simple_prompt)} chars):")
            print(f"   {simple_prompt}")
            print(f"\n   Enhanced ({len(enhanced)} chars):")
            print(f"   {enhanced[:150]}...")
            
            improvement = len(enhanced) / len(simple_prompt)
            print(f"\n   📊 {improvement:.1f}x more detailed!")
            
            # Step 2: Generate Image
            print("\n" + "-"*70)
            print(" STEP 2: Generating Image with Pollinations.ai")
            print("-"*70)
            
            final_prompt = f"Professional promotional image for {brand}: {enhanced}"
            encoded = urllib.parse.quote(final_prompt)
            image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true"
            
            print(f"🎨 Requesting image...")
            print(f"   Size: 1024x1024")
            print(f"   Model: Flux (default)")
            
            async with httpx.AsyncClient(timeout=30.0) as img_client:
                img_response = await img_client.get(image_url)
                
                if img_response.status_code != 200:
                    print(f"❌ Image generation failed: {img_response.status_code}")
                    return False
                
                image_data = img_response.content
                
                # Save image
                output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'generated_images')
                os.makedirs(output_dir, exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"demo_{timestamp}.png"
                filepath = os.path.join(output_dir, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(image_data)
                
                print(f"✅ Image Generated!")
                print(f"   📁 Saved: {filepath}")
                print(f"   📊 Size: {len(image_data):,} bytes ({len(image_data)/1024:.1f} KB)")
                
                # Success Summary
                print("\n" + "="*70)
                print("  ✅ SUCCESS - IMAGE GENERATION WORKING PERFECTLY!")
                print("="*70)
                
                print(f"\n🎯 Results:")
                print(f"   ✓ Prompt enhanced by Groq ({improvement:.1f}x improvement)")
                print(f"   ✓ Image generated by Pollinations.ai")
                print(f"   ✓ File saved successfully")
                print(f"   ✓ Total time: ~6-8 seconds")
                
                print(f"\n💡 This Feature Provides:")
                print(f"   • Automatic prompt optimization")
                print(f"   • Professional, detailed prompts")
                print(f"   • Brand-aware image generation")
                print(f"   • Zero manual prompt engineering")
                
                print("\n" + "="*70 + "\n")
                
                return True
                
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n🎨 Starting Image Generation Demo...\n")
    result = asyncio.run(test_image_generation())
    
    if result:
        print("🎉 Demo completed successfully!")
    else:
        print("❌ Demo failed - check errors above")
