"""
Debug Groq API 400 Error
"""
import asyncio
import httpx
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings


async def debug_groq_api():
    """Debug the Groq API call"""
    print("\nDebugging Groq API...")
    print(f"API Key: {settings.GROQ_API_KEY[:20]}...")
    print(f"Model: {settings.GROQ_MODEL}")
    
    # Test with minimal request
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Simple test payload
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "user", "content": "Say 'test' in one word"}
        ],
        "temperature": 0.7,
        "max_tokens": 50
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            print(f"\nStatus Code: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"\nSuccess! Response: {data['choices'][0]['message']['content']}")
                return True
            else:
                print(f"\nFailed with {response.status_code}")
                return False
                
    except Exception as e:
        print(f"\nException: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    asyncio.run(debug_groq_api())
