import os
import sys

# Define the set of modules to check and their expected import names
# Format: (import_name, package_name_in_requirements)
requirements = [
    ("fastapi", "fastapi"),
    ("uvicorn", "uvicorn"),
    ("dotenv", "python-dotenv"),
    ("jose", "python-jose"),
    ("passlib", "passlib"),
    ("multipart", "python-multipart"),
    ("atproto", "atproto"),
    ("groq", "groq"),
    ("pydantic", "pydantic"),
    ("httpx", "httpx"),
    ("googleapiclient", "google-api-python-client"),
    ("google.generativeai", "google-generativeai"),
    ("google.genai", "google-genai"),
    ("pandas", "pandas"),
    ("aiofiles", "aiofiles"),
    ("firebase_admin", "firebase-admin"),
    ("openai", "openai"),
    ("torch", "torch"),
    ("diffusers", "diffusers"),
    ("accelerate", "accelerate"),
    ("cv2", "opencv-python"),
    ("numpy", "numpy"),
    ("networkx", "networkx"),
    ("cloudinary", "cloudinary"),
    ("PIL", "Pillow")
]

missing = []
for import_name, pkg_name in requirements:
    try:
        __import__(import_name)
        # Handle sub-packages if necessary
        if "." in import_name:
            parts = import_name.split(".")
            mod = __import__(parts[0])
            for part in parts[1:]:
                mod = getattr(mod, part)
    except ImportError:
        missing.append(pkg_name)

if missing:
    print("MISSING_PACKAGES:" + ",".join(missing))
else:
    print("ALL_PACKAGES_SUCCESS")
