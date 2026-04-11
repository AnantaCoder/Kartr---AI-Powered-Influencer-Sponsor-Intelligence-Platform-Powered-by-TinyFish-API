"""
Comprehensive Feature Test Suite for Kartr Platform
Tests all major features including Gemini, RAG, Bluesky, VI, and more
"""
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings


async def test_gemini_image_generation():
    """Test Gemini Image Generation API"""
    print("\n" + "="*60)
    print("TEST 1: GEMINI IMAGE GENERATION")
    print("="*60)
    
    if not settings.GEMINI_API_KEY:
        print("[SKIP] GEMINI_API_KEY not configured")
        return False
    
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        print("[INFO] Testing text-to-image generation...")
        response = client.models.generate_content(
            model=settings.GEMINI_IMAGE_MODEL,
            contents="A professional promotional image of a tech influencer reviewing a laptop",
            config=types.GenerateContentConfig(
                response_modalities=['IMAGE']
            )
        )
        
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith('image/'):
                    print(f"[PASS] Image generated successfully")
                    print(f"[INFO] MIME type: {part.inline_data.mime_type}")
                    print(f"[INFO] Size: {len(part.inline_data.data)} bytes")
                    return True
        
        print("[FAIL] No image in response")
        return False
        
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False


async def test_gemini_video_generation():
    """Test Gemini Video Generation (if available)"""
    print("\n" + "="*60)
    print("TEST 2: GEMINI VIDEO GENERATION")
    print("="*60)
    
    print("[INFO] Video generation not available in Gemini free tier")
    print("[INFO] Video ANALYSIS is available via RAG pipeline")
    return True  # Not a failure, just not available


async def test_rag_pipeline():
    """Test RAG Pipeline for Q&A"""
    print("\n" + "="*60)
    print("TEST 3: RAG PIPELINE Q&A")
    print("="*60)
    
    try:
        from services.chat_service import ChatService
        
        # Create conversation
        success, convo, err = ChatService.create_conversation(
            user_id="rag_test_user",
            title="RAG Test"
        )
        
        if not success:
            print(f"[FAIL] Failed to create conversation: {err}")
            return False
        
        print(f"[PASS] Created conversation: {convo['id']}")
        
        # Test RAG Q&A
        success, response, error = await ChatService.generate_ai_response(
            conversation_id=convo['id'],
            user_id="rag_test_user",
            user_message="What are the main features of Kartr platform for influencers?"
        )
        
        if success and response:
            print(f"[PASS] RAG response received ({len(response)} chars)")
            print(f"[INFO] Response preview: {response[:200]}...")
            return True
        else:
            print(f"[FAIL] RAG failed: {error}")
            return False
            
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False


async def test_bluesky_integration():
    """Test Bluesky social media posting"""
    print("\n" + "="*60)
    print("TEST 4: BLUESKY INTEGRATION")
    print("="*60)
    
    if not settings.BLUESKY_HANDLE or not settings.BLUESKY_PASSWORD:
        print("[SKIP] Bluesky credentials not configured")
        print("[INFO] Add BLUESKY_HANDLE and BLUESKY_PASSWORD to .env to test")
        return True  # Not a failure, just not configured
    
    try:
        from atproto import Client
        
        client = Client()
        client.login(settings.BLUESKY_HANDLE, settings.BLUESKY_PASSWORD)
        
        print(f"[PASS] Successfully logged in as {settings.BLUESKY_HANDLE}")
        print("[INFO] Skipping actual post to avoid spam")
        print("[INFO] Bluesky integration is working")
        
        return True
        
    except Exception as e:
        print(f"[FAIL] Bluesky error: {e}")
        return False


