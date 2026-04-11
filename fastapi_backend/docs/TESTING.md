# Testing Guide

How to run and write tests for the Kartr backend.

---

## Running Tests

### All Tests

```bash
cd fastapi_backend
python -m pytest tests/ -v
```

### Specific Test File

```bash
python -m pytest tests/test_auth.py -v
```

### With Coverage

```bash
pip install pytest-cov
python -m pytest tests/ --cov=. --cov-report=html
```

---

## Test Structure

```
tests/
├── __init__.py
├── test_auth.py               # Authentication tests
├── test_auth_simple.py        # Basic auth tests
├── test_admin.py              # Admin endpoint tests (TODO)
├── test_campaigns.py          # Campaign tests (TODO)
├── test_bluesky_manual.py     # Bluesky integration
├── test_analyze_video_endpoint.py
├── test_image_generation.py
├── comprehensive_api_test.py  # Full API smoke tests
└── ...
```

---

## Writing Tests

### Basic Test Example

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200


def test_register_user():
    response = client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "user_type": "influencer"
    })
    assert response.status_code == 201
    assert "access_token" in response.json()
```

### Test with Authentication

```python
def get_auth_headers():
    # Login as admin
    response = client.post("/api/auth/login", json={
        "email": "admin@email.com",
        "password": "admin@123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_admin_list_users():
    headers = get_auth_headers()
    response = client.get("/api/admin/users", headers=headers)
    assert response.status_code == 200
    assert "users" in response.json()
```

### Test RBAC

```python
def test_admin_endpoint_without_auth():
    response = client.get("/api/admin/users")
    assert response.status_code == 401


def test_admin_endpoint_as_influencer():
    # Register as influencer
    client.post("/api/auth/register", json={
        "username": "influencer1",
        "email": "inf@example.com",
        "password": "password123",
        "user_type": "influencer"
    })
    
    # Login
    login = client.post("/api/auth/login", json={
        "email": "inf@example.com",
        "password": "password123"
    })
    token = login.json()["access_token"]
    
    # Try admin endpoint
    response = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
```

---

## Test Categories

### Unit Tests
- Test individual functions
- Mock external dependencies
- Fast execution

### Integration Tests
- Test API endpoints
- Use TestClient
- May use mock database

### Manual Tests
- Tests requiring real API keys
- Named `test_*_manual.py`
- Run separately

---

## Fixtures

```python
import pytest

@pytest.fixture
def auth_headers():
    """Get admin auth headers."""
    response = client.post("/api/auth/login", json={
        "email": "admin@email.com",
        "password": "admin@123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sponsor_headers():
    """Create and login as sponsor."""
    # Create sponsor
    client.post("/api/auth/register", json={
        "username": "testsponsor",
        "email": "sponsor@test.com",
        "password": "password123",
        "user_type": "sponsor"
    })
    
    # Login
    response = client.post("/api/auth/login", json={
        "email": "sponsor@test.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

---

## CI/CD

Add to GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt
      - run: python -m pytest tests/ -v
```
