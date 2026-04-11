"""
Test script for Firebase configuration and authentication endpoints.

This script verifies:
1. Firebase initialization and Firestore connection
2. All authentication API endpoints
"""
import os
import sys
import requests
import time
import random
import string

# Base URL for the API
BASE_URL = "http://localhost:8000"

# Test user data (using random suffix to avoid conflicts)
RANDOM_SUFFIX = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
TEST_USER = {
    "username": f"testuser_{RANDOM_SUFFIX}",
    "email": f"testuser_{RANDOM_SUFFIX}@example.com",
    "password": "TestPassword123!",
    "user_type": "influencer"
}

# Store the JWT token after login
jwt_token = None


def print_header(title):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_result(success, message):
    """Print test result with status indicator."""
    status = "[PASS]" if success else "[FAIL]"
    print(f"  {status} {message}")
    return success


def test_firebase_connection():
    """Test Firebase initialization and Firestore connection."""
    print_header("Testing Firebase Connection")
    
    try:
        # Import and test Firebase
        from firebase_config import initialize_firebase, get_firestore, FIREBASE_AVAILABLE
        
        if not FIREBASE_AVAILABLE:
            return print_result(False, "Firebase Admin SDK not installed")
        
        # Try to initialize
        initialized = initialize_firebase()
        if not initialized:
            return print_result(False, "Firebase initialization failed - check credentials")
        
        print_result(True, "Firebase initialized successfully")
        
        # Test Firestore connection
        db = get_firestore()
        if db is None:
            return print_result(False, "Could not get Firestore client")
        
        print_result(True, "Firestore client obtained")
        
        # Try a simple operation
        collections = list(db.collections())
        print_result(True, f"Connected to Firestore - found {len(collections)} existing collections")
        
        return True
        
    except Exception as e:
        return print_result(False, f"Firebase error: {type(e).__name__}: {e}")


def test_register():
    """Test user registration endpoint."""
    print_header("Testing User Registration")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=TEST_USER,
            timeout=10
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print_result(True, f"User registered: {data.get('user', {}).get('email')}")
            print(f"  Token received: {data.get('access_token', '')[:50]}...")
            return True, data.get("access_token")
        else:
            error = response.json().get("detail", "Unknown error")
            # If user already exists, that's okay for repeat tests
            if "already" in error.lower():
                print_result(True, f"User already exists (expected on repeat runs): {error}")
                return True, None
            return print_result(False, f"Registration failed: {error}"), None
            
    except requests.exceptions.ConnectionError:
        return print_result(False, "Could not connect to server. Is it running?"), None
    except Exception as e:
        return print_result(False, f"Error: {type(e).__name__}: {e}"), None


def test_login():
    """Test user login endpoint."""
    global jwt_token
    print_header("Testing User Login")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_USER["email"],
                "password": TEST_USER["password"]
            },
            timeout=10
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            jwt_token = data.get("access_token")
            print_result(True, f"Login successful for: {data.get('user', {}).get('email')}")
            print(f"  JWT Token: {jwt_token[:50]}...")
            return True
        else:
            error = response.json().get("detail", "Unknown error")
            return print_result(False, f"Login failed: {error}")
            
    except requests.exceptions.ConnectionError:
        return print_result(False, "Could not connect to server. Is it running?")
    except Exception as e:
        return print_result(False, f"Error: {type(e).__name__}: {e}")


def test_get_current_user():
    """Test getting current user info with JWT."""
    print_header("Testing Get Current User (/me)")
    
    if not jwt_token:
        return print_result(False, "No JWT token available - login first")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {jwt_token}"},
            timeout=10
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Current user retrieved")
            print(f"    ID: {data.get('id')}")
            print(f"    Username: {data.get('username')}")
            print(f"    Email: {data.get('email')}")
            print(f"    User Type: {data.get('user_type')}")
            return True
        else:
            error = response.json().get("detail", "Unknown error")
            return print_result(False, f"Failed to get user: {error}")
            
    except Exception as e:
        return print_result(False, f"Error: {type(e).__name__}: {e}")


def test_logout():
    """Test logout endpoint."""
    print_header("Testing Logout")
    
    if not jwt_token:
        return print_result(False, "No JWT token available - login first")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {jwt_token}"},
            timeout=10
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Logout successful: {data.get('message')}")
            return True
        else:
            error = response.json().get("detail", "Unknown error")
            return print_result(False, f"Logout failed: {error}")
            
    except Exception as e:
        return print_result(False, f"Error: {type(e).__name__}: {e}")


def test_forgot_password():
    """Test password reset request."""
    print_header("Testing Forgot Password")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": TEST_USER["email"]},
            timeout=10
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Password reset initiated: {data.get('message')}")
            return True
        else:
            error = response.json().get("detail", "Unknown error")
            return print_result(False, f"Password reset failed: {error}")
            
    except Exception as e:
        return print_result(False, f"Error: {type(e).__name__}: {e}")


def run_all_tests():
    """Run all authentication tests."""
    print("\n")
    print("*" * 60)
    print("   KARTR AUTHENTICATION TEST SUITE")
    print("*" * 60)
    print(f"\n  Base URL: {BASE_URL}")
    print(f"  Test Email: {TEST_USER['email']}")
    
    results = []
    
    # Test 1: Firebase Connection
    results.append(("Firebase Connection", test_firebase_connection()))
    
    # Test 2: User Registration
    reg_result, token = test_register()
    results.append(("User Registration", reg_result if isinstance(reg_result, bool) else False))
    
    # Test 3: User Login
    results.append(("User Login", test_login()))
    
    # Test 4: Get Current User
    results.append(("Get Current User", test_get_current_user()))
    
    # Test 5: Logout
    results.append(("Logout", test_logout()))
    
    # Test 6: Password Reset
    results.append(("Forgot Password", test_forgot_password()))
    
    # Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"  {status} {name}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n  [SUCCESS] All tests passed! Firebase and Auth are working!")
    else:
        print(f"\n  [WARNING] {total - passed} test(s) failed. Check the output above.")
    
    return passed == total


if __name__ == "__main__":
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run all tests
    success = run_all_tests()
    sys.exit(0 if success else 1)
