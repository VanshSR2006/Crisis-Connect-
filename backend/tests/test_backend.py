"""
Crisis Connect Backend — P0 Tests
Member 3 — Backend + Database + Security + Realtime

Run with:
  cd backend
  python -m pytest tests/ -v

Uses in-memory SQLite for isolation (no production DB needed).
"""
import json
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set CORS origins and empty REDIS_URL for testing before app is imported
os.environ["FRONTEND_ORIGINS"] = "http://localhost:3000,http://localhost:5173"
os.environ["REDIS_URL"] = ""


# ---------------------------------------------------------------------------
# Test database — in-memory SQLite (no file-lock issues on Windows)
# ---------------------------------------------------------------------------
TEST_DB_URL = "sqlite://"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # all connections share the same in-memory DB
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create tables in the test database once per session."""
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from app.database.base import Base
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


@pytest.fixture(scope="function")
def db():
    """Provide a fresh transaction-rolled-back DB session per test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    """Provide a TestClient with DB dependency overridden."""
    from app.main import app
    from app.database import get_db

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
def seeded_db(db):
    """Seed basic users into the test DB for auth tests."""
    from app.models import User
    from app.core.security import hash_password
    pwd = hash_password("TestPassword123")
    officer = User(id="usr-officer-1", name="Officer Test", phone="1111111110", email="officer.test@crisisconnect.org", role="officer", password_hash=pwd)
    volunteer = User(id="usr-volunteer-1", name="Volunteer Test", phone="1111111111", email="volunteer.test@crisisconnect.org", role="volunteer", password_hash=pwd)
    citizen = User(id="usr-citizen-1", name="Citizen Test", phone="1111111112", email="citizen.test@crisisconnect.org", role="citizen", password_hash=pwd)
    db.add_all([officer, volunteer, citizen])
    db.commit()
    return db


