import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["FRONTEND_ORIGINS"] = "http://localhost:3000,http://localhost:5173"
os.environ["REDIS_URL"] = ""

TEST_DB_URL = "sqlite://"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    from app.database.base import Base
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()

@pytest.fixture(scope="function")
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    from app.main import app
    from app.database import get_db
    from app.core.redis import redis_client

    # Reset RedisStub storage between tests
    if redis_client.client and hasattr(redis_client.client, "_data"):
        redis_client.client._data.clear()
        redis_client.client._expires.clear()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def seeded_users(db):
    from app.models import User, Incident, Zone
    from app.core.security import hash_password

    pwd = hash_password("Password123")
    officer = User(id="usr-officer-1", name="Officer Bob", phone="9999999990", email="officer@test.com", role="officer", password_hash=pwd)
    volunteer = User(id="usr-volunteer-1", name="Volunteer Alice", phone="9999999991", email="volunteer@test.com", role="volunteer", password_hash=pwd)
    citizen = User(id="usr-citizen-1", name="Citizen Charlie", phone="9999999992", email="citizen@test.com", role="citizen", password_hash=pwd)
    
    zone = Zone(id="z-silchar", name="Silchar Central", district="Cachar", population_est=1000)
    db.add_all([officer, volunteer, citizen, zone])
    db.commit()

    inc = Incident(
        id="inc-sec-test-1",
        title="Test Flood",
        category="flood",
        severity="high",
        description="Water rising near town hall",
        lat=24.8333,
        lng=92.7789,
        zone_id="z-silchar",
        reporter_id=None,
        status="reported",
        review_state="unverified",
        credibility_score=1.0,
        priority_score=0.85
    )
    db.add(inc)
    db.commit()
    return db

