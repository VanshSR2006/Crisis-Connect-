from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models to ensure they are registered on Base.metadata for Alembic migrations
from ..models import (
    User, Zone, WeatherReading, RiskScore, Incident,
    Shelter, RescueSite, Resource, Dispatch, Alert,
    PopulationProfile, DemandForecast
)
