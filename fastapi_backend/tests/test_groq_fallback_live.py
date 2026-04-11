"""
Live test for Groq API fallback functionality.
This script tests the actual Groq API integration.
"""
import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from services.chat_service import ChatService


async def test_groq_direct():
    """Test Groq API directly"""
    print("\n" + "="*60)
    print("DIRECT GROQ API TEST")
    print("="*60)
    
    if not settings.GROQ_API_KEY:
        print("❌ GROQ_API_KEY not configured in .env")
        return False
    
    try:
        from groq import Groq
        
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Groq API is working!' in exactly those words."}
            ],
            temperature=0.7,
            max_tokens=50,
        )
        
        response = completion.choices[0].message.content
        print(f"✅ Groq Response: {response}")
        
        if "working" in response.lower():
            print("✅ GROQ API TEST PASSED")
            return True
        else:
            print("⚠️  Groq responded but with unexpected content")
            return False
            
    except Exception as e:
        print(f"❌ Groq API Test Failed: {e}")
        return False


async def test_chat_service_with_invalid_gemini():
    """Test ChatService fallback by forcing Gemini to fail"""
    print("\n" + "="*60)
    print("CHAT SERVICE FALLBACK TEST (Invalid Gemini Key)")
    print("="*60)
    
    # Temporarily break Gemini key to force fallback
    original_gemini_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = "INVALID_KEY_FOR_TESTING"
    
    try:
        # Create a conversation
        success, convo, err = ChatService.create_conversation(
            user_id="test_fallback_user",
            title="Fallback Test Chat"
        )
        
        if not success:
            print(f"❌ Failed to create conversation: {err}")
            return False
        
        print(f"✅ Created conversation: {convo['id']}")
        
        # Try to get AI response (should fallback to Groq)
        success, ai_response, error = ChatService.generate_ai_response(
            conversation_id=convo['id'],
            user_id="test_fallback_user",
            user_message="What is Kartr? Answer in one sentence."
        )
        
        if success and ai_response:
            print(f"✅ AI Response received (length: {len(ai_response)} chars)")
            print(f"📝 Response preview: {ai_response[:150]}...")
            
            # Check if it's a meaningful response (not error message)
            if len(ai_response) > 50 and "kartr" in ai_response.lower():
                print("✅ FALLBACK TEST PASSED - Groq provided valid response")
                return True
            else:
                print("⚠️  Got response but seems like error message")
                return False
        else:
            print(f"❌ Failed to get AI response: {error}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False
    finally:
        # Restore original Gemini key
        settings.GEMINI_API_KEY = original_gemini_key


async def test_chat_service_normal():
    """Test ChatService with normal Gemini (or Groq if Gemini quota exhausted)"""
    print("\n" + "="*60)
    print("CHAT SERVICE NORMAL TEST")
    print("="*60)
    
    try:
        # Create a conversation
        success, convo, err = ChatService.create_conversation(
            user_id="test_normal_user",
            title="Normal Test Chat"
        )
        
        if not success:
            print(f"❌ Failed to create conversation: {err}")
            return False
        
        print(f"✅ Created conversation: {convo['id']}")
        
        # Get AI response
        success, ai_response, error = ChatService.generate_ai_response(
            conversation_id=convo['id'],
            user_id="test_normal_user",
            user_message="Explain Kartr in one sentence."
        )
        
        if success and ai_response:
            print(f"✅ AI Response received (length: {len(ai_response)} chars)")
            print(f"📝 Response: {ai_response}")
            print("✅ NORMAL CHAT TEST PASSED")
            return True
        else:
            print(f"❌ Failed to get AI response: {error}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False


async def main():
    print("\n🚀 STARTING COMPREHENSIVE GROQ FALLBACK TESTS")
    print("=" * 60)
    
    results = {
        "groq_direct": await test_groq_direct(),
        "fallback": await test_chat_service_with_invalid_gemini(),
        "normal": await test_chat_service_normal(),
    }
    
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:20s}: {status}")
    
    all_passed = all(results.values())
    print("\n" + "="*60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("⚠️  SOME TESTS FAILED")
    print("="*60 + "\n")
    
    return all_passed


if __name__ == "__main__":
    asyncio.run(main())
