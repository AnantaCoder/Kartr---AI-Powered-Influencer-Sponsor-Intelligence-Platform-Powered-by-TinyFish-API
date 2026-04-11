"""
Gemini Multimodal Test Script (Image + Video Prompt)

- Verifies API key
- Tests image generation (if supported)
- Tests video prompt / storyboard generation
- Defensive parsing
- CI-friendly exit codes
"""

import os
import sys
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

IMAGE_MODEL = "gemini-2.5-flash-image"
VIDEO_MODEL = "gemini-2.5-flash"

IMAGE_PROMPT = (
    "A chess player playing chess on mountain peaks, "
    "dramatic sunset, cinematic lighting"
)

VIDEO_PROMPT = """
Create a cinematic video storyboard for a 20-second video.

Theme: A lone chess player on snowy mountain peaks.
Style: Cinematic, epic, shallow depth of field.
Output format:
- Scene number
- Shot description
- Camera movement
- Duration (seconds)
"""


# -------------------------------------------------------------------
# API Key Verification (Legacy SDK)
# -------------------------------------------------------------------
def verify_api_key():
    print("\n" + "=" * 60)
    print("Verifying API Key")
    print("=" * 60)

    try:
        import google.generativeai as genai
    except ImportError:
        print("[ERROR] google.generativeai not installed.")
        return False

    if not settings.GEMINI_API_KEY:
        print("[ERROR] GEMINI_API_KEY not set.")
        return False

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        models = list(genai.list_models())
        print(f"[SUCCESS] API key valid. {len(models)} models accessible.")
        return True
    except Exception as e:
        print(f"[ERROR] API key verification failed: {e}")
        return False


# -------------------------------------------------------------------
# Image Generation Test
# -------------------------------------------------------------------
def test_image_generation(client):
    print("\n" + "=" * 60)
    print("Testing Image Generation")
    print("=" * 60)

    from google.genai import types

    try:
        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=IMAGE_PROMPT,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"]
            ),
        )

        for candidate in response.candidates or []:
            for part in candidate.content.parts or []:
                inline = getattr(part, "inline_data", None)
                if inline and inline.mime_type.startswith("image/"):
                    file_path = os.path.join(
                        OUTPUT_DIR,
                        f"generated_image_{IMAGE_MODEL.replace('/','_')}.png"
                    )
                    with open(file_path, "wb") as f:
                        f.write(inline.data)

                    print(f"[SUCCESS] Image saved: {file_path}")
                    return True

        print("[WARNING] Image model returned no image.")
        return False

    except Exception as e:
        print(f"[ERROR] Image generation failed: {e}")
        return False


# -------------------------------------------------------------------
# Video Prompt / Storyboard Generation Test
# -------------------------------------------------------------------
def test_video_generation(client):
    print("\n" + "=" * 60)
    print("Testing Video Prompt / Storyboard Generation")
    print("=" * 60)

    try:
        response = client.models.generate_content(
            model=VIDEO_MODEL,
            contents=VIDEO_PROMPT,
        )

        text_output = ""

        for candidate in response.candidates or []:
            for part in candidate.content.parts or []:
                if hasattr(part, "text"):
                    text_output += part.text

        if not text_output.strip():
            print("[ERROR] No video storyboard text returned.")
            return False

        output_file = os.path.join(OUTPUT_DIR, "video_storyboard.txt")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(text_output)

        print(f"[SUCCESS] Video storyboard saved: {output_file}")
        return True

    except Exception as e:
        print(f"[ERROR] Video generation failed: {e}")
        return False


# -------------------------------------------------------------------
# Main Runner
# -------------------------------------------------------------------
def main():
    print("\n" + "#" * 60)
    print("# Gemini Multimodal Test Suite")
    print("#" * 60)

    print(f"\nImage Model : {IMAGE_MODEL}")
    print(f"Video Model : {VIDEO_MODEL}")
    print(f"Output Dir  : {OUTPUT_DIR}")

    if not verify_api_key():
        print("\n[FATAL] API key invalid.")
        sys.exit(1)

    from google import genai
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    image_ok = test_image_generation(client)
    video_ok = test_video_generation(client)

    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Image Generation : {'SUCCESS' if image_ok else 'FAILED'}")
    print(f"Video Generation : {'SUCCESS' if video_ok else 'FAILED'}")

    if image_ok or video_ok:
        sys.exit(0)
    else:
        sys.exit(2)


# -------------------------------------------------------------------
if __name__ == "__main__":
    main()
