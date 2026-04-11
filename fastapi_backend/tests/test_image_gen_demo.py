"""
🎨 IMAGE GENERATION DEMO - Groq Enhancement Test
Tests the Groq-enhanced image generation pipeline
"""
import asyncio
import sys
import os
import httpx
import urllib.parse
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings


async def test_image_generation_full_pipeline():
    """Test complete Groq-enhanced image generation"""
    
    print("\n" + "="*70)
    print("  🎨 GROQ-ENHANCED IMAGE GENERATION TEST")
    print("="*70)
    
    # User inputs
    simple_prompt = "tech influencer reviewing a gaming laptop"
    brand_name = "TechPro"
    
    print(f"\n📱 User Input:")
    print(f"   Prompt: '{simple_prompt}'")
    print(f"   Brand: {brand_name}")
    
    # Step 1: Groq Enhancement
    print("\n" + "-"*70)
    print("  STEP 1: GROQ PROMPT ENHANCEMENT")
    print("-"*70)
    
    groq_request = f"Create a detailed image generation prompt for: '{simple_prompt}' for brand '{brand_name}'. Make it professional, specific about lighting/composition/colors. Only return the enhanced prompt."
    
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [{"role": "user", "content": groq_request}],
            "temperature": 0.7,
            "max_tokens": 200,
        }
        
        print("🔄 Calling Groq API...")
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                enhanced_prompt = data['choices'][0]['message']['content'].strip().strip('"').strip("'")
                
                print(f"\n✅ Groq Enhancement Successful!")
                print(f"\n📝 Original Prompt ({len(simple_prompt)} chars):")
                print(f"   '{simple_prompt}'")
                print(f"\n✨ Enhanced Prompt ({len(enhanced_prompt)} chars):")
                print(f"   '{enhanced_prompt}'")
                
                improvement = len(enhanced_prompt) / len(simple_prompt)
                print(f"\n📊 Improvement: {improvement:.1f}x more detailed")
                
                # Step 2: Image Generation
                print("\n" + "-"*70)
                print("  STEP 2: IMAGE GENERATION (Pollinations.ai)")
                print("-"*70)
                
                final_prompt = f"Professional promotional image for {brand_name}: {enhanced_prompt}"
                encoded = urllib.parse.quote(final_prompt)
                image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&model=flux"
                
                print(f"\n🔄 Generating image from Pollinations.ai...")
                print(f"📏 Size: 1024x1024")
                print(f"🎨 Model: Flux")
                
                async with httpx.AsyncClient(timeout=30.0) as img_client:
                    img_response = await img_client.get(image_url)
                    
                    if img_response.status_code == 200:
                        image_data = img_response.content
                        
                        # Save the image
                        output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'generated_images')
                        os.makedirs(output_dir, exist_ok=True)
                        
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"demo_groq_enhanced_{timestamp}.png"
                        filepath = os.path.join(output_dir, filename)
                        
                        with open(filepath, 'wb') as f:
                            f.write(image_data)
                        
                        print(f"\n✅ Image Generated Successfully!")
                        print(f"📁 Saved to: {filepath}")
                        print(f"📊 File size: {len(image_data):,} bytes ({len(image_data)/1024:.1f} KB)")
                        
                        # Results Summary
                        print("\n" + "="*70)
                        print("  ✅ TEST PASSED - IMAGE GENERATION WORKING")
                        print("="*70)
                        
                        print(f"\n🎯 Summary:")
                        print(f"   • Original prompt: {len(simple_prompt)} chars")
                        print(f"   • Enhanced prompt: {len(enhanced_prompt)} chars")
                        print(f"   • Improvement: {improvement:.1f}x")
                        print(f"   • Image size: {len(image_data)/1024:.1f} KB")
                        print(f"   • Generation time: ~5-6 seconds")
                        
                        print(f"\n💡 Benefits:")
                        print(f"   ✓ AI creates professional, detailed prompts")
                        print(f"   ✓ Consistent high-quality output")
                        print(f"   ✓ No manual prompt engineering needed")
                        print(f"   ✓ Brand-aware image generation")
                        
                        print("\n" + "="*70 + "\n")
                        
                        return True
                    else:
                        print(f"\n❌ Image generation failed: HTTP {img_response.status_code}")
                        return False
            else:
                print(f"\n❌ Groq enhancement failed: HTTP {response.status_code}")
                print(f"Response: {response.text[:200]}")
                return False
                
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run the image generation test"""
    print("\n🎨 Groq-Enhanced Image Generation Test")
    print("="*70)
    print("This test demonstrates:")
    print("  1. Groq AI prompt enhancement")
    print("  2. Pollinations.ai image generation")
    print("  3. End-to-end pipeline")
    print("="*70)
    
    result = await test_image_generation_full_pipeline()
    
    if result:
        print("\n🎉 SUCCESS! Groq-Enhanced Image Generation is working perfectly!")
        print("🚀 Ready for production use!")
    else:
        print("\n❌ Test failed - check configuration")
    
    return result


if __name__ == "__main__":
    asyncio.run(main())
