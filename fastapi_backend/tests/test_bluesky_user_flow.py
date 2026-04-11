import requests
import sys
import settings
# Configuration
API_URL = "http://localhost:8000"
TEST_EMAIL = "test_influencer@kartr.com"
TEST_PASS = "password123"
TEST_USER = "test_influencer"

# Bluesky Credentials (FILL THESE)
BSKY_HANDLE = settings.BLUESKY_USERNAME # Enter your Bluesky handle (e.g., user.bsky.social)
BSKY_PASSWORD = settings.BLUESKY_PASSWORD # Enter your App Password (not your main password)

if not BSKY_HANDLE or not BSKY_PASSWORD:
    print("Please set BSKY_HANDLE and BSKY_PASSWORD in the script to test.")
    sys.exit(1)

def run_test():
    session = requests.Session()
    
    # 1. Register/Login
    print(f"1. Authenticating as {TEST_EMAIL}...")
    auth_resp = session.post(f"{API_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASS
    })
    
    if auth_resp.status_code != 200:
        print("Login failed, trying to register...")
        reg_resp = session.post(f"{API_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASS,
            "username": TEST_USER,
            "user_type": "influencer"
        })
        if reg_resp.status_code not in [200, 201]:
            print(f"Registration failed: {reg_resp.text}")
            return
        token = reg_resp.json()["access_token"]
    else:
        token = auth_resp.json()["access_token"]
        
    headers = {"Authorization": f"Bearer {token}"}
    print("Authentication successful.")

    # 2. Connect Bluesky Account
    print(f"\n2. Connecting Bluesky account: {BSKY_HANDLE}...")
    connect_resp = session.post(
        f"{API_URL}/bluesky/connect",
        json={"identifier": BSKY_HANDLE, "password": BSKY_PASSWORD},
        headers=headers
    )
    
    if connect_resp.status_code == 200:
        print("Bluesky account connected!")
    else:
        print(f"Failed to connect Bluesky: {connect_resp.text}")
        return

    # 3. Post Text (Auto-using credentials)
    print("\n3. Posting text using stored credentials...")
    post_resp = session.post(
        f"{API_URL}/bluesky/post",
        json={"text": "Testing Kartr Multi-User Bluesky Integration! 🚀"},
        headers=headers
    )
    
    if post_resp.status_code == 200:
        data = post_resp.json()
        print(f"Post successful! URI: {data.get('post_uri')}")
    else:
        print(f"Post failed: {post_resp.text}")

if __name__ == "__main__":
    run_test()