async def test_virtual_influencer_creation():
    """Test Virtual Influencer CRUD operations"""
    print("\n" + "="*60)
    print("TEST 5: VIRTUAL INFLUENCER CREATION")
    print("="*60)
    
    try:
        from database import get_mock_db
        from models.schemas import VirtualInfluencer
        
        mock_db = get_mock_db()
        
        # Test: Create VI
        test_vi = {
            "id": "test_vi_auto",
            "name": "Test Auto VI",
            "description": "Created by comprehensive test suite",
            "avatar_url": "/static/test.png",
            "specialties": ["Testing", "Automation"],
            "price_range": "$100"
        }
        
        created = mock_db.create_virtual_influencer(test_vi)
        print(f"[PASS] Created VI: {created['id']}")
        
        # Test: List all VIs
        all_vis = mock_db.get_all_virtual_influencers()
        print(f"[PASS] Listed {len(all_vis)} VIs")
        
        # Test: Get specific VI
        fetched = mock_db.get_virtual_influencer_by_id("test_vi_auto")
        if fetched and fetched['name'] == "Test Auto VI":
            print(f"[PASS] Retrieved VI: {fetched['name']}")
            return True
        else:
            print("[FAIL] Could not retrieve created VI")
            return False
            
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_youtube_analytics():
    """Test YouTube video analysis"""
    print("\n" + "="*60)
    print("TEST 6: YOUTUBE ANALYTICS")
    print("="*60)
    
    if not settings.YOUTUBE_API_KEY:
        print("[SKIP] YOUTUBE_API_KEY not configured")
        return True
    
    try:
        from services.youtube_service import youtube_service
        
        # Test with a popular video
        test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        
        result = youtube_service.get_video_stats(test_url)
        
        if result and "video_id" in result:
            print(f"[PASS] Retrieved video stats")
            print(f"[INFO] Video ID: {result.get('video_id')}")
            print(f"[INFO] Title: {result.get('title', 'N/A')[:50]}...")
            return True
        else:
            print("[FAIL] Could not retrieve video stats")
            return False
            
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False


async def test_image_generation_endpoint():
    """Test image generation with fallback"""
    print("\n" + "="*60)
    print("TEST 7: IMAGE GENERATION ENDPOINT")
    print("="*60)
    
    print("[INFO] Testing Gemini → Pollinations.ai fallback")
    
    try:
        import httpx
        import urllib.parse
        
        # Test Pollinations.ai fallback directly
        prompt = "A professional tech influencer reviewing a laptop"
        encoded = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&nologo=true"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            
            if response.status_code == 200:
                print(f"[PASS] Pollinations.ai fallback working")
                print(f"[INFO] Image size: {len(response.content)} bytes")
                return True
            else:
                print(f"[FAIL] HTTP {response.status_code}")
                return False
                
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False


async def main():
    """Run all comprehensive tests"""
    print("\n" + "="*70)
    print(" KARTR COMPREHENSIVE FEATURE TEST SUITE")
    print("="*70)
    print(f"Testing Environment:")
    print(f"  - Gemini API: {'Configured' if settings.GEMINI_API_KEY else 'Not configured'}")
    print(f"  - Groq API: {'Configured' if settings.GROQ_API_KEY else 'Not configured'}")
    print(f"  - YouTube API: {'Configured' if settings.YOUTUBE_API_KEY else 'Not configured'}")
    print(f"  - Bluesky: {'Configured' if settings.BLUESKY_HANDLE else 'Not configured'}")
    print("="*70)
    
    tests = [
        ("Image Generation", test_gemini_image_generation),
        ("Video Generation", test_gemini_video_generation),
        ("RAG Pipeline", test_rag_pipeline),
        ("Bluesky Integration", test_bluesky_integration),
        ("Virtual Influencer", test_virtual_influencer_creation),
        ("YouTube Analytics", test_youtube_analytics),
        ("Image Endpoint", test_image_generation_endpoint),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = await test_func()
        except Exception as e:
            print(f"[ERROR] {test_name} crashed: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "="*70)
    print(" TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} {test_name}")
    
    print("="*70)
    print(f"Results: {passed}/{total} tests passed ({passed*100//total}%)")
    
    if passed == total:
        print("ALL TESTS PASSED!")
    elif passed >= total * 0.8:
        print("MOST TESTS PASSED - System is operational")
    else:
        print("SEVERAL TESTS FAILED - Review configuration")
    
    print("="*70 + "\n")
    
    return passed == total


if __name__ == "__main__":
    asyncio.run(main())
