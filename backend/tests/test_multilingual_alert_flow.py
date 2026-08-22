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

def test_multilingual_alert_creation_and_fallback(client, db):
    from app.models import User
    officer = User(id="usr-officer-1", name="Officer Test", phone="1111111110", role="officer")
    db.add(officer)
    db.commit()

    token_resp = client.post("/auth/login", json={"phone": "1111111110"})
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test POST /alerts with explicit multilingual translations (hi, ka)
    alert_resp = client.post("/alerts", headers=headers, json={
        "zone_id": "z-silchar",
        "message_en": "Flash flood warning issued for Assam valley.",
        "message_translated": {
          "hi": "असम घाटी के लिए अचानक बाढ़ की चेतावनी जारी की गई।",
          "ka": "ಅಸ್ಸಾಂ ಕಣಿವೆಗೆ ತೀವ್ರ ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ."
        },
        "severity": "critical"
    })
    assert alert_resp.status_code == 200
    data = alert_resp.json()
    assert data["message_en"] == "Flash flood warning issued for Assam valley."
    assert data["message_translated"]["hi"] == "असम घाटी के लिए अचानक बाढ़ की चेतावनी जारी की गई।"
    assert data["message_translated"]["ka"] == "ಅಸ್ಸಾಂ ಕಣಿವೆಗೆ ತೀವ್ರ ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ."

    # 2. Test translation provider failure simulation (message_translated is null/omitted)
    alert_fail_resp = client.post("/alerts", headers=headers, json={
        "zone_id": "z-silchar",
        "message_en": "Evacuation order active.",
        "message_translated": None,
        "severity": "high"
    })
    assert alert_fail_resp.status_code == 200
    data_fail = alert_fail_resp.json()
    # Backend falls back cleanly without crashing
    assert data_fail["message_en"] == "Evacuation order active."
    assert "hi" in data_fail["message_translated"]
    assert "ka" in data_fail["message_translated"]
