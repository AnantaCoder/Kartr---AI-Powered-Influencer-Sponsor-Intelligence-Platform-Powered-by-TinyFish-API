"""
Test script to verify Gemini API key functionality.

Run: python test_gemini_api.py
"""
import sys
import os

# Add parent directory to path to allow imports from backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Import config after loading .env
from config import settings

# Import and configure genai AFTER settings are loaded
import google.generativeai as genai


def test_gemini_api():
    """Test the Gemini API connection and basic functionality."""
    try:
        # Check if API key is configured
        if not settings.GEMINI_API_KEY:
            print("[ERROR] GEMINI_API_KEY is not set in .env file!")
            print("Please add: GEMINI_API_KEY=your_api_key_here")
            return False
        
        print(f"[INFO] Using API key: {settings.GEMINI_API_KEY[:10]}...{settings.GEMINI_API_KEY[-4:]}")
        
        # Configure the API with the key from settings
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # List available models to verify API access
        print("[INFO] Checking available Gemini models...")
        models = genai.list_models()
        gemini_models = [m.name for m in models if 'gemini' in m.name.lower()]
        
        print(f"[SUCCESS] API Key is valid! Found {len(gemini_models)} Gemini models:")
        for model in gemini_models:
            print(f"   - {model}")
        
        # Test text generation
        print(f"\n[TEST] Testing text generation with model: {settings.GEMINI_TEXT_MODEL}...")
        model = genai.GenerativeModel(settings.GEMINI_TEXT_MODEL)
        response = model.generate_content("Say 'Hello! Gemini API is working!' in exactly those words.")
        
        print(f"[SUCCESS] Generation successful!")
        print(f"[RESPONSE] {response.text}")
        
        print("\n" + "="*50)
        print("[DONE] All tests passed! Gemini API key is working correctly.")
        print("="*50)
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Error testing Gemini API: {type(e).__name__}: {e}")
        return False


if __name__ == "__main__":
    test_gemini_api()

