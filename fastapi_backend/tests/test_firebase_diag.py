"""
Simple Firebase diagnostic script.
"""
import os
import sys

# Set working directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("FIREBASE DIAGNOSTIC")
print("=" * 60)

# Check if firebase-admin is installed
try:
    import firebase_admin
    print(f"[OK] firebase-admin installed: {firebase_admin.__version__}")
except ImportError as e:
    print(f"[ERROR] firebase-admin not installed: {e}")
    sys.exit(1)

# Check config settings
from config import settings
print(f"\n[CONFIG] FIREBASE_CREDENTIALS = '{settings.FIREBASE_CREDENTIALS}'")

# Check if file exists
creds_path = settings.FIREBASE_CREDENTIALS
if not os.path.isabs(creds_path):
    creds_path = os.path.join(os.path.dirname(__file__), creds_path)

print(f"[CONFIG] Full path = '{creds_path}'")
print(f"[CONFIG] File exists = {os.path.exists(creds_path)}")

if os.path.exists(creds_path):
    print(f"[CONFIG] File size = {os.path.getsize(creds_path)} bytes")
    
    # Try to read JSON
    import json
    try:
        with open(creds_path, 'r') as f:
            data = json.load(f)
        print(f"[OK] JSON valid, project_id = {data.get('project_id', 'N/A')}")
    except Exception as e:
        print(f"[ERROR] JSON parse error: {e}")
else:
    print("[ERROR] Credentials file not found!")
    print("\nAvailable JSON files in directory:")
    for f in os.listdir(os.path.dirname(__file__)):
        if f.endswith('.json'):
            print(f"  - {f}")

# Try Firebase initialization
print("\n" + "=" * 60)
print("FIREBASE INITIALIZATION")
print("=" * 60)

try:
    from firebase_config import initialize_firebase, get_firestore, FIREBASE_AVAILABLE
    print(f"[INFO] FIREBASE_AVAILABLE = {FIREBASE_AVAILABLE}")
    
    result = initialize_firebase()
    print(f"[INFO] initialize_firebase() = {result}")
    
    if result:
        db = get_firestore()
        print(f"[INFO] Firestore client = {db}")
        
        # Try listing collections
        collections = list(db.collections())
        print(f"[OK] Connected to Firestore! Collections: {len(collections)}")
        for col in collections[:5]:
            print(f"  - {col.id}")
    else:
        print("[ERROR] Firebase initialization returned False")
        
except Exception as e:
    print(f"[ERROR] Exception: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
