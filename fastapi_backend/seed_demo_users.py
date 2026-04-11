
import requests
import json

BASE_URL = "http://localhost:8000"

def register_user(username, email, password, user_type):
    url = f"{BASE_URL}/api/auth/register"
    payload = {
        "username": username,
        "email": email,
        "password": password,
        "user_type": user_type
    }
    try:
        response = requests.post(url, json=payload)
        if response.status_code in (200, 201):
            print(f"✅ Successfully registered {user_type}: {email}")
        else:
            print(f"❌ Failed to register {user_type} ({email}): {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")

if __name__ == "__main__":
    print("🚀 Seeding demo users...")
    
    # Creator demo
    register_user("DemoCreator", "creator@demo.com", "demo1234", "influencer")
    
    # Sponsor demo
    register_user("DemoSponsor", "sponsor@demo.com", "demo1234", "sponsor")
    
    print("\n✨ Seeding complete!")
