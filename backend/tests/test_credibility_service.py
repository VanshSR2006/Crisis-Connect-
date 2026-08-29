"""
Crisis Connect Backend — M4 Credibility Intelligence Tests

Covers:
- coordinate inconsistency
- duplicate/similar SOS detection
- normal SOS remaining credible
- suspicious SOS being flagged instead of deleted
"""

import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://localhost:5173",
)

TEST_DB_URL = "sqlite://"

test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    from app.database.base import Base

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


class TestIncidentCredibility:

    def test_normal_incident_is_verified(self, db):
        from app.models import Incident, Zone
        from app.services.credibility_service import (
            calculate_incident_credibility,
        )

        zone = Zone(
            id="z-cred-1",
            name="Credibility Zone 1",
            district="Test",
            population_est=5000,
        )

        incident = Incident(
            id="inc-cred-1",
            zone_id="z-cred-1",
            category="medical",
            severity="high",
            description="Medical emergency reported at the community centre.",
            lat=24.8333,
            lng=92.7789,
        )

        db.add_all([zone, incident])
        db.commit()

        result = calculate_incident_credibility(
            incident,
            db,
        )

        assert result["suspicious"] is False
        assert result["review_state"] == "verified"
        assert result["credibility_score"] == 1.0
        assert result["signals"]["duplicates"] == []

    def test_duplicate_incident_is_flagged(self, db):
        from app.models import Incident, Zone
        from app.services.credibility_service import (
            calculate_incident_credibility,
        )

        zone = Zone(
            id="z-cred-2",
            name="Credibility Zone 2",
            district="Test",
            population_est=5000,
        )

        original = Incident(
            id="inc-cred-2-original",
            zone_id="z-cred-2",
            category="medical",
            severity="high",
            description="Medical emergency reported near the community centre.",
            lat=24.8333,
            lng=92.7789,
        )

        duplicate = Incident(
            id="inc-cred-2-duplicate",
            zone_id="z-cred-2",
            category="medical",
            severity="high",
            description="Medical emergency reported near the community centre.",
            lat=24.8334,
            lng=92.7790,
        )

        db.add_all([zone, original, duplicate])
        db.commit()

        result = calculate_incident_credibility(
            duplicate,
            db,
        )

        assert result["suspicious"] is True
        assert result["review_state"] == "flagged"
        assert result["credibility_score"] < 1.0
        assert len(result["signals"]["duplicates"]) >= 1

    def test_coordinate_inconsistency_is_flagged(self, db):
        from app.models import Incident, Zone
        from app.services.credibility_service import (
            calculate_incident_credibility,
        )

        zone = Zone(
            id="z-cred-3",
            name="Credibility Zone 3",
            district="Test",
            population_est=5000,
            boundary_json=(
                '{"type":"Polygon","coordinates":['
                '[[92.77,24.82],[92.79,24.82],'
                '[92.79,24.84],[92.77,24.84],'
                '[92.77,24.82]]]}'
            ),
        )

        incident = Incident(
            id="inc-cred-3",
            zone_id="z-cred-3",
            category="rescue",
            severity="high",
            description="Rescue assistance required at the reported location.",
            lat=24.90,
            lng=92.90,
        )

        db.add_all([zone, incident])
        db.commit()

        result = calculate_incident_credibility(
            incident,
            db,
        )

        assert result["suspicious"] is True
        assert result["review_state"] == "flagged"
        assert (
            result["signals"]["coordinate"]["reason"]
            == "coordinate_outside_zone"
        )

    def test_suspicious_incident_is_not_deleted(self, db):
        from app.models import Incident, Zone
        from app.services.credibility_service import (
            calculate_incident_credibility,
        )

        zone = Zone(
            id="z-cred-4",
            name="Credibility Zone 4",
            district="Test",
            population_est=5000,
        )

        incident = Incident(
            id="inc-cred-4",
            zone_id="z-cred-4",
            category="rescue",
            severity="critical",
            description="",
            lat=24.8333,
            lng=92.7789,
        )

        db.add_all([zone, incident])
        db.commit()

        result = calculate_incident_credibility(
            incident,
            db,
        )

        assert result["suspicious"] is True
        assert result["review_state"] == "flagged"

        # The service only evaluates the incident.
        # It must not delete it.
        stored = (
            db.query(Incident)
            .filter(Incident.id == "inc-cred-4")
            .first()
        )

        assert stored is not None