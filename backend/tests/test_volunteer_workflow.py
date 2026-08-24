import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

TEST_DB_URL = "sqlite://"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from app.database.base import Base
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db):
    from app.main import app
    from app.database import get_db

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_volunteer_workflow_status_progression(client, db):
    # 1. Seed officer, volunteer, and citizen users into test DB
    from app.models import User
    from app.core.security import hash_password
    pwd = hash_password("DemoPassword123")
    officer = User(id="usr-officer-1", name="Command Officer", phone="1111111110", role="officer", password_hash=pwd)
    volunteer = User(id="usr-volunteer-1", name="Volunteer Alpha", phone="1111111111", role="volunteer", password_hash=pwd)
    citizen = User(id="usr-citizen-1", name="Citizen John", phone="1111111112", role="citizen", password_hash=pwd)
    db.add_all([officer, volunteer, citizen])
    db.commit()

    # 2. Create incident via POST /incidents
    inc_resp = client.post("/incidents", json={
        "category": "rescue",
        "severity": "critical",
        "description": "Trapped in flood waters near Silchar",
        "lat": 24.82,
        "lng": 92.79,
        "title": "Emergency Rescue Needed",
        "reporter_id": "usr-citizen-1"
    })
    assert inc_resp.status_code == 200
    incident_data = inc_resp.json()
    incident_id = incident_data["id"]
    assert incident_data["status"] == "reported"

    # Get officer token
    token_resp = client.post("/auth/login", json={"phone": "1111111110", "password": "DemoPassword123", "role": "officer"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create dispatch via POST /dispatches
    dispatch_resp = client.post("/dispatches", headers=headers, json={
        "incident_id": incident_id,
        "assigned_user_id": "usr-volunteer-1",
        "notes": "Field team dispatched"
    })
    assert dispatch_resp.status_code == 200
    dispatch_data = dispatch_resp.json()
    dispatch_id = dispatch_data["id"]
    assert dispatch_data["status"] == "pending"

    # The dispatch endpoint persists the canonical Incident.status value.
    incident_after_dispatch = client.get("/incidents")
    assert next(i for i in incident_after_dispatch.json() if i["id"] == incident_id)["status"] == "dispatched"

    # Verify GET /dispatches lists the created dispatch
    list_resp = client.get("/dispatches")
    assert list_resp.status_code == 200
    dispatches = list_resp.json()
    assert any(d["id"] == dispatch_id for d in dispatches)

    # Volunteer token for assignment updates
    vol_token_resp = client.post("/auth/login", json={"phone": "1111111111", "password": "DemoPassword123", "role": "volunteer"})
    vol_headers = {"Authorization": f"Bearer {vol_token_resp.json()['access_token']}"}

    # 4. Progress status to 'on_site' (Mark Arrived) via PATCH /dispatches/{dispatch_id}
    patch_arrived = client.patch(f"/dispatches/{dispatch_id}", json={"status": "on_site"}, headers=vol_headers)
    assert patch_arrived.status_code == 200
    assert patch_arrived.json()["status"] == "on_site"

    # Verify incident status synchronized to 'arrived'
    inc_check = client.get("/incidents")
    inc_obj = next(i for i in inc_check.json() if i["id"] == incident_id)
    assert inc_obj["status"] == "arrived"

    # 5. Progress status to 'completed' (Mark Resolved) via PATCH /dispatches/{dispatch_id}
    patch_resolved = client.patch(f"/dispatches/{dispatch_id}", json={"status": "completed"}, headers=vol_headers)
    assert patch_resolved.status_code == 200
    assert patch_resolved.json()["status"] == "completed"

    # Verify incident status synchronized to 'resolved'
    inc_check2 = client.get("/incidents")
    inc_obj2 = next(i for i in inc_check2.json() if i["id"] == incident_id)
    assert inc_obj2["status"] == "resolved"
