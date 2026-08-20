"""
Crisis Connect Backend — P0 Tests
Member 3 — Backend + Database + Security + Realtime

Run with:
  cd backend
  python -m pytest tests/ -v

Uses in-memory SQLite for isolation (no production DB needed).
"""
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

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
    officer = User(id="usr-officer-1", name="Officer Test", phone="1111111110", role="officer")
    volunteer = User(id="usr-volunteer-1", name="Volunteer Test", phone="1111111111", role="volunteer")
    citizen = User(id="usr-citizen-1", name="Citizen Test", phone="1111111112", role="citizen")
    db.add_all([officer, volunteer, citizen])
    db.commit()
    return db


@pytest.fixture
def officer_token(seeded_db, client):
    """Get a JWT token for the pre-seeded officer."""
    resp = client.post("/auth/login", json={"phone": "1111111110"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture
def citizen_token(seeded_db, client):
    """Get a JWT token for the pre-seeded citizen."""
    resp = client.post("/auth/login", json={"phone": "1111111112"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


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
# 3. Authentication — Login
# ===========================================================================
class TestLogin:
    def test_new_citizen_auto_created(self, client, db):
        """A new phone number gets auto-registered as citizen."""
        r = client.post("/auth/login", json={"phone": "9999999990"})
        assert r.status_code == 200
        body = r.json()
        assert body["access_token"]
        assert body["token_type"] == "bearer"
        assert body["user"]["role"] == "citizen"
        assert body["user"]["phone"] == "9999999990"

    def test_existing_officer_login_preserves_role(self, seeded_db, client):
        """Pre-seeded officer gets back officer role — role NOT changeable by client."""
        r = client.post("/auth/login", json={"phone": "1111111110"})
        assert r.status_code == 200
        body = r.json()
        assert body["user"]["role"] == "officer"

    def test_login_missing_phone_returns_422(self, client):
        """Missing required field returns validation error."""
        r = client.post("/auth/login", json={})
        assert r.status_code == 422

    def test_client_cannot_self_assign_officer_role(self, client, db):
        """
        The login endpoint ONLY accepts phone. The role is ALWAYS resolved from DB.
        A brand-new phone cannot be an officer even if the client tried.
        """
        # New phone → always citizen regardless of what attacker sends
        r = client.post("/auth/login", json={"phone": "8888888880"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "citizen"


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


# ===========================================================================
# 5. Incidents
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
    def test_demo_reset_returns_success(self, client, db):
        r = client.post("/demo/reset-scenario")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "success"
        assert body["zones_seeded"] == 3
        assert body["incidents_seeded"] == 2
        assert body["resources_seeded"] == 3

    def test_demo_reset_is_idempotent(self, client, db):
        """Calling reset twice should not crash or duplicate records."""
        r1 = client.post("/demo/reset-scenario")
        assert r1.status_code == 200
        r2 = client.post("/demo/reset-scenario")
        assert r2.status_code == 200
        assert r2.json()["zones_seeded"] == 3  # Same count every time

    def test_demo_reset_seeds_authorized_roles_and_allows_login(self, client, db):
        """
        Verifies that /demo/reset-scenario seeds pre-authorized officer, volunteer, and citizen accounts,
        that login for those numbers returns their proper pre-authorized roles, and that unknown numbers
        default to citizen auto-registration.
        """
        # 1. Reset scenario
        r_reset = client.post("/demo/reset-scenario")
        assert r_reset.status_code == 200

        # 2. Officer login (both standard demo numbers return 'officer')
        r_officer1 = client.post("/auth/login", json={"phone": "1111111110"})
        assert r_officer1.status_code == 200
        assert r_officer1.json()["user"]["role"] == "officer"

        r_officer2 = client.post("/auth/login", json={"phone": "9876543210"})
        assert r_officer2.status_code == 200
        assert r_officer2.json()["user"]["role"] == "officer"

        # 3. Volunteer login
        r_vol1 = client.post("/auth/login", json={"phone": "1111111111"})
        assert r_vol1.status_code == 200
        assert r_vol1.json()["user"]["role"] == "volunteer"

        r_vol2 = client.post("/auth/login", json={"phone": "9876543211"})
        assert r_vol2.status_code == 200
        assert r_vol2.json()["user"]["role"] == "volunteer"

        # 4. Unknown phone auto-registers as citizen
        r_unk = client.post("/auth/login", json={"phone": "5555555555"})
        assert r_unk.status_code == 200
        assert r_unk.json()["user"]["role"] == "citizen"

        # 5. Second reset remains idempotent
        r_reset2 = client.post("/demo/reset-scenario")
        assert r_reset2.status_code == 200
        r_officer_again = client.post("/auth/login", json={"phone": "1111111110"})
        assert r_officer_again.status_code == 200
        assert r_officer_again.json()["user"]["role"] == "officer"


# ===========================================================================
# 8. WebSocket Event Serialization
# ===========================================================================
class TestWebSocketEvents:
    def test_ws_manager_broadcast_structure(self):
        """Verify the ConnectionManager emits properly structured JSON."""
        import asyncio
        from app.websocket.manager import ConnectionManager

        received = []

        class MockWebSocket:
            async def send_json(self, msg):
                received.append(msg)
            async def accept(self):
                pass

        async def run():
            mgr = ConnectionManager()
            ws = MockWebSocket()
            await mgr.connect(ws)
            await mgr.broadcast("incident.created", {"id": "abc", "severity": "critical"})

        asyncio.run(run())
        assert len(received) == 1
        msg = received[0]
        assert msg["type"] == "incident.created"
        assert msg["payload"]["id"] == "abc"
        assert "timestamp" in msg
        assert msg["timestamp"].endswith("Z")
