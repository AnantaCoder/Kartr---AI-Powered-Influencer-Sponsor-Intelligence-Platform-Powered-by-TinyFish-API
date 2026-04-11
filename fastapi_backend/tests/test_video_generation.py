"""
Gemini Video Generation Test Script

- Verifies API key
- Tests video storyboard generation (Text)
- Tests actual video generation using Veo (if available)
- Saves output to files
"""

import os
import sys
import time
from dotenv import load_dotenv

# -------------------------------------------------------------------
# Path & Env Setup
# -------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

load_dotenv(os.path.join(BASE_DIR, ".env"))

from config import settings

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Models
STORYBOARD_MODEL = "gemini-2.5-flash"
VEO_MODEL = settings.GEMINI_VIDEO_MODEL  # Stable model

# Prompts
STORYBOARD_PROMPT = """
Create a cinematic storyboard for a 25-second video.
Theme: A lone chess player playing chess on snowy mountain peaks at sunset.
Style: Epic, cinematic, shallow depth of field, dramatic lighting.
Output: Numbered scenes with shot description, camera movement, and duration.
"""

VIDEO_PROMPT = "A cinematic drone shot of a futuristic city with glowing neon lights, 4k resolution, cyberpunk style"


# -------------------------------------------------------------------
# API Key Verification
# -------------------------------------------------------------------
def verify_api_key():
    print("\n" + "=" * 60)
    print("Verifying API Key")
    print("=" * 60)

    if not settings.GEMINI_API_KEY:
        print("[ERROR] GEMINI_API_KEY not set.")
        return False
    
    # Simple check if key exists, validity tested by actual calls
    print(f"[INFO] Key found: {settings.GEMINI_API_KEY[:4]}...{settings.GEMINI_API_KEY[-4:]}")
    return True

# -------------------------------------------------------------------
# Test 1: Video Storyboard (Text)
# -------------------------------------------------------------------
def test_storyboard_generation(client):
    print("\n" + "=" * 60)
    print("Test 1: Video Storyboard Generation (Text)")
    print("=" * 60)

    try:
        print(f"[INFO] Generating storyboard with {STORYBOARD_MODEL}...")
        response = client.models.generate_content(
            model=STORYBOARD_MODEL,
            contents=STORYBOARD_PROMPT,
        )

        storyboard_text = ""
        for candidate in response.candidates or []:
            for part in candidate.content.parts or []:
                if hasattr(part, "text"):
                    storyboard_text += part.text

        if not storyboard_text.strip():
            print("[ERROR] No storyboard text returned.")
            return False

        output_file = os.path.join(OUTPUT_DIR, "video_storyboard.txt")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(storyboard_text)

        print(f"[SUCCESS] Storyboard saved to: {output_file}")
        return True

    except Exception as e:
        print(f"[ERROR] Storyboard generation failed: {e}")
        return False