@pytest.fixture
def officer_jwt(seeded_users, client):
    resp = client.post("/auth/login", json={"phone": "9999999990", "password": "Password123", "role": "officer"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest.fixture
def volunteer_jwt(seeded_users, client):
    resp = client.post("/auth/login", json={"phone": "9999999991", "password": "Password123", "role": "volunteer"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest.fixture
def citizen_jwt(seeded_users, client):
    resp = client.post("/auth/login", json={"phone": "9999999992", "password": "Password123", "role": "citizen"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


# ===========================================================================
# 1. PROTECTED ROUTE / BACKEND ROLE AUTHORIZATION TESTS
# ===========================================================================

def test_officer_endpoint_no_jwt_returns_401(client, seeded_users):
    """Accessing an officer verification endpoint without JWT must return 401."""
    resp = client.post(
        "/incidents/inc-sec-test-1/verify",
        json={"review_state": "verified", "credibility_score": 0.9}
    )
    assert resp.status_code == 401

def test_officer_endpoint_citizen_jwt_returns_403(client, citizen_jwt):
    """Authenticated citizen accessing officer verification endpoint must return 403."""
    resp = client.post(
        "/incidents/inc-sec-test-1/verify",
        headers={"Authorization": f"Bearer {citizen_jwt}"},
        json={"review_state": "verified", "credibility_score": 0.9}
    )
    assert resp.status_code == 403

def test_officer_endpoint_volunteer_jwt_returns_403(client, volunteer_jwt):
    """Authenticated volunteer accessing officer verification endpoint must return 403."""
    resp = client.post(
        "/incidents/inc-sec-test-1/verify",
        headers={"Authorization": f"Bearer {volunteer_jwt}"},
        json={"review_state": "verified", "credibility_score": 0.9}
    )
    assert resp.status_code == 403

def test_officer_endpoint_officer_jwt_allowed(client, officer_jwt):
    """Authenticated officer accessing officer verification endpoint is allowed."""
    resp = client.post(
        "/incidents/inc-sec-test-1/verify",
        headers={"Authorization": f"Bearer {officer_jwt}"},
        json={"review_state": "verified", "credibility_score": 0.9}
    )
    assert resp.status_code == 200
    assert resp.json()["review_state"] == "verified"


# ===========================================================================
# 2. INCIDENT REPORTER IMPERSONATION TESTS
# ===========================================================================

def test_authenticated_incident_forces_jwt_user_id_ignoring_client_reporter_id(client, citizen_jwt):
    """
    Authenticated user creating an incident with a malicious reporter_id
    MUST have reporter_id set to their verified JWT identity (usr-citizen-1).
    """
    payload = {
        "title": "Severe Waterlogging",
        "category": "flood",
        "severity": "high",
        "description": "Unique description: Waterlogging at Sector 4 - Auth Test",
        "lat": 24.8333,
        "lng": 92.7789,
        "zone_id": "z-silchar",
        "reporter_id": "usr-officer-1"  # Malicious spoof attempt
    }
    resp = client.post(
        "/incidents",
        headers={"Authorization": f"Bearer {citizen_jwt}"},
        json=payload
    )
    assert resp.status_code == 200
    data = resp.json()
    # The server MUST ignore usr-officer-1 and set reporter_id to the JWT user (usr-citizen-1)
    assert data["reporter_id"] == "usr-citizen-1"

def test_unauthenticated_guest_emergency_sos_sets_reporter_id_none(client, seeded_users):
    """
    Unauthenticated emergency SOS creation MUST succeed with reporter_id = None
    and preserve the guest chatbot workflow without foreign-key errors.
    """
    payload = {
        "title": "Urgent Rescue Needed",
        "category": "flood",
        "severity": "critical",
        "description": "Unique description: Trapped on rooftop near bridge - Guest Test",
        "lat": 24.8340,
        "lng": 92.7795,
        "zone_id": "z-silchar",
        "reporter_id": "usr-guest"  # Client passes guest placeholder or whatever
    }
    resp = client.post("/incidents", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["reporter_id"] is None
    assert data["status"] == "reported"

    # Verify that the incident is returned in GET /incidents for the officer workflow
    list_resp = client.get("/incidents")
    assert list_resp.status_code == 200
    matching = [inc for inc in list_resp.json() if inc["id"] == data["id"]]
    assert len(matching) == 1
    assert matching[0]["reporter_id"] is None


# ===========================================================================
# 3. TARGETED RATE LIMITING TESTS
# ===========================================================================

def test_rate_limiting_auth_login_returns_429(client, seeded_users):
    """
    Hitting /auth/login beyond the rate limit threshold must return HTTP 429.
    """
    from app.core.config import settings

    limit = settings.RATE_LIMIT_LOGIN
    # Fire requests under limit
    for _ in range(limit):
        resp = client.post(
            "/auth/login",
            json={"phone": "9999999990", "password": "WrongPassword", "role": "officer"}
        )
        assert resp.status_code == 401

    # Next request should exceed the limit and return 429
    resp_blocked = client.post(
        "/auth/login",
        json={"phone": "9999999990", "password": "Password123", "role": "officer"}
    )
    assert resp_blocked.status_code == 429
    assert "Too many requests" in resp_blocked.json()["detail"]

def test_rate_limiting_ai_assistant_returns_429(client):
    """
    Hitting /ai/assistant beyond the rate limit threshold must return HTTP 429.
    """
    from app.core.config import settings

    limit = settings.RATE_LIMIT_AI
    # Fire requests up to the limit
    for i in range(limit):
        resp = client.post("/ai/assistant", json={"message": f"Hello {i}", "language": "en"})
        assert resp.status_code in [200, 503]

    # Next request should return 429
    resp_blocked = client.post("/ai/assistant", json={"message": "Exceeding request", "language": "en"})
    assert resp_blocked.status_code == 429
    assert "Too many requests" in resp_blocked.json()["detail"]


def test_rate_limiting_sos_creation_under_limit_succeeds(client, seeded_users):
    """
    Guest emergency SOS creation under the rate limit succeeds cleanly.
    """
    payload = {
        "title": "Emergency SOS",
        "category": "flood",
        "severity": "high",
        "description": "Unique description: Water level rising rapidly at hospital - Under Limit",
        "lat": 24.8310,
        "lng": 92.7750,
        "zone_id": "z-silchar"
    }
    resp = client.post("/incidents", json=payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "reported"
