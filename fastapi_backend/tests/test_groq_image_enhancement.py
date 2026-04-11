"""
Test Groq-Enhanced Image Generation
Demonstrates how Groq creates amazing prompts for image generation
"""
import asyncio
import sys
import os
import httpx

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings


async def test_groq_prompt_enhancement():
    """Test Groq's ability to enhance image generation prompts"""
    print("\n" + "="*70)
    print(" GROQ-ENHANCED IMAGE GENERATION TEST")
    print("="*70)
    
    # Simple user request
    user_prompt = "influencer reviewing a laptop"
    brand_name = "TechPro"
    
    print(f"\n[INPUT] User Request: '{user_prompt}'")
    print(f"[INPUT] Brand: {brand_name}")
    
    # Step 1: Use Groq to enhance the prompt
    print("\n" + "-"*70)
    print("STEP 1: Groq Prompt Enhancement")
    print("-"*70)
    
    groq_prompt = f"Create a detailed image generation prompt for: '{user_prompt}' for brand '{brand_name}'. Make it professional,specific about lighting/composition/colors. Only return the enhanced prompt."

    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [{"role": "user", "content": groq_prompt}],
            "temperature": 0.8,
            "max_tokens": 300,
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                enhanced_prompt = data['choices'][0]['message']['content'].strip()
                
                print(f"[SUCCESS] Groq Enhanced Prompt:")
                print(f"\n{enhanced_prompt}\n")
                
                # Step 2: Use enhanced prompt with Pollinations.ai
                print("-"*70)
                print("STEP 2: Generate Image with Enhanced Prompt")
                print("-"*70)
                
                import urllib.parse
                final_prompt = f"Professional promotional image for {brand_name}: {enhanced_prompt}"
                encoded = urllib.parse.quote(final_prompt)
                image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&model=flux"
                
                print(f"[INFO] Generating image from Pollinations.ai...")
                
                async with httpx.AsyncClient(timeout=30.0) as img_client:
                    img_response = await img_client.get(image_url)
                    
                    if img_response.status_code == 200:
                        image_data = img_response.content
                        
                        # Save the image
                        import os
                        from datetime import datetime
                        
                        output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'generated_images')
                        os.makedirs(output_dir, exist_ok=True)
                        
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"groq_enhanced_{timestamp}.png"
                        filepath = os.path.join(output_dir, filename)
                        
                        with open(filepath, 'wb') as f:
                            f.write(image_data)
                        
                        print(f"[SUCCESS] Image generated and saved!")
                        print(f"[FILE] {filepath}")
                        print(f"[SIZE] {len(image_data):,} bytes")
                        
                        print("\n" + "="*70)
                        print(" COMPARISON")
                        print("="*70)
                        print(f"\nOriginal Prompt:")
                        print(f"  '{user_prompt}'")
                        print(f"\nGroq Enhanced Prompt:")
                        print(f"  {enhanced_prompt[:150]}...")
                        print(f"\n[RESULT] Groq made the prompt {len(enhanced_prompt)/len(user_prompt):.1f}x more detailed!")
                        
                        print("\n" + "="*70)
                        print(" TEST PASSED - GROQ-ENHANCED IMAGE GENERATION WORKING!")
                        print("="*70)
                        
                        return True
                    else:
                        print(f"[FAIL] Image generation failed: {img_response.status_code}")
                        return False
            else:
                print(f"[FAIL] Groq enhancement failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    result = await test_groq_prompt_enhancement()
    
    if result:
        print("\nGroq-enhanced image generation is READY TO USE! 🎨")
    else:
        print("\nTest failed - check configuration")


if __name__ == "__main__":
    asyncio.run(main())
