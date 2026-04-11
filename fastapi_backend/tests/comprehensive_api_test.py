"""
Comprehensive API Testing Script for Kartr FastAPI Backend
Tests all endpoints and reports status
"""
import requests
import json
from datetime import datetime
import random
import string

BASE_URL = "http://localhost:8000"

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def test_endpoint(method, endpoint, data=None, headers=None, description=""):
    """Test an endpoint and return result"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            return {"status": "ERROR", "message": f"Unknown method: {method}"}
        
        status = "PASS" if response.status_code < 400 else "FAIL"
        if response.status_code == 401:
            status = "AUTH_REQUIRED"
        elif response.status_code == 422:
            status = "VALIDATION_ERROR"
        
        return {
            "endpoint": endpoint,
            "method": method,
            "description": description,
            "status": status,
            "status_code": response.status_code,
            "response": response.json() if response.text else {}
        }
    except requests.exceptions.ConnectionError:
        return {"endpoint": endpoint, "status": "ERROR", "message": "Connection failed"}
    except Exception as e:
        return {"endpoint": endpoint, "status": "ERROR", "message": str(e)}

def print_result(result):
    """Print test result in a formatted way"""
    status_colors = {
        "PASS": "\033[92m",  # Green
        "FAIL": "\033[91m",  # Red
        "AUTH_REQUIRED": "\033[93m",  # Yellow
        "VALIDATION_ERROR": "\033[94m",  # Blue
        "ERROR": "\033[91m"  # Red
    }
    reset = "\033[0m"
    
    status = result.get("status", "ERROR")
    color = status_colors.get(status, reset)
    
    print(f"{color}[{status}]{reset} {result.get('method', 'N/A')} {result['endpoint']}")
    if result.get('description'):
        print(f"       Description: {result['description']}")
    if result.get('status_code'):
        print(f"       Status Code: {result['status_code']}")
    if result.get('response') and status != "PASS":
        resp = result['response']
        if isinstance(resp, dict) and 'detail' in resp:
            print(f"       Response: {resp['detail']}")
    print()

def run_tests():
    print("=" * 70)
    print("KARTR API COMPREHENSIVE TEST SUITE")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Base URL: {BASE_URL}")
    print("=" * 70)
    print()

    results = []
    auth_token = None
    
    # ===== PUBLIC ENDPOINTS =====
    print("-" * 50)
    print("SECTION 1: PUBLIC ENDPOINTS (No Auth Required)")
    print("-" * 50)
    
    # Root endpoint
    result = test_endpoint("GET", "/", description="Root/Health check")
    print_result(result)
    results.append(result)
    
    # Health check
    result = test_endpoint("GET", "/api/health", description="API Health Status")
    print_result(result)
    results.append(result)
    
    # Platform stats
    result = test_endpoint("GET", "/api/stats/platform", description="Platform Statistics")
    print_result(result)
    results.append(result)
    
    # Contact info
    result = test_endpoint("GET", "/api/contact", description="Contact Information")
    print_result(result)
    results.append(result)
    
    # ===== AUTHENTICATION ENDPOINTS =====
    print("-" * 50)
    print("SECTION 2: AUTHENTICATION ENDPOINTS")
    print("-" * 50)
    
    # Register new user
    random_suffix = generate_random_string()
    register_data = {
        "username": f"testuser_{random_suffix}",
        "email": f"test_{random_suffix}@example.com",
        "password": "testpassword123",
        "user_type": "influencer"
    }
    result = test_endpoint("POST", "/api/auth/register", data=register_data, description="User Registration")
    print_result(result)
    results.append(result)
    
    if result["status"] == "PASS" and "access_token" in result["response"]:
        auth_token = result["response"]["access_token"]
        print(f"       [OK] Obtained auth token for further tests")
    
    # Login
    login_data = {
        "email": f"test_{random_suffix}@example.com",
        "password": "testpassword123"
    }
    result = test_endpoint("POST", "/api/auth/login", data=login_data, description="User Login")
    print_result(result)
    results.append(result)
    
    if result["status"] == "PASS" and "access_token" in result.get("response", {}):
        auth_token = result["response"]["access_token"]
        print(f"       [OK] Login successful, obtained auth token")
    
    # Forgot password
    result = test_endpoint("POST", "/api/auth/forgot-password", 
                          data={"email": "test@example.com"}, 
                          description="Forgot Password Request")
    print_result(result)
    results.append(result)
    
    # ===== AUTHENTICATED ENDPOINTS =====
    print("-" * 50)
    print("SECTION 3: AUTHENTICATED ENDPOINTS")
    print("-" * 50)
    
    headers = {"Authorization": f"Bearer {auth_token}"} if auth_token else {}
    
    # Get current user
    result = test_endpoint("GET", "/api/auth/me", headers=headers, description="Get Current User")
    print_result(result)
    results.append(result)
    
    # User profile
    result = test_endpoint("GET", "/api/user/profile", headers=headers, description="User Profile")
    print_result(result)
    results.append(result)
    
    # ===== SEARCH ENDPOINTS =====
    print("-" * 50)
    print("SECTION 4: SEARCH ENDPOINTS")
    print("-" * 50)
    
    # Search
    result = test_endpoint("GET", "/api/search?q=test", headers=headers, description="Search")
    print_result(result)
    results.append(result)
    
    # Search suggestions
    result = test_endpoint("GET", "/api/search/suggestions?q=test", headers=headers, description="Search Suggestions")
    print_result(result)
    results.append(result)
    
    # ===== YOUTUBE ENDPOINTS =====
    print("-" * 50)
    print("SECTION 5: YOUTUBE ENDPOINTS")
    print("-" * 50)
    
    # YouTube stats
    result = test_endpoint("POST", "/api/youtube/stats", 
                          data={"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
                          headers=headers,
                          description="Get YouTube Stats")
    print_result(result)
    results.append(result)
    
    # YouTube demo
    result = test_endpoint("POST", "/api/youtube/demo",
                          data={"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
                          headers=headers,
                          description="YouTube Demo")
    print_result(result)
    results.append(result)
    
    # Get channels
    result = test_endpoint("GET", "/api/youtube/channels", headers=headers, description="Get YouTube Channels")
    print_result(result)
    results.append(result)
    
    # ===== VIRTUAL INFLUENCER ENDPOINTS =====
    print("-" * 50)
    print("SECTION 6: VIRTUAL INFLUENCER ENDPOINTS")
    print("-" * 50)
    
    # List virtual influencers
    result = test_endpoint("GET", "/api/virtual-influencers", headers=headers, description="List Virtual Influencers")
    print_result(result)
    results.append(result)
    
    # Get specific virtual influencer
    result = test_endpoint("GET", "/api/virtual-influencers/1", headers=headers, description="Get Virtual Influencer by ID")
    print_result(result)
    results.append(result)
    
    # ===== SOCIAL MEDIA ENDPOINTS =====
    print("-" * 50)
    print("SECTION 7: SOCIAL MEDIA ENDPOINTS")
    print("-" * 50)
    
    # List agents
    result = test_endpoint("GET", "/api/social-media/agents", headers=headers, description="List Social Media Agents")
    print_result(result)
    results.append(result)
    
    # List images
    result = test_endpoint("GET", "/api/social-media/images", headers=headers, description="List Social Media Images")
    print_result(result)
    results.append(result)
    
    # ===== IMAGE GENERATION ENDPOINTS =====
    print("-" * 50)
    print("SECTION 8: IMAGE GENERATION ENDPOINTS")
    print("-" * 50)
    
    # Generate image
    result = test_endpoint("POST", "/api/images/generate",
                          data={"prompt": "A beautiful sunset", "brand_name": "TestBrand"},
                          headers=headers,
                          description="Generate Promotional Image")
    print_result(result)
    results.append(result)
    
    # List generated images
    result = test_endpoint("GET", "/api/images/generated", headers=headers, description="List Generated Images")
    print_result(result)
    results.append(result)
    
    # ===== VISUALIZATION & Q&A ENDPOINTS =====
    print("-" * 50)
    print("SECTION 9: VISUALIZATION & Q&A ENDPOINTS")
    print("-" * 50)
    
    # Creator-sponsor graph
    result = test_endpoint("GET", "/api/graphs/creator-sponsor", headers=headers, description="Creator-Sponsor Graph")
    print_result(result)
    results.append(result)
    
    # Industry graph
    result = test_endpoint("GET", "/api/graphs/industry", headers=headers, description="Industry Graph")
    print_result(result)
    results.append(result)
    
    # Visualization data
    result = test_endpoint("GET", "/api/visualization/data", headers=headers, description="Visualization Data")
    print_result(result)
    results.append(result)
    
    # Ask question
    result = test_endpoint("POST", "/api/questions/ask",
                          data={"question": "What are the top influencers?"},
                          headers=headers,
                          description="Ask AI Question")
    print_result(result)
    results.append(result)
    
    # Ask about graph
    result = test_endpoint("POST", "/api/questions/ask-graph",
                          data={"question": "Show me sponsor relationships"},
                          headers=headers,
                          description="Ask Graph Question")
    print_result(result)
    results.append(result)
    
    # ===== LOGOUT =====
    print("-" * 50)
    print("SECTION 10: LOGOUT")
    print("-" * 50)
    
    result = test_endpoint("POST", "/api/auth/logout", headers=headers, description="Logout")
    print_result(result)
    results.append(result)
    
    # ===== SUMMARY =====
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    pass_count = sum(1 for r in results if r.get("status") == "PASS")
    fail_count = sum(1 for r in results if r.get("status") == "FAIL")
    auth_count = sum(1 for r in results if r.get("status") == "AUTH_REQUIRED")
    validation_count = sum(1 for r in results if r.get("status") == "VALIDATION_ERROR")
    error_count = sum(1 for r in results if r.get("status") == "ERROR")
    
    print(f"\033[92mPASSED: {pass_count}\033[0m")
    print(f"\033[91mFAILED: {fail_count}\033[0m")
    print(f"\033[93mAUTH REQUIRED: {auth_count}\033[0m")
    print(f"\033[94mVALIDATION ERROR: {validation_count}\033[0m")
    print(f"\033[91mERROR: {error_count}\033[0m")
    print(f"TOTAL TESTS: {len(results)}")
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    return results

if __name__ == "__main__":
    run_tests()
