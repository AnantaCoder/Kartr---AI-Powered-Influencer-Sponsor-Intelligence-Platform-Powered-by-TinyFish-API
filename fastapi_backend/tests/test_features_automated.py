
import pytest
import pytest_asyncio
import sys
import os
import asyncio
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from routers.social_media import post_to_bluesky
from models.schemas import BlueskyPostRequest, VirtualInfluencer
from routers.virtual_influencer import create_virtual_influencer, list_virtual_influencers, get_virtual_influencer
from services.chat_service import ChatService

# --- Fixtures ---

@pytest.fixture
def mock_user():
    return {
        "id": "test_user_id",
        "email": "test@example.com",
        "username": "testuser",
        "user_type": "influencer"
    }

@pytest.fixture
def mock_vi_data():
    return VirtualInfluencer(
        id="auto_test_vi",
        name="Auto Test VI",
        description="Created by automated test suite",
        avatar_url="/static/images/test.png",
        specialties=["Testing"],
        price_range="$100"
    )

# --- Tests ---

@pytest.mark.asyncio
async def test_virtual_influencer_persistence(mock_user, mock_vi_data):
    """Test full lifecycle of VI: Create -> List -> Get"""
    print("\n--- Testing VI Persistence ---")
    
    # 1. Create
    created_vi = await create_virtual_influencer(mock_vi_data, current_user=mock_user)
    assert created_vi.id == mock_vi_data.id
    assert created_vi.name == mock_vi_data.name
    
    # 2. List
    all_vis = await list_virtual_influencers(current_user=mock_user)
    # Check if our created VI is in the list
    found = False
    for vi in all_vis:
        if vi.id == mock_vi_data.id:
            found = True
            break
    assert found, "Created VI not found in list"
    
    # 3. Get specific
    fetched_vi = await get_virtual_influencer(mock_vi_data.id, current_user=mock_user)
    assert fetched_vi.name == mock_vi_data.name
    print("VI Persistence Test Passed")

@pytest.mark.asyncio
async def test_bluesky_posting_mock(mock_user):
    """Test Bluesky posting with mocked client"""
    print("\n--- Testing Bluesky Mock ---")
    
    # Mock settings to ensure checks pass
    with patch('config.settings.BLUESKY_HANDLE', 'mock_handle'), \
         patch('config.settings.BLUESKY_PASSWORD', 'mock_password'), \
         patch('atproto.Client') as MockClient:
        
        # Setup mock client
        mock_instance = MockClient.return_value
        mock_instance.login.return_value = None
        mock_instance.send_post.return_value = MagicMock(uri="at://did:plc:123/app.bsky.feed.post/456")
        
        req = BlueskyPostRequest(content="Automated Test Post")
        response = await post_to_bluesky(req, current_user=mock_user)
        
        assert response.success is True
        assert "Successfully posted" in response.message
        assert response.post_uri == "at://did:plc:123/app.bsky.feed.post/456"
        print("Bluesky Mock Test Passed")

@pytest.mark.asyncio
async def test_chat_service_fallback():
    """Test Chat Service fallback logic"""
    print("\n--- Testing Chat Fallback ---")
    
    # Mock Gemini to Raise Exception
    with patch('google.generativeai.GenerativeModel') as MockGemini:
        mock_chat = MockGemini.return_value.start_chat.return_value
        mock_chat.send_message.side_effect = Exception("Gemini Quota Exceeded")
        
        # Mock Groq to Succeed
        with patch('groq.Groq') as MockGroq:
            mock_groq_instance = MockGroq.return_value
            mock_completion = MagicMock()
            mock_completion.choices = [MagicMock(message=MagicMock(content="Groq Fallback Response"))]
            mock_groq_instance.chat.completions.create.return_value = mock_completion
            
            # Ensure Groq API key is present
            with patch('config.settings.GROQ_API_KEY', 'mock_groq_key'):
                # We need a conversation first
                await ChatService.create_conversation("test_user", "Test Chat")
                
                # We can mock the internal call to avoid hitting DB for messages if we want, 
                # or just let it hit mock DB.
                # Let's patch get_conversation_messages to return empty list
                with patch.object(ChatService, 'get_conversation_messages', return_value=([], 0)):
                     success, response, err = await ChatService.generate_ai_response(
                        "test_convo_id", "test_user", "Hello"
                     )
                     
                     assert success is True
                     assert response == "Groq Fallback Response"
                     print("Chat Fallback Test Passed")

@pytest.mark.asyncio
async def test_video_analysis_import():
    """Verify we can import the video analysis service (even if we don't call external APIs)"""
    try:
        from services.analysis_service import analyze_influencer_sponsors
        print("Video Analysis Service importable")
    except ImportError:
        pytest.fail("Could not import video analysis service")
