"""
Crisis Connect Backend — M4 Intelligence Tests
Member 4 — AI / Data / Intelligence

Covers backend/app/services/risk_service.py::get_zone_risk_snapshot().

Run with:
  cd backend
  python -m pytest tests/test_intelligence.py -v

Uses its own in-memory SQLite database, following the same pattern as
tests/test_backend.py (Member 3), kept in a separate module/engine so
this file does not modify or depend on the existing M3 test file.
"""
import os
import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("FRONTEND_ORIGINS", "http://localhost:3000,http://localhost:5173")

TEST_DB_URL = "sqlite://"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create tables in this module's own in-memory database once per session."""
    from app.database.base import Base
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


@pytest.fixture(scope="function")
def db():
    """Fresh transaction-rolled-back DB session per test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


# ===========================================================================
# get_zone_risk_snapshot
# ===========================================================================
class TestZoneRiskSnapshot:
    def test_computed_risk_with_weather_reading(self, db):
        from app.models import Zone, WeatherReading
        from app.services.risk_service import get_zone_risk_snapshot

        zone = Zone(id="z-intel-1", name="Intel Zone 1", district="Test", population_est=5000)
        db.add(zone)
        db.add(WeatherReading(zone_id="z-intel-1", rainfall_mm=140.0, river_level_m=4.8))
        db.commit()

        result = get_zone_risk_snapshot("z-intel-1", db)

        assert result["source"] == "computed"
        assert 0.0 <= result["risk_score"] <= 1.0
        assert result["risk_level"] in ("low", "medium", "high", "critical")
        assert result["vulnerability_index"] == 0.5  # no PopulationProfile seeded -> default
        assert "WeatherReading" in result["reason"]

    def test_latest_weather_reading_is_selected(self, db):
        """When multiple readings exist for a zone, the most recent by recorded_at wins."""
        from app.models import Zone, WeatherReading
        from app.services.risk_service import get_zone_risk_snapshot

        zone = Zone(id="z-intel-2", name="Intel Zone 2", district="Test", population_est=5000)
        db.add(zone)
        old_reading = WeatherReading(
            zone_id="z-intel-2", rainfall_mm=5.0, river_level_m=0.5,
            recorded_at=datetime.utcnow() - timedelta(hours=6),
        )
        latest_reading = WeatherReading(
            zone_id="z-intel-2", rainfall_mm=200.0, river_level_m=5.8,
            recorded_at=datetime.utcnow(),
        )
        db.add_all([old_reading, latest_reading])
        db.commit()

        result = get_zone_risk_snapshot("z-intel-2", db)

        assert result["source"] == "computed"
        # The latest (high rainfall/river level) reading should push risk toward critical,
        # not the old low-rainfall reading.
        assert result["risk_level"] == "critical"

    def test_risk_score_is_persisted(self, db):
        from app.models import Zone, WeatherReading, RiskScore
        from app.services.risk_service import get_zone_risk_snapshot

        zone = Zone(id="z-intel-3", name="Intel Zone 3", district="Test", population_est=5000)
        db.add(zone)
        db.add(WeatherReading(zone_id="z-intel-3", rainfall_mm=90.0, river_level_m=4.2))
        db.commit()

        before_count = db.query(RiskScore).filter(RiskScore.zone_id == "z-intel-3").count()
        result = get_zone_risk_snapshot("z-intel-3", db)
        after_count = db.query(RiskScore).filter(RiskScore.zone_id == "z-intel-3").count()

        assert after_count == before_count + 1
        persisted = (
            db.query(RiskScore)
            .filter(RiskScore.zone_id == "z-intel-3")
            .order_by(RiskScore.computed_at.desc())
            .first()
        )
        assert persisted is not None
        assert persisted.score == result["risk_score"]
        assert persisted.risk_level == result["risk_level"]

    def test_population_vulnerability_is_returned(self, db):
        from app.models import Zone, WeatherReading, PopulationProfile
        from app.services.risk_service import get_zone_risk_snapshot

        zone = Zone(id="z-intel-4", name="Intel Zone 4", district="Test", population_est=8000)
        db.add(zone)
        db.add(WeatherReading(zone_id="z-intel-4", rainfall_mm=45.0, river_level_m=2.1))
        db.add(PopulationProfile(
            zone_id="z-intel-4", population_est=8000, households_est=2000, vulnerability_index=0.77,
        ))
        db.commit()

        result = get_zone_risk_snapshot("z-intel-4", db)

        assert result["vulnerability_index"] == 0.77

    def test_missing_weather_gives_fallback_no_weather(self, db):
        from app.models import Zone
        from app.services.risk_service import get_zone_risk_snapshot

        zone = Zone(id="z-intel-5", name="Intel Zone 5", district="Test", population_est=3000)
        db.add(zone)
        db.commit()

        result = get_zone_risk_snapshot("z-intel-5", db)

        assert result["source"] == "fallback_no_weather"
        assert result["risk_score"] == 0.5
        assert result["risk_level"] == "medium"
        assert result["vulnerability_index"] == 0.5

    def test_missing_zone_gives_fallback_no_zone(self, db):
        from app.services.risk_service import get_zone_risk_snapshot

        # No Zone row created at all for this id.
        result = get_zone_risk_snapshot("z-does-not-exist", db)

        assert result["source"] == "fallback_no_zone"
        assert result["risk_score"] == 0.5
        assert result["risk_level"] == "medium"
        assert result["vulnerability_index"] == 0.5

    def test_return_shape_has_no_internal_types(self, db):
        """Return value must be plain JSON-safe types only (no ORM/numpy/sklearn objects)."""
        from app.models import Zone, WeatherReading
        from app.services.risk_service import get_zone_risk_snapshot

        zone = Zone(id="z-intel-6", name="Intel Zone 6", district="Test", population_est=5000)
        db.add(zone)
        db.add(WeatherReading(zone_id="z-intel-6", rainfall_mm=60.0, river_level_m=3.5))
        db.commit()

        result = get_zone_risk_snapshot("z-intel-6", db)

        assert set(result.keys()) == {
            "risk_score", "risk_level", "vulnerability_index", "source", "reason",
        }
        assert isinstance(result["risk_score"], float)
        assert isinstance(result["risk_level"], str)
        assert isinstance(result["vulnerability_index"], float)
        assert isinstance(result["source"], str)
        assert isinstance(result["reason"], str)


class TestRiskEndpoints:
    def test_get_risk_zones_returns_environmental_inputs(self, db):
        from fastapi.testclient import TestClient
        from app.main import app
        from app.database import get_db
        from app.models import Zone, WeatherReading, RiskScore

        zone = Zone(id="z-env-1", name="Env Zone 1", district="Test", population_est=4000)
        reading = WeatherReading(zone_id="z-env-1", rainfall_mm=140.0, river_level_m=4.8)
        score = RiskScore(id="rs-env-1", zone_id="z-env-1", risk_level="critical", score=0.88)
        db.add_all([zone, reading, score])
        db.commit()

        def override_get_db():
            try:
                yield db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db
        with TestClient(app, raise_server_exceptions=False) as client:
            resp = client.get("/risk/zones")
            assert resp.status_code == 200
            data = resp.json()
            matching = next((item for item in data if item["zone_id"] == "z-env-1"), None)
            assert matching is not None
            assert matching["score"] == 0.88
            assert matching["rainfall_mm"] == 140.0
            assert matching["river_level_m"] == 4.8
            assert matching["elevation_m"] == 20.0
            assert matching["soil_saturation"] == 0.5
        app.dependency_overrides.clear()
