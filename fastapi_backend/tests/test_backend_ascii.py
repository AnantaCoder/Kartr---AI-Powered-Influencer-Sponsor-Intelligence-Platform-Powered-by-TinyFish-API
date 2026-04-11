"""
Backend API Test Script (ASCII output)
"""
import requests
import time

BASE_URL = "http://localhost:8000"
passed = 0
failed = 0
failed_tests = []

def test(name, condition, details=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"[PASS] {name}")
    else:
        failed += 1
        failed_tests.append(f"{name}: {details}")
        print(f"[FAIL] {name} - {details}")

print("=" * 50)
print("KARTR BACKEND TEST")
print("=" * 50)

# 1. Health
print("\n-- HEALTH --")
try:
    r = requests.get(f"{BASE_URL}/")
    test("Root endpoint", r.status_code == 200)
except Exception as e:
    test("Root endpoint", False, str(e))

try:
    r = requests.get(f"{BASE_URL}/api/health")
    test("Health check", r.status_code == 200)
except Exception as e:
    test("Health check", False, str(e))

# 2. Auth
print("\n-- AUTH --")
admin_token = None
try:
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@email.com", "password": "admin@123"
    })
    test("Admin login", r.status_code == 200)
    if r.status_code == 200:
        admin_token = r.json().get("access_token")
except Exception as e:
    test("Admin login", False, str(e))

sponsor_token = None
try:
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": f"sponsor_{int(time.time())}",
        "email": f"sponsor_{int(time.time())}@test.com",
        "password": "testpass123",
        "user_type": "sponsor",
        "full_name": "Test Sponsor"
    })
    test("Register sponsor", r.status_code == 201)
    if r.status_code == 201:
        sponsor_token = r.json().get("access_token")
except Exception as e:
    test("Register sponsor", False, str(e))

influencer_token = None
try:
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": f"influencer_{int(time.time())}",
        "email": f"influencer_{int(time.time())}@test.com",
        "password": "testpass123",
        "user_type": "influencer",
        "full_name": "Test Influencer"
    })
    test("Register influencer", r.status_code == 201)
    if r.status_code == 201:
        influencer_token = r.json().get("access_token")
except Exception as e:
    test("Register influencer", False, str(e))

# 3. Admin
print("\n-- ADMIN --")
if admin_token:
    h = {"Authorization": f"Bearer {admin_token}"}
    try:
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=h)
        test("Admin: List users", r.status_code == 200)
    except Exception as e:
        test("Admin: List users", False, str(e))
    
    try:
        r = requests.get(f"{BASE_URL}/api/admin/analytics", headers=h)
        test("Admin: Analytics", r.status_code == 200)
    except Exception as e:
        test("Admin: Analytics", False, str(e))
    
    try:
        r = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=h)
        test("Admin: Dashboard", r.status_code == 200)
    except Exception as e:
        test("Admin: Dashboard", False, str(e))

# 4. Campaigns
print("\n-- CAMPAIGNS --")
campaign_id = None
if sponsor_token:
    h = {"Authorization": f"Bearer {sponsor_token}"}
    try:
        r = requests.post(f"{BASE_URL}/api/campaigns", headers=h, json={
            "name": "Test Campaign",
            "description": "Test campaign for dishwasher promotion targeting home makers",
            "niche": "home appliances",
            "keywords": ["dishwasher", "kitchen", "home"]
        })
        test("Campaign: Create", r.status_code == 201)
        if r.status_code == 201:
            campaign_id = r.json().get("id")
    except Exception as e:
        test("Campaign: Create", False, str(e))
    
    try:
        r = requests.get(f"{BASE_URL}/api/campaigns", headers=h)
        test("Campaign: List", r.status_code == 200)
    except Exception as e:
        test("Campaign: List", False, str(e))
    
    if campaign_id:
        try:
            r = requests.get(f"{BASE_URL}/api/campaigns/{campaign_id}", headers=h)
            test("Campaign: Get", r.status_code == 200)
        except Exception as e:
            test("Campaign: Get", False, str(e))
        
        try:
            r = requests.put(f"{BASE_URL}/api/campaigns/{campaign_id}", headers=h, json={"name": "Updated"})
            test("Campaign: Update", r.status_code == 200)
        except Exception as e:
            test("Campaign: Update", False, str(e))
        
        try:
            r = requests.post(f"{BASE_URL}/api/campaigns/{campaign_id}/activate", headers=h)
            test("Campaign: Activate", r.status_code == 200)
        except Exception as e:
            test("Campaign: Activate", False, str(e))
        
        try:
            r = requests.get(f"{BASE_URL}/api/campaigns/{campaign_id}/influencers?find_new=true", headers=h)
            test("Campaign: Find influencers", r.status_code == 200)
        except Exception as e:
            test("Campaign: Find influencers", False, str(e))

