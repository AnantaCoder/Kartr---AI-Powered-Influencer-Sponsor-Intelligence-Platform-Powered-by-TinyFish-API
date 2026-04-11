
import sys
import os
import json
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from utils.dependencies import get_current_user

# Mock user
def mock_get_current_user():
    return {
        "id": "test_user_id",
        "email": "test@example.com",
        "username": "testuser",
        "user_type": "influencer"
    }

# Override dependency
app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

def test_analyze_video():
    print("Testing /api/youtube/analyze-video endpoint...")
    
    # Using a popular video related to tech/coding as a test case
    # Taking a shorter video or standard one
    video_url = "https://www.youtube.com/watch?v=jNQXAC9IVRw" # Me at the zoo (first youtube video)
    
    payload = {
        "video_url": video_url
    }
    
    response = client.post("/api/youtube/analyze-video", json=payload)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("Success! JSON Response:")
        print(json.dumps(response.json(), indent=2))
        return True
    else:
        print(f"Failed. Response: {response.text}")
        return False

if __name__ == "__main__":
    result = test_analyze_video()
    if result:
        print("\nTest PASSED")
    else:
        print("\nTest FAILED")
        sys.exit(1)
