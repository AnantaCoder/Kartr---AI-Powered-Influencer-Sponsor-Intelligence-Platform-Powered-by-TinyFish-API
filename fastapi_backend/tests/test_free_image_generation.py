"""
Test script for FREE Image Generation Services.
Uses services that don't require API keys or have generous free tiers.
"""
import os
import sys
import asyncio
import httpx
import urllib.parse

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


async def test_pollinations_ai():
    """
    Test image generation using Pollinations.ai
    - Completely FREE
    - No API key required
    - Uses various open-source models (Flux, etc.)
    """
    print("\n" + "="*60)
    print("Testing Pollinations.ai (FREE - No API Key)")
    print("="*60)
    
    prompt = "a cute cat in the himalayas with a red scarf"
    encoded_prompt = urllib.parse.quote(prompt)
    
    # Pollinations.ai direct image URL
    # You can add parameters like width, height, seed, model
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=512&height=512&nologo=true"
    
    print(f"[INFO] Prompt: {prompt}")
    print(f"[INFO] Fetching image from Pollinations.ai...")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.get(image_url, follow_redirects=True)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type:
                    output_file = os.path.join(OUTPUT_DIR, "generated_pollinations.png")
                    with open(output_file, "wb") as f:
                        f.write(response.content)
                    print(f"[SUCCESS] Image saved to: {output_file}")
                    print(f"[INFO] Image size: {len(response.content)} bytes")
                    return True
                else:
                    print(f"[ERROR] Unexpected content type: {content_type}")
                    print(f"[DEBUG] Response: {response.text[:500]}")
            else:
                print(f"[ERROR] HTTP {response.status_code}")
                print(f"[DEBUG] Response: {response.text[:500]}")
                
    except httpx.TimeoutException:
        print("[ERROR] Request timed out. Image generation can take 30-60 seconds.")
    except Exception as e:
        print(f"[ERROR] Failed: {e}")
    
    return False


async def test_huggingface_inference():
    """
    Test image generation using Hugging Face Inference API.
    - Free tier available (rate limited)
    - Requires HF_TOKEN for higher limits
    """
    print("\n" + "="*60)
    print("Testing Hugging Face Inference API")
    print("="*60)
    
    # Check for HuggingFace token (optional but recommended)
    hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_TOKEN")
    
    if hf_token:
        print(f"[INFO] Using HuggingFace token: {hf_token[:8]}...")
    else:
        print("[INFO] No HF_TOKEN found. Using anonymous access (rate limited).")
    
    # Use a popular free model
    model_id = "black-forest-labs/FLUX.1-schnell"  # Fast model
    api_url = f"https://api-inference.huggingface.co/models/{model_id}"
    
    prompt = "A futuristic city with flying cars, cyberpunk style, detailed"
    
    headers = {"Content-Type": "application/json"}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"
    
    print(f"[INFO] Model: {model_id}")
    print(f"[INFO] Prompt: {prompt}")
    print("[INFO] Sending request (this may take 30-60 seconds)...")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                api_url,
                headers=headers,
                json={"inputs": prompt}
            )
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type:
                    output_file = os.path.join(OUTPUT_DIR, "generated_huggingface.png")
                    with open(output_file, "wb") as f:
                        f.write(response.content)
                    print(f"[SUCCESS] Image saved to: {output_file}")
                    return True
                else:
                    print(f"[INFO] Response: {response.text[:300]}")
            elif response.status_code == 503:
                print("[INFO] Model is loading. This is normal for cold starts.")
                print("[INFO] Please wait and try again in 20-30 seconds.")
            else:
                print(f"[ERROR] HTTP {response.status_code}: {response.text[:300]}")
                
    except httpx.TimeoutException:
        print("[ERROR] Request timed out.")
    except Exception as e:
        print(f"[ERROR] Failed: {e}")
    
    return False


async def main():
    print("\n" + "#"*60)
    print("# FREE Image Generation Test Suite")
    print("#"*60)
    print(f"\nOutput Directory: {OUTPUT_DIR}")
    
    results = {}
    
    # Test 1: Pollinations.ai (always works, no key needed)
    results['pollinations'] = await test_pollinations_ai()
    
    # Test 2: HuggingFace (may need token for reliability)
    results['huggingface'] = await test_huggingface_inference()
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    for service, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        print(f"  {service}: {status}")
    
    if any(results.values()):
        print("\n[DONE] At least one service worked!")
    else:
        print("\n[INFO] All services failed. Check network or try again later.")


if __name__ == "__main__":
    asyncio.run(main())
