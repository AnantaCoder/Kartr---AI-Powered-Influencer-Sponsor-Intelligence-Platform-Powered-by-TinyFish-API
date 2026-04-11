"""
Direct HTTP test for Groq API (bypass client library issues)
"""
import asyncio
import httpx
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings


async def test_groq_http():
    """Test Groq API via direct HTTP request"""
    print("\nDIRECT GROQ HTTP API TEST")
    print("="*60)
    
    if not settings.GROQ_API_KEY:
        print("[FAIL] GROQ_API_KEY not set")
        return False
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Groq API works' in exactly those words."}
        ],
        "temperature": 0.7,
        "max_tokens": 50
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                message = data['choices'][0]['message']['content']
                print(f"[PASS] Status: {response.status_code}")
                print(f"[PASS] Response: {message}")
                print(f"[PASS] Model: {data.get('model', 'N/A')}")
                
                if "works" in message.lower() or "groq" in message.lower():
                    print("[PASS] GROQ HTTP TEST PASSED")
                    return True
                else:
                    print("[WARN] Got response but unexpected content")
                    return False
            else:
                print(f"[FAIL] HTTP {response.status_code}: {response.text}")
                return False
                
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False


async def test_chat_service_manual():
    """Manually test chat service with conversation"""
    print("\nCHAT SERVICE MANUAL TEST")
    print("="*60)
    
    try:
        from services.chat_service import ChatService
        
        # Create conversation
        success, convo, err = ChatService.create_conversation(
            user_id="manual_test_user",
            title="Manual Test Chat"
        )
        
        if not success:
            print(f"[FAIL] Create conversation: {err}")
            return False
        
        print(f"[PASS] Conversation created: {convo['id']}")
        
        # Get response (will use Groq if Gemini fails)
        success, response, error = await ChatService.generate_ai_response(
            conversation_id=convo['id'],
            user_id="manual_test_user",
            user_message="What is Kartr in one sentence?"
        )
        
        if success and response:
            print(f"[PASS] Got AI response ({len(response)} chars)")
            print(f"[INFO] Response: {response[:150]}...")
            print("[PASS] CHAT SERVICE TEST PASSED")
            return True
        else:
            print(f"[FAIL] No response: {error}")
            return False
            
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    print("\n" + "="*60)
    print("GROQ FALLBACK VERIFICATION TESTS")
    print("="*60)
    print(f"Groq API Key: {settings.GROQ_API_KEY[:20]}...")
    print(f"Groq Model: {settings.GROQ_MODEL}")
    print("="*60)
    
    results = {
        "groq_http": await test_groq_http(),
        "chat_service": await test_chat_service_manual(),
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
        print("ALL TESTS PASSED - GROQ FALLBACK WORKING")
    else:
        print("SOME TESTS FAILED - CHECK OUTPUT ABOVE")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