# -------------------------------------------------------------------
# Test 2: Actual Video Generation (Veo)
# -------------------------------------------------------------------
def test_veo_video_generation(client):
    print("\n" + "=" * 60)
    print("Test 2: Actual Video Generation (Veo 2.0)")
    print("=" * 60)

    try:
        from google.genai import types
        
        # Dynamic Model Selection
        veo_model = VEO_MODEL # Default
        found_model = False
        
        print("[INFO] Searching for available Veo models...")
        try:
            # Prefer Veo 3.1 for best quality
            for m in client.models.list():
                if "veo-3.1" in m.name.lower() and "generate" in m.name.lower():
                    veo_model = m.name.split("/")[-1]
                    print(f"[INFO] Found Veo 3.1 model: {veo_model}")
                    found_model = True
                    break
            # Fallback to Veo 3.0
            if not found_model:
                for m in client.models.list():
                    if "veo-3.0" in m.name.lower() and "generate" in m.name.lower():
                        veo_model = m.name.split("/")[-1]
                        print(f"[INFO] Found Veo 3.0 model: {veo_model}")
                        found_model = True
                        break
            # Fallback to Veo 2.0
            if not found_model:
                for m in client.models.list():
                    if "veo" in m.name.lower() and "generate" in m.name.lower():
                        veo_model = m.name.split("/")[-1]
                        print(f"[INFO] Found Veo model: {veo_model}")
                        found_model = True
                        break
        except Exception as e:
            print(f"[WARN] Model search failed: {e}")

        if not found_model:
             print(f"[WARN] No Veo model found. Trying default: {VEO_MODEL}")

        print(f"[INFO] Sending request to {veo_model}...")
        print(f"[INFO] Duration: 8 seconds")
        print(f"[INFO] Prompt: {VIDEO_PROMPT}")
        print(f"[NOTE] Audio generation requires Vertex AI SDK, not available via Gemini API.")

        operation = client.models.generate_videos(
            model=veo_model,
            prompt=VIDEO_PROMPT,
            config=types.GenerateVideosConfig(
                number_of_videos=1,
                duration_seconds=8,
            )
        )

        print("[INFO] Video is generating. Polling status...")
        
        # Poll the operation
        while not operation.done:
            time.sleep(5)
            # Refresh operation status
            operation = client.operations.get(operation)
            print(".", end="", flush=True)
        
        print("\n[INFO] Generation complete.")

        if operation.result and operation.result.generated_videos:
            generated_video = operation.result.generated_videos[0]
            
             # Download video from URI
            if hasattr(generated_video.video, 'uri'):
                 uri = generated_video.video.uri
                 
                 # Add API key to URI for authentication
                 if '?' in uri:
                     auth_uri = f"{uri}&key={settings.GEMINI_API_KEY}"
                 else:
                     auth_uri = f"{uri}?key={settings.GEMINI_API_KEY}"
                 
                 print(f"[INFO] Video URI found: {uri[:50]}...", flush=True)
                 
                 try:
                     import requests
                     print("[INFO] Starting download...", flush=True)
                     response = requests.get(auth_uri, timeout=120)
                     
                     if response.status_code == 200:
                         output_file = os.path.join(OUTPUT_DIR, f"veo_generated_{int(time.time())}.mp4")
                         with open(output_file, "wb") as f:
                             f.write(response.content)
                         print(f"[SUCCESS] Video saved to: {output_file}", flush=True)
                         return True
                     else:
                         print(f"[ERROR] Failed to download video. Status: {response.status_code}", flush=True)
                         print(f"[ERROR] Response content: {response.text[:200]}", flush=True)
                         return False
                 except Exception as e:
                     print(f"[ERROR] Download exception: {e}", flush=True)
                     return False

            print("[ERROR] Could not find video URI in response object.", flush=True)
            return False
        else:
            print("[ERROR] Generation failed or returned no result.")
            # Print explicit error if available in operation
            if hasattr(operation, 'error') and operation.error:
                 print(f"[ERROR DETAILS] {operation.error}")
            return False

    except Exception as e:
        print(f"[ERROR] Veo generation failed correctly: {e}")
        print("[TIP] Ensure your API key has access to the 'Veo' model whitelist or public preview.")
        
        # List models to debug
        print("\n[DEBUG] Available Models:")
        try:
             for m in client.models.list():
                 print(f" - {m.name}")
        except:
            print("Could not list models.")
            
        return False

# -------------------------------------------------------------------
# Main Runner
# -------------------------------------------------------------------
def main():
    print("\n" + "#" * 60)
    print("# Gemini Video Generation Test Suite")
    print("#" * 60)
    print(f"Output Dir: {OUTPUT_DIR}")

    if not verify_api_key():
        sys.exit(1)

    try:
        from google import genai
    except ImportError:
        print("[FATAL] google-genai library not found. Run: pip install google-genai")
        sys.exit(1)

    # Initialize Client
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    # Run Tests
    storyboard_ok = test_storyboard_generation(client)
    video_ok = test_veo_video_generation(client)

    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Storyboard Generation : {'SUCCESS' if storyboard_ok else 'FAILED'}")
    print(f"Veo Video Generation  : {'SUCCESS' if video_ok else 'FAILED'}")

    if storyboard_ok and video_ok:
        sys.exit(0)
    elif storyboard_ok: # At least partial success
        sys.exit(0) 
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
