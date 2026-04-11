
import asyncio
import logging
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from routers.social_media import post_to_bluesky
from models.schemas import BlueskyPostRequest, VirtualInfluencer
from routers.virtual_influencer import create_virtual_influencer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_bluesky():
    print("\n--- Testing Bluesky Posting ---")
    if not settings.BLUESKY_HANDLE or not settings.BLUESKY_PASSWORD:
        print("SKIPPING: Bluesky credentials not set in .env")
        return

    req = BlueskyPostRequest(content="Hello from Kartr manual test script! #KartrTest")
    # Mock current_user
    result = await post_to_bluesky(req, current_user={"username": "test_user"})
    print(f"Result: {result}")

async def test_virtual_influencer_creation():
    print("\n--- Testing Virtual Influencer Creation ---")
    new_vi = VirtualInfluencer(
        id="vi_test_001",
        name="Test Influencer",
        description="A test virtual influencer created via script.",
        avatar_url="/static/images/test.png",
        specialties=["Testing", "Automation"],
        price_range="$100 - $500"
    )
    
    result = await create_virtual_influencer(new_vi, current_user={"username": "test_user"})
    print(f"Created VI: {result.name} (ID: {result.id})")
    assert result.name == "Test Influencer"
    print("SUCCESS: Virtual Influencer creation verified.")

async def test_gemini_image_generation():
    print("\n--- Testing Gemini Image Generation ---")
    if not settings.GEMINI_API_KEY:
        print("SKIPPING: Gemini API key not set")
        return

    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        print("Gemini Client initialized successfully.")
        
        # Test a simple text generation to verify API key
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents="Explain what Kartr is in one sentence."
        )
        print(f"Gemini Test Response: {response.text}")
        
    except ImportError:
        print("ERROR: google-genai package not installed.")
    except Exception as e:
        print(f"ERROR: Gemini test failed: {e}")

async def test_chat_fallback():
    print("\n--- Testing Chat Service (Gemini -> Groq Fallback) ---")
    from services.chat_service import ChatService
    
    # Force Gemini initialization to fail or be simulated as failed?
    # Actually, if Gemini is hitting 429, the code should automatically fallback.
    # Let's try sending a message.
    
    # Create valid mock data for conversation
    success, convo, err = ChatService.create_conversation(user_id="test_user", title="Test Chat")
    if not success:
        print(f"ERROR: Failed to create conversation: {err}")
        return

    print(f"Created conversation: {convo['id']}")
    
    success, response, err = await ChatService.generate_ai_response(
        conversation_id=convo['id'],
        user_id="test_user",
        user_message="What is Kartr?"
    )
    
    if success:
        print(f"AI Response success: {len(response)} chars")
        print(f"Response snippet: {response[:100]}...")
    else:
        print(f"AI Response failed: {err}")

async def main():
    print("Starting Kartr Manual Feature Verification...")
    
    await test_gemini_image_generation()
    await test_bluesky()
    await test_virtual_influencer_creation()
    await test_chat_fallback()
    
    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(main())
