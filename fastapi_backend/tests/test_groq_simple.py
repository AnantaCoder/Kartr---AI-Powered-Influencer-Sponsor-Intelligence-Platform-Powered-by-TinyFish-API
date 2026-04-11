"""
Simple Groq fallback test (ASCII only, no emojis)
"""
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from services.chat_service import ChatService


async def test_groq_direct():
    """Test Groq API directly"""
    print("\n" + "="*60)
    print("DIRECT GROQ API TEST")
    print("="*60)
    
    if not settings.GROQ_API_KEY:
        print("[FAIL] GROQ_API_KEY not configured")
        return False
    
    try:
        from groq import Groq
        
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Groq is working' in exactly those words."}
            ],
            temperature=0.7,
            max_tokens=50,
        )
        
        response = completion.choices[0].message.content
        print(f"[PASS] Groq Response: {response}")
        
        if "working" in response.lower():
            print("[PASS] GROQ DIRECT TEST PASSED")
            return True
        else:
            print("[WARN] Groq responded but unexpected content")
            return False
            
    except Exception as e:
        print(f"[FAIL] Groq API Test Failed: {e}")
        return False


async def test_chat_fallback():
    """Test ChatService fallback"""
    print("\n" + "="*60)
    print("CHAT SERVICE FALLBACK TEST")
    print("="*60)
    
    original_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = "INVALID_TEST_KEY"
    
    try:
        success, convo, err = ChatService.create_conversation(
            user_id="test_user_fallback",
            title="Fallback Test"
        )
        
        if not success:
            print(f"[FAIL] Create conversation failed: {err}")
            return False
        
        print(f"[PASS] Created conversation: {convo['id']}")
        
        success, response, error = ChatService.generate_ai_response(
            conversation_id=convo['id'],
            user_id="test_user_fallback",
            user_message="What is Kartr?"
        )
        
        if success and response:
            print(f"[PASS] Response length: {len(response)} chars")
            print(f"[INFO] Preview: {response[:100]}...")
            
            if len(response) > 30:
                print("[PASS] FALLBACK TEST PASSED")
                return True
        else:
            print(f"[FAIL] No response: {error}")
            return False
            
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False
    finally:
        settings.GEMINI_API_KEY = original_key


async def main():
    print("\nSTARTING GROQ TESTS")
    print("=" * 60)
    
    results = {
        "groq_direct": await test_groq_direct(),
        "chat_fallback": await test_chat_fallback(),
    }
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for name, passed in results.items():
        status = "PASS" if passed else "FAIL"
        print(f"{name:20s}: [{status}]")
    
    all_passed = all(results.values())
    print("\n" + "="*60)
    if all_passed:
        print("ALL TESTS PASSED!")
    else:
        print("SOME TESTS FAILED")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
