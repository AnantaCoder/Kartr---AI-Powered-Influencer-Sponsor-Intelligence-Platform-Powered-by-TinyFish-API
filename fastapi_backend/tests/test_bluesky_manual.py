import requests
import sys
import settings 
# Configuration
API_URL = "http://localhost:8000"
USERNAME = settings.BLUESKY_USERNAME # Enter your Bluesky handle (e.g., user.bsky.social)
PASSWORD = settings.BLUESKY_PASSWORD # Enter your App Password (not your main password)

if not USERNAME or not PASSWORD:
    print("Please set USERNAME and PASSWORD in the script to test.")
    sys.exit(1)

def test_login():
    print(f"Testing Login for {USERNAME}...")
    try:
        response = requests.post(f"{API_URL}/bluesky/login", json={
            "identifier": USERNAME,
            "password": PASSWORD
        })
        if response.status_code == 200:
            print("Login successful!")
            return True
        else:
            print(f"Login failed: {response.text}")
            return False
    except Exception as e:
        print(f"Login exception: {str(e)}")
        return False

def test_text_post():
    print("\nTesting Text Post...")
    try:
        response = requests.post(f"{API_URL}/bluesky/post", json={
            "text": "Hello Bluesky from Kartr Backend! 🚀"
        })
        if response.status_code == 200:
            data = response.json()
            print(f"Post successful! URI: {data.get('post_uri')}")
        else:
            print(f"Post failed: {response.text}")
    except Exception as e:
        print(f"Post exception: {str(e)}")

if __name__ == "__main__":
    if test_login():
        test_text_post()
        # Uncomment to test video if you have a file
        # requests.post(f"{API_URL}/bluesky/post", json={"text": "Video test", "video_path": "path/to/video.mp4"})
