"""
Structural Test Script for Kartr FastAPI Backend

This script tests that all modules can be imported correctly
and verifies the structure without requiring API keys or database.

Run: python test_structure.py
"""
import sys
import traceback


def test_module(module_name: str, import_statement: str) -> bool:
    """Test if a module can be imported."""
    try:
        exec(import_statement)
        print(f"  ✓ {module_name}")
        return True
    except Exception as e:
        print(f"  ✗ {module_name}: {str(e)}")
        return False


def main():
    print("=" * 60)
    print("Kartr FastAPI Backend - Structural Tests")
    print("=" * 60)
    
    results = []
    
    # Test Configuration
    print("\n📦 Configuration:")
    results.append(test_module(
        "config.py",
        "from config import settings"
    ))
    results.append(test_module(
        "firebase_config.py",
        "from firebase_config import FIREBASE_AVAILABLE, initialize_firebase, FirestoreRepository"
    ))
    results.append(test_module(
        "database.py",
        "from database import get_mock_db, is_firebase_configured, get_users_repository"
    ))
    
    # Test Models
    print("\n📋 Models:")
    results.append(test_module(
        "schemas.py (UserCreate)",
        "from models.schemas import UserCreate"
    ))
    results.append(test_module(
        "schemas.py (Token)",
        "from models.schemas import Token"
    ))
    results.append(test_module(
        "schemas.py (YouTubeStatsRequest)",
        "from models.schemas import YouTubeStatsRequest"
    ))
    results.append(test_module(
        "schemas.py (SearchResponse)",
        "from models.schemas import SearchResponse"
    ))
    
    # Test Utils
    print("\n🔧 Utils:")
    results.append(test_module(
        "security.py (hash_password)",
        "from utils.security import hash_password"
    ))
    results.append(test_module(
        "security.py (create_access_token)",
        "from utils.security import create_access_token"
    ))
    results.append(test_module(
        "dependencies.py",
        "from utils.dependencies import get_current_user, get_optional_user"
    ))
    
    # Test Services
    print("\n⚙️ Services:")
    results.append(test_module(
        "auth_service.py",
        "from services.auth_service import AuthService"
    ))
    results.append(test_module(
        "youtube_service.py",
        "from services.youtube_service import YouTubeService, youtube_service"
    ))
    results.append(test_module(
        "email_service.py",
        "from services.email_service import EmailService"
    ))
    
    # Test Routers
    print("\n🔌 Routers:")
    results.append(test_module(
        "auth.py",
        "from routers.auth import router"
    ))
    results.append(test_module(
        "youtube.py",
        "from routers.youtube import router"
    ))
    results.append(test_module(
        "search.py",
        "from routers.search import router"
    ))
    results.append(test_module(
        "virtual_influencer.py",
        "from routers.virtual_influencer import router"
    ))
    results.append(test_module(
        "social_media.py",
        "from routers.social_media import router"
    ))
    results.append(test_module(
        "image_generation.py",
        "from routers.image_generation import router"
    ))
    results.append(test_module(
        "visualization.py",
        "from routers.visualization import router"
    ))
    results.append(test_module(
        "utilities.py",
        "from routers.utilities import router"
    ))
    
    # Test Main App
    print("\n🚀 Main Application:")
    results.append(test_module(
        "main.py (FastAPI app)",
        "from main import app"
    ))
    
    # Test App Routes
    print("\n📍 Route Count:")
    try:
        from main import app
        route_count = len(list(app.routes))
        print(f"  ✓ Total routes registered: {route_count}")
        results.append(True)
    except Exception as e:
        print(f"  ✗ Could not count routes: {e}")
        results.append(False)
    
    # Summary
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ All tests passed! ({passed}/{total})")
        print("=" * 60)
        return 0
    else:
        print(f"❌ Some tests failed: {passed}/{total} passed")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
