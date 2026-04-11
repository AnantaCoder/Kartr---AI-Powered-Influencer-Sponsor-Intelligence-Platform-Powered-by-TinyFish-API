"""
Simple auth test script with clear output.
"""
import requests
import random
import string

BASE_URL = "http://localhost:8000"
SUFFIX = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
token = None  # Will be set after successful login

print("=" * 50)
print("AUTH ENDPOINT TESTS")
print("=" * 50)

# Test 1: Firebase Connection
print("\n[1] FIREBASE CONNECTION")
try:
    from firebase_config import initialize_firebase, get_firestore, FIREBASE_AVAILABLE
    print(f"    Available: {FIREBASE_AVAILABLE}")
    init = initialize_firebase()
    print(f"    Initialized: {init}")
    db = get_firestore()
    print(f"    Firestore: {'OK' if db else 'FAILED'}")
except Exception as e:
    print(f"    ERROR: {e}")

# Test 2: Register
print("\n[2] USER REGISTRATION")
user = {
    "username": f"test_{SUFFIX}",
    "email": f"test_{SUFFIX}@example.com",
    "password": "TestPass123!",
    "user_type": "influencer"
}
try:
    r = requests.post(f"{BASE_URL}/api/auth/register", json=user, timeout=15)
    print(f"    Status: {r.status_code}")
    if r.status_code == 201:
        data = r.json()
        token = data.get("access_token", "")
        print(f"    Token: {token[:30]}..." if token else "    Token: None")
        print(f"    User ID: {data.get('user', {}).get('id')}")
    else:
        print(f"    Error: {r.json().get('detail', r.text)}")
except requests.exceptions.ConnectionError:
    print("    ERROR: Server not running!")
except Exception as e:
    print(f"    ERROR: {e}")

# Test 3: Login
print("\n[3] USER LOGIN")
try:
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": user["email"], "password": user["password"]}, timeout=15)
    print(f"    Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        token = data.get("access_token", "")
        print(f"    Token: {token[:30]}..." if token else "    Token: None")
    else:
        print(f"    Error: {r.json().get('detail', r.text)}")
except requests.exceptions.ConnectionError:
    print("    ERROR: Server not running!")
    token = None
except Exception as e:
    print(f"    ERROR: {e}")
    token = None

# Test 4: Get /me
print("\n[4] GET CURRENT USER (/me)")
if token:
    try:
        r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=15)
        print(f"    Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"    Username: {data.get('username')}")
            print(f"    Email: {data.get('email')}")
        else:
            print(f"    Error: {r.json().get('detail', r.text)}")
    except Exception as e:
        print(f"    ERROR: {e}")
else:
    print("    SKIPPED (no token)")

# Test 5: Logout
print("\n[5] LOGOUT")
if token:
    try:
        r = requests.post(f"{BASE_URL}/api/auth/logout", headers={"Authorization": f"Bearer {token}"}, timeout=15)
        print(f"    Status: {r.status_code}")
        if r.status_code == 200:
            print(f"    Message: {r.json().get('message')}")
        else:
            print(f"    Error: {r.json().get('detail', r.text)}")
    except Exception as e:
        print(f"    ERROR: {e}")
else:
    print("    SKIPPED (no token)")

# Test 6: Password Reset
print("\n[6] FORGOT PASSWORD")
try:
    r = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": user["email"]}, timeout=15)
    print(f"    Status: {r.status_code}")
    if r.status_code == 200:
        print(f"    Message: {r.json().get('message')}")
    else:
        print(f"    Error: {r.json().get('detail', r.text)}")
except Exception as e:
    print(f"    ERROR: {e}")

print("\n" + "=" * 50)
print("TESTS COMPLETE")
print("=" * 50)