# 5. Discovery
print("\n-- DISCOVERY --")
if sponsor_token:
    h = {"Authorization": f"Bearer {sponsor_token}"}
    try:
        r = requests.get(f"{BASE_URL}/api/campaigns/discover/influencers", headers=h, params={
            "niche": "home appliances", "keywords": "dishwasher,kitchen"
        })
        test("Discovery: Search", r.status_code == 200)
    except Exception as e:
        test("Discovery: Search", False, str(e))

# 6. Tracking
print("\n-- TRACKING --")
if sponsor_token and campaign_id:
    h = {"Authorization": f"Bearer {sponsor_token}"}
    try:
        r = requests.post(f"{BASE_URL}/api/tracking/log", headers=h, json={
            "campaign_id": campaign_id,
            "influencer_id": "test_inf",
            "event_type": "view"
        })
        test("Tracking: Log event", r.status_code == 201)
    except Exception as e:
        test("Tracking: Log event", False, str(e))
    
    try:
        r = requests.get(f"{BASE_URL}/api/tracking/campaign/{campaign_id}", headers=h)
        test("Tracking: Campaign metrics", r.status_code == 200)
    except Exception as e:
        test("Tracking: Campaign metrics", False, str(e))

# 7. RBAC
print("\n-- RBAC --")
try:
    r = requests.get(f"{BASE_URL}/api/admin/users")
    test("RBAC: Admin needs auth", r.status_code == 401)
except Exception as e:
    test("RBAC: Admin needs auth", False, str(e))

if sponsor_token:
    try:
        r = requests.get(f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {sponsor_token}"})
        test("RBAC: Sponsor blocked from admin", r.status_code == 403)
    except Exception as e:
        test("RBAC: Sponsor blocked from admin", False, str(e))

if influencer_token:
    try:
        r = requests.post(f"{BASE_URL}/api/campaigns", 
            headers={"Authorization": f"Bearer {influencer_token}"},
            json={"name": "X", "description": "Test desc", "niche": "test"})
        test("RBAC: Influencer blocked from campaigns", r.status_code == 403)
    except Exception as e:
        test("RBAC: Influencer blocked from campaigns", False, str(e))

# 8. Cleanup
print("\n-- CLEANUP --")
if sponsor_token and campaign_id:
    try:
        r = requests.delete(f"{BASE_URL}/api/campaigns/{campaign_id}", headers={"Authorization": f"Bearer {sponsor_token}"})
        test("Cleanup: Delete campaign", r.status_code == 200)
    except Exception as e:
        test("Cleanup: Delete campaign", False, str(e))

# Summary
print("\n" + "=" * 50)
print(f"PASSED: {passed}")
print(f"FAILED: {failed}")
total = passed + failed
if total > 0:
    print(f"SUCCESS RATE: {passed/total*100:.1f}%")
print("=" * 50)

if failed_tests:
    print("\nFAILED TESTS:")
    for f in failed_tests:
        print(f"  - {f}")
