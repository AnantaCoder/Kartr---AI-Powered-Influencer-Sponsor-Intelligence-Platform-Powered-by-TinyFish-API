"""
Comprehensive Backend Test Script
Tests all major endpoints of the Kartr API
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

# Test results tracker
results = {
    "passed": [],
    "failed": [],
    "skipped": []
}


def test(name, condition, details=""):
    """Record test result."""
    if condition:
        results["passed"].append(name)
        print(f"✅ PASS: {name}")
    else:
        results["failed"].append({"name": name, "details": details})
        print(f"❌ FAIL: {name} - {details}")


def skip(name, reason):
    """Skip a test."""
    results["skipped"].append({"name": name, "reason": reason})
    print(f"⏭️ SKIP: {name} - {reason}")


print("=" * 60)
print("KARTR BACKEND COMPREHENSIVE TEST")
print("=" * 60)
print()

# =============================================================================
# 1. Health Check
# =============================================================================
print("\n--- 1. HEALTH & ROOT ENDPOINTS ---")

try:
    r = requests.get(f"{BASE_URL}/")
    test("Root endpoint", r.status_code == 200, f"Status: {r.status_code}")
except Exception as e:
    test("Root endpoint", False, str(e))

try:
    r = requests.get(f"{BASE_URL}/api/health")
    test("Health check", r.status_code == 200, f"Status: {r.status_code}")
except Exception as e:
    test("Health check", False, str(e))

# =============================================================================
# 2. Authentication
# =============================================================================
print("\n--- 2. AUTHENTICATION ---")

# Admin login
admin_token = None
try:
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@email.com",
        "password": "admin@123"
    })
    test("Admin login", r.status_code == 200, f"Status: {r.status_code}")
    if r.status_code == 200:
        admin_token = r.json().get("access_token")
        test("Admin token received", admin_token is not None)
except Exception as e:
    test("Admin login", False, str(e))

# Register sponsor
sponsor_token = None
sponsor_email = f"testsponsor_{int(time.time())}@test.com"
try:
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": f"testsponsor_{int(time.time())}",
        "email": sponsor_email,
        "password": "testpass123",
        "user_type": "sponsor",
        "full_name": "Test Sponsor"
    })
    test("Register sponsor", r.status_code == 201, f"Status: {r.status_code}, {r.text[:100]}")
    if r.status_code == 201:
        sponsor_token = r.json().get("access_token")
except Exception as e:
    test("Register sponsor", False, str(e))

# Register influencer
influencer_token = None
influencer_email = f"testinfluencer_{int(time.time())}@test.com"
try:
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": f"kitchen_queen_{int(time.time())}",
        "email": influencer_email,
        "password": "testpass123",
        "user_type": "influencer",
        "full_name": "Kitchen Queen Influencer"
    })
    test("Register influencer", r.status_code == 201, f"Status: {r.status_code}")
    if r.status_code == 201:
        influencer_token = r.json().get("access_token")
except Exception as e:
    test("Register influencer", False, str(e))

# Login sponsor
if not sponsor_token:
    try:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": sponsor_email,
            "password": "testpass123"
        })
        if r.status_code == 200:
            sponsor_token = r.json().get("access_token")
    except:
        pass

# Get current user (me)
if sponsor_token:
    try:
        r = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {sponsor_token}"
        })
        test("Get current user (/me)", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Get current user (/me)", False, str(e))

# =============================================================================
# 3. Admin Endpoints
# =============================================================================
print("\n--- 3. ADMIN ENDPOINTS ---")

admin_headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}

if admin_token:
    # List users
    try:
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        test("Admin: List users", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            test("Admin: Users response has pagination", "total_count" in data)
    except Exception as e:
        test("Admin: List users", False, str(e))
    
    # List sponsors
    try:
        r = requests.get(f"{BASE_URL}/api/admin/sponsors", headers=admin_headers)
        test("Admin: List sponsors", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Admin: List sponsors", False, str(e))
    
    # List influencers
    try:
        r = requests.get(f"{BASE_URL}/api/admin/influencers", headers=admin_headers)
        test("Admin: List influencers", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Admin: List influencers", False, str(e))
    
    # Platform analytics
    try:
        r = requests.get(f"{BASE_URL}/api/admin/analytics", headers=admin_headers)
        test("Admin: Platform analytics", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            test("Admin: Analytics has user counts", "total_users" in data)
    except Exception as e:
        test("Admin: Platform analytics", False, str(e))
    
    # Dashboard
    try:
        r = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=admin_headers)
        test("Admin: Dashboard", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Admin: Dashboard", False, str(e))
else:
    skip("Admin endpoints", "No admin token")

# =============================================================================
# 4. Campaign Endpoints (Sponsor)
# =============================================================================
print("\n--- 4. CAMPAIGN ENDPOINTS ---")

sponsor_headers = {"Authorization": f"Bearer {sponsor_token}"} if sponsor_token else {}
campaign_id = None

if sponsor_token:
    # Create campaign
    try:
        r = requests.post(f"{BASE_URL}/api/campaigns", 
            headers=sponsor_headers,
            json={
                "name": "Dishwasher Promo Campaign",
                "description": "Promoting premium dishwashers for modern kitchens and homes. Looking for influencers who create content about home appliances, kitchen gadgets, and women lifestyle.",
                "niche": "home appliances",
                "keywords": ["dishwasher", "kitchen", "home", "women", "cooking"],
                "target_audience": "Women homemakers aged 25-45",
                "budget_min": 500,
                "budget_max": 2000
            }
        )
        test("Campaign: Create", r.status_code == 201, f"Status: {r.status_code}")
        if r.status_code == 201:
            campaign_id = r.json().get("id")
            test("Campaign: ID received", campaign_id is not None)
    except Exception as e:
        test("Campaign: Create", False, str(e))
    
    # List campaigns
    try:
        r = requests.get(f"{BASE_URL}/api/campaigns", headers=sponsor_headers)
        test("Campaign: List", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Campaign: List", False, str(e))
    
    # Get campaign
    if campaign_id:
        try:
            r = requests.get(f"{BASE_URL}/api/campaigns/{campaign_id}", headers=sponsor_headers)
            test("Campaign: Get by ID", r.status_code == 200, f"Status: {r.status_code}")
        except Exception as e:
            test("Campaign: Get by ID", False, str(e))
        
        # Update campaign
        try:
            r = requests.put(f"{BASE_URL}/api/campaigns/{campaign_id}", 
                headers=sponsor_headers,
                json={"name": "Updated Dishwasher Campaign"}
            )
            test("Campaign: Update", r.status_code == 200, f"Status: {r.status_code}")
        except Exception as e:
            test("Campaign: Update", False, str(e))
        
        # Activate campaign
        try:
            r = requests.post(f"{BASE_URL}/api/campaigns/{campaign_id}/activate", headers=sponsor_headers)
            test("Campaign: Activate", r.status_code == 200, f"Status: {r.status_code}")
        except Exception as e:
            test("Campaign: Activate", False, str(e))
        
        # Find matching influencers
        try:
            r = requests.get(f"{BASE_URL}/api/campaigns/{campaign_id}/influencers?find_new=true", headers=sponsor_headers)
            test("Campaign: Find influencers", r.status_code == 200, f"Status: {r.status_code}")
            if r.status_code == 200:
                data = r.json()
                test("Campaign: Influencers response structure", "matched_influencers" in data)
        except Exception as e:
            test("Campaign: Find influencers", False, str(e))
else:
    skip("Campaign endpoints", "No sponsor token")

# =============================================================================
# 5. Influencer Discovery
# =============================================================================
print("\n--- 5. INFLUENCER DISCOVERY ---")

if sponsor_token:
    try:
        r = requests.get(
            f"{BASE_URL}/api/campaigns/discover/influencers",
            headers=sponsor_headers,
            params={
                "niche": "home appliances",
                "keywords": "dishwasher,kitchen,cooking",
                "limit": 10
            }
        )
        test("Discovery: Search influencers", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            test("Discovery: Response has influencers list", "influencers" in data)
    except Exception as e:
        test("Discovery: Search influencers", False, str(e))
else:
    skip("Influencer discovery", "No sponsor token")

# =============================================================================
# 6. Performance Tracking
# =============================================================================
print("\n--- 6. PERFORMANCE TRACKING ---")

if sponsor_token and campaign_id:
    # Log performance event
    try:
        r = requests.post(f"{BASE_URL}/api/tracking/log",
            headers=sponsor_headers,
            json={
                "campaign_id": campaign_id,
                "influencer_id": "test_influencer_1",
                "event_type": "view",
                "value": 1
            }
        )
        test("Tracking: Log event", r.status_code == 201, f"Status: {r.status_code}")
    except Exception as e:
        test("Tracking: Log event", False, str(e))
    
    # Get campaign performance
    try:
        r = requests.get(f"{BASE_URL}/api/tracking/campaign/{campaign_id}", headers=sponsor_headers)
        test("Tracking: Campaign metrics", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Tracking: Campaign metrics", False, str(e))
else:
    skip("Performance tracking", "No sponsor token or campaign")

# =============================================================================
# 7. YouTube Endpoints
# =============================================================================
print("\n--- 7. YOUTUBE ENDPOINTS ---")

if sponsor_token:
    # Get video stats (using a known video)
    try:
        r = requests.post(f"{BASE_URL}/api/youtube/stats",
            headers=sponsor_headers,
            json={"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
        )
        test("YouTube: Get video stats", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("YouTube: Get video stats", False, str(e))
else:
    skip("YouTube endpoints", "No token")

# =============================================================================
# 8. RBAC (Role-Based Access Control)
# =============================================================================
print("\n--- 8. RBAC TESTS ---")

# Test admin endpoint without auth
try:
    r = requests.get(f"{BASE_URL}/api/admin/users")
    test("RBAC: Admin endpoint requires auth", r.status_code == 401, f"Status: {r.status_code}")
except Exception as e:
    test("RBAC: Admin endpoint requires auth", False, str(e))

# Test admin endpoint with sponsor token (should fail)
if sponsor_token:
    try:
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=sponsor_headers)
        test("RBAC: Sponsor cannot access admin", r.status_code == 403, f"Status: {r.status_code}")
    except Exception as e:
        test("RBAC: Sponsor cannot access admin", False, str(e))

# Test campaign endpoint with influencer token (should fail)
if influencer_token:
    try:
        r = requests.post(f"{BASE_URL}/api/campaigns",
            headers={"Authorization": f"Bearer {influencer_token}"},
            json={
                "name": "Test",
                "description": "Test description here",
                "niche": "test"
            }
        )
        test("RBAC: Influencer cannot create campaign", r.status_code == 403, f"Status: {r.status_code}")
    except Exception as e:
        test("RBAC: Influencer cannot create campaign", False, str(e))

# =============================================================================
# 9. Cleanup (Delete campaign)
# =============================================================================
print("\n--- 9. CLEANUP ---")

if sponsor_token and campaign_id:
    try:
        r = requests.delete(f"{BASE_URL}/api/campaigns/{campaign_id}", headers=sponsor_headers)
        test("Cleanup: Delete campaign", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Cleanup: Delete campaign", False, str(e))

# =============================================================================
# SUMMARY
# =============================================================================
print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
print(f"✅ PASSED: {len(results['passed'])}")
print(f"❌ FAILED: {len(results['failed'])}")
print(f"⏭️ SKIPPED: {len(results['skipped'])}")
print()

if results["failed"]:
    print("FAILED TESTS:")
    for f in results["failed"]:
        print(f"  - {f['name']}: {f['details']}")

if results["skipped"]:
    print("\nSKIPPED TESTS:")
    for s in results["skipped"]:
        print(f"  - {s['name']}: {s['reason']}")

print("\n" + "=" * 60)
success_rate = len(results['passed']) / (len(results['passed']) + len(results['failed'])) * 100 if (len(results['passed']) + len(results['failed'])) > 0 else 0
print(f"SUCCESS RATE: {success_rate:.1f}%")
print("=" * 60)