@pytest.fixture
def officer_token(seeded_db, client):
    """Get a JWT token for the pre-seeded officer."""
    resp = client.post("/auth/login", json={"phone": "1111111110", "password": "TestPassword123", "role": "officer"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture
def citizen_token(seeded_db, client):
    """Get a JWT token for the pre-seeded citizen."""
    resp = client.post("/auth/login", json={"phone": "1111111112", "password": "TestPassword123", "role": "citizen"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture
def volunteer_token(seeded_db, client):
    """Get a JWT token for the pre-seeded volunteer."""
    resp = client.post("/auth/login", json={"phone": "1111111111", "password": "TestPassword123", "role": "volunteer"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def _seed_dispatch(db, dispatch_id, assigned_user_id, incident_id="inc-auth-1"):
    from app.models import Dispatch, Incident, Zone
    if not db.query(Zone).filter(Zone.id == "z-auth").first():
        db.add(Zone(id="z-auth", name="Auth Zone", district="Test", population_est=1000))
    if not db.query(Incident).filter(Incident.id == incident_id).first():
        db.add(Incident(
            id=incident_id, title="Auth Inc", category="rescue", severity="high",
            description="test", lat=24.8, lng=92.7, zone_id="z-auth",
            status="dispatched", review_state="unverified",
            credibility_score=1.0, priority_score=80.0
        ))
    db.add(Dispatch(
        id=dispatch_id,
        incident_id=incident_id,
        assigned_user_id=assigned_user_id,
        status="pending",
        eta_minutes=15,
    ))
    db.commit()


# ===========================================================================
# 1. Health
# ===========================================================================
class TestHealth:
    def test_health_returns_200(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "healthy"
        assert "service" in body
        assert "environment" in body


# ===========================================================================
# 1.5 CORS
# ===========================================================================
class TestCORS:
    def test_cors_options_request(self, client):
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
        r = client.options("/health", headers=headers)
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert r.headers.get("access-control-allow-credentials") == "true"


# ===========================================================================
# 2. Readiness
# ===========================================================================
class TestReadiness:
    def test_ready_database_ok(self, client):
        r = client.get("/ready")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ready"
        assert body["details"]["database"] == "connected"


# ===========================================================================
# 3. Authentication — Login & Signup
# ===========================================================================
class TestLogin:
    def test_citizen_login_phone_password_success(self, seeded_db, client):
        r = client.post("/auth/login", json={"phone": "1111111112", "password": "TestPassword123", "role": "citizen"})
        assert r.status_code == 200
        body = r.json()
        assert body["access_token"]
        assert body["user"]["role"] == "citizen"

    def test_officer_login_email_password_success(self, seeded_db, client):
        r = client.post("/auth/login", json={"email": "officer.test@crisisconnect.org", "password": "TestPassword123", "role": "officer"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "officer"

    def test_volunteer_login_email_password_success(self, seeded_db, client):
        r = client.post("/auth/login", json={"email": "volunteer.test@crisisconnect.org", "password": "TestPassword123", "role": "volunteer"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "volunteer"

    def test_missing_password_rejected(self, seeded_db, client):
        r = client.post("/auth/login", json={"phone": "1111111112"})
        assert r.status_code == 401

    def test_empty_password_rejected(self, seeded_db, client):
        r = client.post("/auth/login", json={"phone": "1111111112", "password": "   "})
        assert r.status_code == 401

    def test_wrong_password_rejected(self, seeded_db, client):
        r = client.post("/auth/login", json={"phone": "1111111112", "password": "WrongPassword"})
        assert r.status_code == 401

    def test_unknown_credentials_rejected(self, client):
        r = client.post("/auth/login", json={"phone": "9990001112", "password": "SomePassword"})
        assert r.status_code == 401

    def test_account_with_null_password_hash_rejected(self, db, client):
        from app.models import User
        no_pwd_user = User(id="usr-no-pwd", name="No Password User", phone="7777777777", role="citizen", password_hash=None)
        db.add(no_pwd_user)
        db.commit()

        # Login attempt must fail with 401
        r = client.post("/auth/login", json={"phone": "7777777777", "password": "AnyPassword"})
        assert r.status_code == 401

    def test_login_does_not_create_account(self, db, client):
        r = client.post("/auth/login", json={"phone": "0000000000", "password": "SomePassword"})
        assert r.status_code == 401
        from app.models import User
        u = db.query(User).filter(User.phone == "0000000000").first()
        assert u is None

    def test_login_does_not_modify_password_hash(self, db, client):
        from app.models import User
        from app.core.security import hash_password
        original_hash = hash_password("OriginalPassword")
        user = User(id="usr-test-hash", name="Hash Test", phone="6666666666", role="citizen", password_hash=original_hash)
        db.add(user)
        db.commit()

        # Attempt login with wrong password
        r = client.post("/auth/login", json={"phone": "6666666666", "password": "AttemptedPassword"})
        assert r.status_code == 401

        # Check DB hash remains unchanged
        db.refresh(user)
        assert user.password_hash == original_hash

    def test_login_wrong_role_rejected(self, seeded_db, client):
        r = client.post("/auth/login", json={"phone": "1111111112", "password": "TestPassword123", "role": "officer"})
        assert r.status_code == 401


def test_dispatch_create_does_not_default_to_a_demo_volunteer():
    from app.routers.dispatch import DispatchCreate

    assert DispatchCreate(incident_id="inc-1").assigned_user_id is None


def test_officer_can_list_real_volunteers_only(client, seeded_db, officer_token):
    response = client.get(
        "/users?role=volunteer",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert response.status_code == 200
    assert response.json() == [{
        "id": "usr-volunteer-1",
        "name": "Volunteer Test",
        "email": "volunteer.test@crisisconnect.org",
    }]


def test_citizen_cannot_list_volunteers(client, seeded_db, citizen_token):
    response = client.get(
        "/users?role=volunteer",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert response.status_code == 403


def test_officer_status_updates_persist_for_citizen_refresh(client, seeded_db, officer_token):
    created = client.post("/incidents", json={
        "title": "Citizen SOS",
        "category": "rescue",
        "severity": "high",
        "description": "Needs assistance",
        "lat": 24.82,
        "lng": 92.79,
        "reporter_id": "usr-citizen-1",
    })
    assert created.status_code == 200
    incident_id = created.json()["id"]
    assert created.json()["status"] == "reported"

    headers = {"Authorization": f"Bearer {officer_token}"}
    acknowledged = client.patch(
        f"/incidents/{incident_id}/status",
        json={"status": "acknowledged"},
        headers=headers,
    )
    assert acknowledged.status_code == 200
    assert acknowledged.json()["status"] == "acknowledged"
    refreshed = client.get("/incidents")
    assert next(i for i in refreshed.json() if i["id"] == incident_id)["status"] == "acknowledged"

    resolved = client.patch(
        f"/incidents/{incident_id}/status",
        json={"status": "resolved"},
        headers=headers,
    )
    assert resolved.status_code == 200
    refreshed = client.get("/incidents")
    assert next(i for i in refreshed.json() if i["id"] == incident_id)["status"] == "resolved"

class TestSignup:
    def test_citizen_signup_and_login_with_phone(self, client):
        # Signup
        signup_resp = client.post("/auth/signup", json={
            "name": "Citizen User",
            "phone": "9876543219",
            "password": "Password123",
            "role": "citizen",
            "language_pref": "en"
        })
        assert signup_resp.status_code == 201
        data = signup_resp.json()
        assert data["user"]["role"] == "citizen"
        assert data["user"]["phone"] == "9876543219"
        assert "access_token" in data

        # Login with correct password
        login_resp = client.post("/auth/login", json={
            "phone": "9876543219",
            "password": "Password123",
            "role": "citizen"
        })
        assert login_resp.status_code == 200
        assert login_resp.json()["user"]["role"] == "citizen"

        # Login with wrong password
        wrong_login = client.post("/auth/login", json={
            "phone": "9876543219",
            "password": "WrongPassword",
            "role": "citizen"
        })
        assert wrong_login.status_code == 401

    def test_officer_signup_and_login_with_email(self, client):
        # Signup
        signup_resp = client.post("/auth/signup", json={
            "name": "Officer User",
            "email": "officer.test@crisisconnect.org",
            "password": "OfficerSecret123",
            "role": "officer"
        })
        assert signup_resp.status_code == 201
        data = signup_resp.json()
        assert data["user"]["role"] == "officer"
        assert data["user"]["email"] == "officer.test@crisisconnect.org"

        # Login with correct credentials
        login_resp = client.post("/auth/login", json={
            "email": "officer.test@crisisconnect.org",
            "password": "OfficerSecret123",
            "role": "officer"
        })
        assert login_resp.status_code == 200
        assert login_resp.json()["user"]["role"] == "officer"

    def test_volunteer_signup_and_login_with_email(self, client):
        # Signup
        signup_resp = client.post("/auth/signup", json={
            "name": "Volunteer User",
            "email": "volunteer.test@crisisconnect.org",
            "password": "VolunteerSecret123",
            "role": "volunteer"
        })
        assert signup_resp.status_code == 201
        data = signup_resp.json()
        assert data["user"]["role"] == "volunteer"

        # Login with correct credentials
        login_resp = client.post("/auth/login", json={
            "email": "volunteer.test@crisisconnect.org",
            "password": "VolunteerSecret123",
            "role": "volunteer"
        })
        assert login_resp.status_code == 200
        assert login_resp.json()["user"]["role"] == "volunteer"

    def test_duplicate_signup_rejected(self, client):
        # First signup
        client.post("/auth/signup", json={
            "name": "Original User",
            "email": "duplicate.test@crisisconnect.org",
            "password": "Password123",
            "role": "officer"
        })
        # Duplicate email
        dup_resp = client.post("/auth/signup", json={
            "name": "Imposter User",
            "email": "duplicate.test@crisisconnect.org",
            "password": "Password123",
            "role": "officer"
        })
        assert dup_resp.status_code == 400
        assert "already exists" in dup_resp.json()["detail"]


# ===========================================================================
# 4. Authorization — Role Guards
# ===========================================================================
class TestAuthorization:
    def test_unauthenticated_dispatch_returns_401(self, client, seeded_db):
        """No token → 401 on officer-only endpoint."""
        r = client.post("/dispatches", json={
            "incident_id": "nonexistent",
        })
        assert r.status_code == 401

    def test_citizen_cannot_create_dispatch(self, client, seeded_db, citizen_token):
        """Citizen JWT → 403 on officer-only dispatch endpoint."""
        r = client.post("/dispatches",
                        json={"incident_id": "nonexistent"},
                        headers={"Authorization": f"Bearer {citizen_token}"})
        assert r.status_code == 403

    def test_citizen_cannot_verify_incident(self, client, seeded_db, citizen_token):
        """Citizen JWT → 403 on officer-only verify endpoint."""
        r = client.post("/incidents/some-id/verify",
                        json={"review_state": "verified", "credibility_score": 1.0},
                        headers={"Authorization": f"Bearer {citizen_token}"})
        assert r.status_code == 403

    def test_citizen_cannot_create_alert(self, client, seeded_db, citizen_token):
        """Citizen JWT → 403 on officer-only alert endpoint."""
        r = client.post("/alerts",
                        json={"zone_id": "z1", "message_en": "test", "severity": "high"},
                        headers={"Authorization": f"Bearer {citizen_token}"})
        assert r.status_code == 403

    def test_unauthenticated_patch_dispatch_returns_401(self, client, seeded_db):
        _seed_dispatch(seeded_db, "disp-auth-1", "usr-volunteer-1")
        r = client.patch("/dispatches/disp-auth-1", json={"status": "en_route"})
        assert r.status_code == 401

    def test_citizen_cannot_patch_dispatch(self, client, seeded_db, citizen_token):
        _seed_dispatch(seeded_db, "disp-auth-1", "usr-volunteer-1")
        r = client.patch("/dispatches/disp-auth-1",
                         json={"status": "en_route"},
                         headers={"Authorization": f"Bearer {citizen_token}"})
        assert r.status_code == 403

    def test_volunteer_can_patch_own_dispatch(self, client, seeded_db, volunteer_token):
        _seed_dispatch(seeded_db, "disp-auth-own", "usr-volunteer-1")
        r = client.patch("/dispatches/disp-auth-own",
                         json={"status": "en_route"},
                         headers={"Authorization": f"Bearer {volunteer_token}"})
        assert r.status_code == 200
        assert r.json()["status"] == "en_route"

    def test_volunteer_cannot_patch_others_dispatch(self, client, seeded_db, volunteer_token):
        from app.models import User
        from app.core.security import hash_password
        other = User(
            id="usr-volunteer-2", name="Other Volunteer",
            phone="1111111113", email="volunteer2.test@crisisconnect.org",
            role="volunteer", password_hash=hash_password("TestPassword123")
        )
        seeded_db.add(other)
        seeded_db.commit()
        _seed_dispatch(seeded_db, "disp-auth-other", "usr-volunteer-2")
        r = client.patch("/dispatches/disp-auth-other",
                         json={"status": "en_route"},
                         headers={"Authorization": f"Bearer {volunteer_token}"})
        assert r.status_code == 403

    def test_officer_can_patch_dispatch(self, client, seeded_db, officer_token):
        _seed_dispatch(seeded_db, "disp-auth-off", "usr-volunteer-1")
        r = client.patch("/dispatches/disp-auth-off",
                         json={"status": "on_site"},
                         headers={"Authorization": f"Bearer {officer_token}"})
        assert r.status_code == 200
        assert r.json()["status"] == "on_site"

    def test_unauthenticated_demo_reset_returns_401(self, client, db):
        r = client.post("/demo/reset-scenario")
        assert r.status_code == 401

    def test_citizen_cannot_demo_reset(self, client, seeded_db, citizen_token):
        r = client.post("/demo/reset-scenario",
                        headers={"Authorization": f"Bearer {citizen_token}"})
        assert r.status_code == 403

    def test_officer_can_demo_reset(self, client, seeded_db, officer_token):
        r = client.post("/demo/reset-scenario",
                        headers={"Authorization": f"Bearer {officer_token}"})
        assert r.status_code == 200
        assert r.json()["status"] == "success"

    def test_admin_can_demo_reset(self, client, seeded_db):
        from app.models import User
        from app.core.security import hash_password
        seeded_db.add(User(
            id="usr-admin-1", name="Admin Test",
            email="admin.test@crisisconnect.org",
            role="admin", password_hash=hash_password("TestPassword123")
        ))
        seeded_db.commit()
        login = client.post("/auth/login", json={
            "email": "admin.test@crisisconnect.org",
            "password": "TestPassword123",
            "role": "admin",
        })
        assert login.status_code == 200
        r = client.post("/demo/reset-scenario",
                        headers={"Authorization": f"Bearer {login.json()['access_token']}"})
        assert r.status_code == 200
        assert r.json()["status"] == "success"


# ===========================================================================
# 5. Shelters
# ===========================================================================
class TestShelters:
    def test_list_shelters_uses_persisted_inventory(self, client, db):
        from app.models import Shelter

        db.add(Shelter(
            id="shelter-test-1", name="Test Shelter", lat=24.82, lng=92.79,
            capacity=100, current_occupancy=100, zone_id="z-test"
        ))
        db.commit()

        response = client.get("/shelters")

        assert response.status_code == 200
        assert response.json() == [{
            "id": "shelter-test-1",
            "name": "Test Shelter",
            "location_name": "Test Shelter",
            "lat": 24.82,
            "lng": 92.79,
            "capacity": 100,
            "current_occupancy": 100,
            "status": "full",
            "contact_number": "",
            "zone_id": "z-test",
        }]

    def test_demo_reset_seeds_india_wide_shelters(self, client, seeded_db, officer_token):
        from app.models import Shelter

        # 1. Trigger demo reset
        r = client.post("/demo/reset-scenario", headers={"Authorization": f"Bearer {officer_token}"})
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "success"
        assert body.get("shelters_seeded", 0) >= 15

        # 2. Query GET /shelters
        shelters_resp = client.get("/shelters")
        assert shelters_resp.status_code == 200
        shelters = shelters_resp.json()
        assert len(shelters) >= 15

        # 3. Validate coordinates, capacities, and occupancies
        has_open = False
        has_full = False
        lats = []
        lngs = []

        for s in shelters:
            assert s["id"]
            assert s["name"]
            # Valid coordinate ranges within India
            assert 8.0 <= s["lat"] <= 36.0, f"Lat {s['lat']} out of expected range for {s['name']}"
            assert 68.0 <= s["lng"] <= 98.0, f"Lng {s['lng']} out of expected range for {s['name']}"
            lats.append(s["lat"])
            lngs.append(s["lng"])

            # Capacity positive and occupancy <= capacity
            assert s["capacity"] > 0
            assert 0 <= s["current_occupancy"] <= s["capacity"]

            if s["status"] == "open":
                has_open = True
            elif s["status"] == "full":
                has_full = True

        # Ensure varied states exist
        assert has_open, "Expected at least one open shelter"
        assert has_full, "Expected at least one full shelter for UI demonstration"

        # 4. Multi-region coverage check
        # North (lat > 27), South (lat < 15), East/Northeast (lng > 85), West (lng < 75)
        assert any(lat > 27.0 for lat in lats), "North region not represented"
        assert any(lat < 15.0 for lat in lats), "South region not represented"
        assert any(lng > 85.0 for lng in lngs), "East/Northeast region not represented"
        assert any(lng < 75.0 for lng in lngs), "West region not represented"


# ===========================================================================
# 6. Incidents
# ===========================================================================
class TestIncidents:
    def test_create_incident(self, client, seeded_db):
        r = client.post("/incidents", json={
            "category": "rescue",
            "severity": "high",
            "description": "Flood in street",
            "lat": 24.82,
            "lng": 92.79
        })
        assert r.status_code == 200
        body = r.json()
        assert body["id"]
        assert body["category"] == "rescue"
        assert body["status"] == "reported"
        assert body["review_state"] == "unverified"
        assert body["priority_score"] > 0

    def test_incident_persists(self, client, seeded_db):
        """Created incident appears in GET /incidents."""
        client.post("/incidents", json={
            "category": "medical",
            "severity": "critical",
            "description": "Medical emergency",
            "lat": 24.82,
            "lng": 92.79
        })
        r = client.get("/incidents")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_incidents_sorted_by_priority(self, client, seeded_db):
        """GET /incidents returns highest priority first."""
        client.post("/incidents", json={"category": "rescue", "severity": "low",
                                         "description": "Low", "lat": 24.8, "lng": 92.7})
        client.post("/incidents", json={"category": "rescue", "severity": "critical",
                                         "description": "Critical", "lat": 24.8, "lng": 92.7})
        r = client.get("/incidents")
        scores = [i["priority_score"] for i in r.json()]
        assert scores == sorted(scores, reverse=True)

    @pytest.mark.parametrize("guest_id", ["usr-guest", "guest", "", "   "])
    def test_create_incident_guest_sos(self, client, seeded_db, guest_id):
        """Guest SOS with placeholder reporter_id resolves to None (NULL)."""
        r = client.post("/incidents", json={
            "category": "rescue",
            "severity": "high",
            "description": "Guest SOS flood",
            "lat": 24.82,
            "lng": 92.79,
            "reporter_id": guest_id
        })
        assert r.status_code == 200
        body = r.json()
        assert body["reporter_id"] is None

        # Verify DB persisted reporter_id = NULL
        all_incidents = client.get("/incidents").json()
        created_inc = next(i for i in all_incidents if i["id"] == body["id"])
        assert created_inc["reporter_id"] is None

    def test_create_incident_valid_citizen(self, client, seeded_db, citizen_token):
        """Valid logged-in citizen reporter_id persists correctly."""
        r = client.post("/incidents", headers={"Authorization": f"Bearer {citizen_token}"}, json={
            "category": "medical",
            "severity": "high",
            "description": "Medical emergency by valid citizen",
            "lat": 24.82,
            "lng": 92.79,
            "reporter_id": "usr-citizen-1"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["reporter_id"] == "usr-citizen-1"

    def test_create_incident_spoofed_reporter_enforces_jwt_identity(self, client, seeded_db, citizen_token):
        """When an authenticated user supplies a conflicting/spoofed reporter_id, server enforces JWT identity."""
        r = client.post("/incidents", headers={"Authorization": f"Bearer {citizen_token}"}, json={
            "category": "rescue",
            "severity": "high",
            "description": "Invalid reporter test",
            "lat": 24.82,
            "lng": 92.79,
            "reporter_id": "usr-officer-1"
        })
        assert r.status_code == 200
        assert r.json()["reporter_id"] == "usr-citizen-1"



# ===========================================================================
# 6. Dispatch — Transaction Safety
# ===========================================================================
class TestDispatch:
    def _seed_incident_and_resource(self, db):
        from app.models import Incident, Resource, Zone
        zone = Zone(id="z-test", name="Test Zone", district="Test", population_est=1000)
        db.add(zone)
        inc = Incident(
            id="inc-test-1", title="Test Inc", category="rescue", severity="high",
            description="test", lat=24.8, lng=92.7, zone_id="z-test",
            status="reported", review_state="unverified",
            credibility_score=1.0, priority_score=80.0
        )
        res = Resource(
            id="res-test-1", name="Boat", type="boat",
            quantity_available=2, unit="units", zone_id="z-test", status="available"
        )
        db.add_all([inc, res])
        db.commit()

    def test_authorized_dispatch_succeeds(self, client, seeded_db, officer_token):
        self._seed_incident_and_resource(seeded_db)
        r = client.post("/dispatches", json={
            "incident_id": "inc-test-1",
            "resource_id": "res-test-1",
            "assigned_user_id": "usr-volunteer-1",
            "eta_minutes": 10
        }, headers={"Authorization": f"Bearer {officer_token}"})
        assert r.status_code == 200
        body = r.json()
        assert body["incident_id"] == "inc-test-1"
        assert body["resource_id"] == "res-test-1"
        assert body["status"] == "pending"

    def test_dispatch_decrements_resource_quantity(self, client, seeded_db, officer_token):
        """Dispatching a resource pool item decrements quantity."""
        self._seed_incident_and_resource(seeded_db)
        client.post("/dispatches", json={
            "incident_id": "inc-test-1",
            "resource_id": "res-test-1",
            "assigned_user_id": "usr-volunteer-1"
        }, headers={"Authorization": f"Bearer {officer_token}"})
        resources = client.get("/resources").json()
        boat = next((r for r in resources if r["id"] == "res-test-1"), None)
        assert boat is not None
        assert boat["quantity_available"] == 1  # Started at 2, decremented by 1

    def test_duplicate_dispatch_on_same_incident_rejected(self, client, seeded_db, officer_token):
        """Second dispatch attempt on an already-dispatched incident is rejected."""
        self._seed_incident_and_resource(seeded_db)
        r1 = client.post("/dispatches", json={
            "incident_id": "inc-test-1",
            "resource_id": "res-test-1",
            "assigned_user_id": "usr-volunteer-1"
        }, headers={"Authorization": f"Bearer {officer_token}"})
        assert r1.status_code == 200

        r2 = client.post("/dispatches", json={
            "incident_id": "inc-test-1",
            "resource_id": "res-test-1",
            "assigned_user_id": "usr-volunteer-1"
        }, headers={"Authorization": f"Bearer {officer_token}"})
        assert r2.status_code == 400

    def test_depleted_resource_rejected(self, client, seeded_db, officer_token):
        """Resource with quantity_available=0 is rejected."""
        from app.models import Incident, Resource, Zone
        zone = Zone(id="z-test2", name="Zone2", district="D", population_est=100)
        seeded_db.add(zone)
        inc = Incident(id="inc-depl", title="T", category="rescue", severity="high",
                       description="d", lat=24.8, lng=92.7, zone_id="z-test2",
                       status="reported", review_state="unverified",
                       credibility_score=1.0, priority_score=80.0)
        res = Resource(id="res-depl", name="Empty", type="boat",
                       quantity_available=0, unit="units", zone_id="z-test2", status="depleted")
        seeded_db.add_all([inc, res])
        seeded_db.commit()

        r = client.post("/dispatches", json={
            "incident_id": "inc-depl",
            "resource_id": "res-depl",
            "assigned_user_id": "usr-volunteer-1"
        }, headers={"Authorization": f"Bearer {officer_token}"})
        assert r.status_code == 400
        assert "depleted" in r.json()["detail"].lower() or "quantity" in r.json()["detail"].lower()

    def test_nonexistent_resource_returns_404(self, client, seeded_db, officer_token):
        from app.models import Incident, Zone
        zone = Zone(id="z-test3", name="Zone3", district="D", population_est=100)
        seeded_db.add(zone)
        inc = Incident(id="inc-nr", title="T", category="rescue", severity="high",
                       description="d", lat=24.8, lng=92.7, zone_id="z-test3",
                       status="reported", review_state="unverified",
                       credibility_score=1.0, priority_score=80.0)
        seeded_db.add(inc)
        seeded_db.commit()

        r = client.post("/dispatches", json={
            "incident_id": "inc-nr",
            "resource_id": "res-does-not-exist",
            "assigned_user_id": "usr-volunteer-1"
        }, headers={"Authorization": f"Bearer {officer_token}"})
        assert r.status_code == 404


# ===========================================================================
# 7. Demo Reset — Idempotency
# ===========================================================================
class TestDemoReset:
    def _officer_auth_headers(self, client, db):
        from app.models import User
        from app.core.security import hash_password
        if not db.query(User).filter(User.email == "reset.officer@crisisconnect.org").first():
            db.add(User(
                id="usr-reset-officer",
                name="Reset Officer",
                email="reset.officer@crisisconnect.org",
                role="officer",
                password_hash=hash_password("TestPassword123"),
            ))
            db.commit()
        resp = client.post("/auth/login", json={
            "email": "reset.officer@crisisconnect.org",
            "password": "TestPassword123",
            "role": "officer",
        })
        assert resp.status_code == 200
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    def test_demo_reset_returns_success(self, client, db):
        r = client.post("/demo/reset-scenario", headers=self._officer_auth_headers(client, db))
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "success"
        assert body["zones_seeded"] == 3
        assert body["incidents_seeded"] == 2
        assert body["resources_seeded"] == 3

    def test_demo_reset_is_idempotent(self, client, db):
        """Calling reset twice should not crash or duplicate records."""
        headers = self._officer_auth_headers(client, db)
        r1 = client.post("/demo/reset-scenario", headers=headers)
        assert r1.status_code == 200
        r2 = client.post("/demo/reset-scenario", headers=headers)
        assert r2.status_code == 200
        assert r2.json()["zones_seeded"] == 3  # Same count every time

    def test_demo_reset_seeds_authorized_roles_and_allows_login(self, client, db):
        """
        Verifies that /demo/reset-scenario seeds pre-authorized officer, volunteer, and citizen accounts,
        that login for those numbers returns their proper pre-authorized roles, and that unknown numbers
        default to citizen auto-registration.
        """
        # 1. Reset scenario
        r_reset = client.post("/demo/reset-scenario", headers=self._officer_auth_headers(client, db))
        assert r_reset.status_code == 200

        # 2. Officer login (both standard demo numbers return 'officer')
        r_officer1 = client.post("/auth/login", json={"phone": "1111111110", "password": "DemoPassword123", "role": "officer"})
        assert r_officer1.status_code == 200
        assert r_officer1.json()["user"]["role"] == "officer"

        r_officer2 = client.post("/auth/login", json={"phone": "9876543210", "password": "DemoPassword123", "role": "officer"})
        assert r_officer2.status_code == 200
        assert r_officer2.json()["user"]["role"] == "officer"

        # 3. Volunteer login
        r_vol1 = client.post("/auth/login", json={"phone": "1111111111", "password": "DemoPassword123", "role": "volunteer"})
        assert r_vol1.status_code == 200
        assert r_vol1.json()["user"]["role"] == "volunteer"

        r_vol2 = client.post("/auth/login", json={"phone": "9876543211", "password": "DemoPassword123", "role": "volunteer"})
        assert r_vol2.status_code == 200
        assert r_vol2.json()["user"]["role"] == "volunteer"

        # 4. Citizen login
        r_cit1 = client.post("/auth/login", json={"phone": "1111111112", "password": "DemoPassword123", "role": "citizen"})
        assert r_cit1.status_code == 200
        assert r_cit1.json()["user"]["role"] == "citizen"

        # 5. Second reset remains idempotent
        r_officer_again = client.post("/auth/login", json={"phone": "1111111110", "password": "DemoPassword123", "role": "officer"})
        assert r_officer_again.status_code == 200
        assert r_officer_again.json()["user"]["role"] == "officer"

    def test_demo_reset_reconciles_existing_user_wrong_role_and_preserves_non_demo_users(self, client, db):
        """
        Tests the specific DEV scenario where a canonical demo phone (e.g. 1111111110) was registered
        earlier as a 'citizen' before scenario reset, and reset reconciles it to 'officer'.
        Also verifies non-demo user accounts are preserved across resets.
        """
        # 1. Signup with canonical officer phone BEFORE reset -> creates user as citizen
        r_pre = client.post("/auth/signup", json={"name": "Pre Citizen", "phone": "1111111110", "password": "DemoPassword123", "role": "citizen"})
        assert r_pre.status_code == 201
        assert r_pre.json()["user"]["role"] == "citizen"

        # 2. Signup a non-demo user
        r_non_demo = client.post("/auth/signup", json={"name": "Non Demo User", "phone": "7777777777", "password": "DemoPassword123", "role": "citizen"})
        assert r_non_demo.status_code == 201
        non_demo_id = r_non_demo.json()["user"]["id"]

        # 3. Perform demo reset (authorized officer, not the canonical phone being reconciled)
        r_reset = client.post("/demo/reset-scenario", headers=self._officer_auth_headers(client, db))
        assert r_reset.status_code == 200

        # 4. Canonical phone 1111111110 is reconciled to officer role
        r_post = client.post("/auth/login", json={"phone": "1111111110", "password": "DemoPassword123", "role": "officer"})
        assert r_post.status_code == 200
        assert r_post.json()["user"]["role"] == "officer"
        assert r_post.json()["user"]["id"] == "usr-officer-1"

        # 5. Non-demo user still exists
        r_non_demo_post = client.post("/auth/login", json={"phone": "7777777777", "password": "DemoPassword123", "role": "citizen"})
        assert r_non_demo_post.status_code == 200
        assert r_non_demo_post.json()["user"]["id"] == non_demo_id
        assert r_non_demo_post.json()["user"]["id"] == non_demo_id
        assert r_non_demo_post.json()["user"]["role"] == "citizen"


# ===========================================================================
# 8. WebSocket Event Serialization
# ===========================================================================
class TestWebSocketEvents:
    def test_ws_manager_broadcast_structure(self):
        """Verify the ConnectionManager emits properly structured JSON."""
        import asyncio
        from typing import cast
        from fastapi import WebSocket
        from app.websocket.manager import ConnectionManager

        received = []

        class MockWebSocket:
            async def send_json(self, msg):
                received.append(msg)
            async def accept(self):
                pass

        async def run():
            mgr = ConnectionManager()
            ws = cast(WebSocket, MockWebSocket())
            await mgr.connect(ws)
            await mgr.broadcast("incident.created", {"id": "abc", "severity": "critical"})

        asyncio.run(run())
        assert len(received) == 1
        msg = received[0]
        assert msg["type"] == "incident.created"
        assert msg["payload"]["id"] == "abc"
        assert "timestamp" in msg
        assert msg["timestamp"].endswith("Z")


# ===========================================================================
# 8.5 WebSocket Dashboard Authorization
# ===========================================================================
class TestWebSocketAuth:
    def _assert_rejected(self, connect_fn, expected_code=None):
        from starlette.websockets import WebSocketDisconnect
        try:
            from starlette.testclient import WebSocketDenialResponse
        except ImportError:
            WebSocketDenialResponse = None
        try:
            with connect_fn() as ws:
                ws.receive_text()
            pytest.fail("WebSocket connection should have been rejected")
        except WebSocketDisconnect as exc:
            if expected_code is not None:
                assert exc.code == expected_code
        except Exception as exc:
            if WebSocketDenialResponse is not None and isinstance(exc, WebSocketDenialResponse):
                return
            if type(exc).__name__ in ("WebSocketDisconnect", "WebSocketDenialResponse"):
                return
            raise

    def test_ws_dashboard_no_token_rejected(self, client, seeded_db):
        self._assert_rejected(lambda: client.websocket_connect("/ws/dashboard"), expected_code=4401)

    def test_ws_dashboard_invalid_token_rejected(self, client, seeded_db):
        self._assert_rejected(
            lambda: client.websocket_connect("/ws/dashboard?token=not-a-valid-jwt"),
            expected_code=4401,
        )

    def test_ws_dashboard_expired_token_rejected(self, client, seeded_db):
        import datetime
        from app.core.security import create_access_token
        expired = create_access_token(
            data={"sub": "usr-officer-1", "role": "officer"},
            expires_delta=datetime.timedelta(seconds=-30),
        )
        self._assert_rejected(
            lambda: client.websocket_connect(f"/ws/dashboard?token={expired}"),
            expected_code=4401,
        )

    def test_ws_dashboard_unauthorized_role_rejected(self, client, seeded_db):
        from app.models import User
        from app.core.security import hash_password, create_access_token
        seeded_db.add(User(
            id="usr-guest-1",
            name="Guest User",
            phone="0000000000",
            role="guest",
            password_hash=hash_password("TestPassword123"),
        ))
        seeded_db.commit()
        token = create_access_token(data={"sub": "usr-guest-1", "role": "guest"})
        self._assert_rejected(
            lambda: client.websocket_connect(f"/ws/dashboard?token={token}"),
            expected_code=4403,
        )

    def test_ws_dashboard_authorized_officer_connects(self, client, seeded_db, officer_token):
        with client.websocket_connect(f"/ws/dashboard?token={officer_token}") as ws:
            ws.send_text("ping")
            assert ws.receive_text() == "ACK:ping"

    def test_ws_dashboard_authorized_citizen_connects(self, client, seeded_db, citizen_token):
        with client.websocket_connect(f"/ws/dashboard?token={citizen_token}") as ws:
            ws.send_text("hello")
            assert ws.receive_text() == "ACK:hello"

    def test_ws_dashboard_authorized_volunteer_connects(self, client, seeded_db, volunteer_token):
        with client.websocket_connect(
            "/ws/dashboard",
            headers={"Authorization": f"Bearer {volunteer_token}"},
        ) as ws:
            ws.send_text("sync")
            assert ws.receive_text() == "ACK:sync"


# ===========================================================================
# 9. Spatial Columns Mapping (PostGIS Foundation)
# ===========================================================================
class TestSpatialColumns:
    def test_spatial_columns_mapping_in_db(self, db):
        """
        Verify that Zone, Incident, and RescueSite hold the added geom column
        and can be written to and queried.
        """
        from app.models import Zone, Incident, RescueSite

        # 1. Create a zone with polygon spatial string (mocked on SQLite)
        zone = Zone(
            id="z-spatial-test",
            name="Spatial Zone",
            district="Cachar",
            population_est=1000,
            geom="POLYGON((92.7 24.8, 92.8 24.8, 92.8 24.9, 92.7 24.9, 92.7 24.8))"
        )
        db.add(zone)

        # 2. Create an incident with point spatial string
        inc = Incident(
            id="inc-spatial-test",
            category="rescue",
            severity="high",
            description="flood",
            lat=24.85,
            lng=92.75,
            geom="POINT(92.75 24.85)"
        )
        db.add(inc)

        # 3. Create a rescue site with point spatial string
        site = RescueSite(
            id="site-spatial-test",
            name="Spatial School",
            lat=24.86,
            lng=92.76,
            geom="POINT(92.76 24.86)"
        )
        db.add(site)

        db.commit()

        # 4. Query back and verify geom values are successfully mapped
        q_zone = db.query(Zone).filter(Zone.id == "z-spatial-test").first()
        assert q_zone.geom == "POLYGON((92.7 24.8, 92.8 24.8, 92.8 24.9, 92.7 24.9, 92.7 24.8))"

        q_inc = db.query(Incident).filter(Incident.id == "inc-spatial-test").first()
        assert q_inc.geom == "POINT(92.75 24.85)"

        q_site = db.query(RescueSite).filter(RescueSite.id == "site-spatial-test").first()
        assert q_site.geom == "POINT(92.76 24.86)"
