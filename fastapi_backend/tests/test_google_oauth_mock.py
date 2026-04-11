
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path so we can import from main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

def test_google_login_success():
    """
    Test successful Google Login flow with mocked Firebase token verification.
    """
    # Mock payload that verify_firebase_id_token would return for a valid token
    mock_payload = {
        "email": "new_google_user@example.com",
        "name": "Google User",
        "uid": "firebase_uid_12345",
        "picture": "https://example.com/avatar.jpg"
    }

    # We patch 'firebase_config.verify_firebase_id_token' because that's where the request goes
    with patch("firebase_config.verify_firebase_id_token") as mock_verify:
        mock_verify.return_value = mock_payload
        
        # Make request to our new endpoint
        response = client.post(
            "/api/auth/google",
            json={
                "id_token": "valid_firebase_token_placeholder",
                "user_type": "influencer"
            }
        )
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        
        # Verify Token structure
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        # Verify User data
        user = data["user"]
        assert user["email"] == mock_payload["email"]
        assert user["username"] == "Google User"
        assert user["user_type"] == "influencer"

def test_google_login_invalid_token():
    """
    Test Google Login with invalid token.
    """
    with patch("firebase_config.verify_firebase_id_token") as mock_verify:
        # Mock verification failure (returns None)
        mock_verify.return_value = None
        
        response = client.post(
            "/api/auth/google",
            json={
                "id_token": "invalid_token_string",
                "user_type": "influencer"
            }
        )
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid or expired token"

def test_google_login_existing_user():
    """
    Test logging in with an email that already exists.
    """
    # First create a user normally or stub the DB
    # We'll just rely on the mock behavior where we return a payload.
    # If the service logic works, it should find or create.
    
    mock_payload = {
        "email": "existing_user@example.com",
        "name": "Existing User",
        "uid": "uid_existing",
    }
    
    # 1. Mock DB finding the user
    # We patch AuthService.get_user_by_email to return a user
    mock_existing_user = {
        "id": "123",
        "email": "existing_user@example.com", 
        "username": "original_username", # specific username to check
        "user_type": "sponsor" # specific type to check
    }

    with patch("firebase_config.verify_firebase_id_token", return_value=mock_payload):
        with patch("services.auth_service.AuthService.get_user_by_email", return_value=mock_existing_user):
            
            response = client.post(
                "/api/auth/google",
                json={
                    "id_token": "valid_token",
                    "user_type": "influencer" # Requesting diff type shouldn't matter for existing user
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Should return the EXISTING user data, not the new one from payload
            assert data["user"]["username"] == "original_username"
            assert data["user"]["user_type"] == "sponsor"
