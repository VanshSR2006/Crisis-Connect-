# TEAM OWNERSHIP: MEMBER 3 — BACKEND + DATABASE + SECURITY + REALTIME
# All SQLAlchemy ORM models live here. Coordinate before adding or altering any model.
# Model field changes affect the database schema and all API responses.
import uuid
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database.base import Base

from sqlalchemy.types import UserDefinedType
from sqlalchemy.ext.compiler import compiles

class Geometry(UserDefinedType):
    def __init__(self, geometry_type='POINT', srid=4326):
        self.geometry_type = geometry_type.upper()
        self.srid = srid

    def get_col_spec(self, **kw):
        return f"geometry({self.geometry_type},{self.srid})"

@compiles(Geometry, 'postgresql')
def compile_geometry_postgres(type_, compiler, **kw):
    return f"geometry({type_.geometry_type},{type_.srid})"

@compiles(Geometry, 'sqlite')
def compile_geometry_sqlite(type_, compiler, **kw):
    return "TEXT"

@compiles(Geometry)
def compile_geometry_default(type_, compiler, **kw):
    return "TEXT"

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False) # citizen | volunteer | officer | admin
    language_pref: Mapped[str] = mapped_column(String, default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    district: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    boundary_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # GeoJSON polygon string
    population_est: Mapped[int] = mapped_column(Integer, default=0)
    geom: Mapped[Any] = mapped_column(Geometry('POLYGON', 4326), nullable=True)

class WeatherReading(Base):
    __tablename__ = "weather_readings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"), nullable=True)
    rainfall_mm: Mapped[float] = mapped_column(Float, default=0.0)
    river_level_m: Mapped[float] = mapped_column(Float, default=0.0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"), nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String, nullable=True) # low | medium | high | critical
    score: Mapped[float] = mapped_column(Float, default=0.0)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    reporter_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String, nullable=False) # rescue | medical | food | shelter | water | other
    severity: Mapped[str] = mapped_column(String, nullable=False) # low | medium | high | critical
    status: Mapped[str] = mapped_column(String, default="reported") # reported | acknowledged | dispatched | resolved
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    geom: Mapped[Any] = mapped_column(Geometry('POINT', 4326), nullable=True)
    credibility_score: Mapped[float] = mapped_column(Float, default=1.0)
    review_state: Mapped[str] = mapped_column(String, default="unverified") # unverified | flagged | verified
    priority_score: Mapped[float] = mapped_column(Float, default=50.0)
    # Optional reporter-provided context used to help responders triage an SOS.
    vulnerability_context: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class Shelter(Base):
    __tablename__ = "shelters"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=100)
    current_occupancy: Mapped[int] = mapped_column(Integer, default=0)
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"), nullable=True)

class RescueSite(Base):
    __tablename__ = "rescue_sites"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    shelter_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("shelters.id"), nullable=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    geom: Mapped[Any] = mapped_column(Geometry('POINT', 4326), nullable=True)
    elevation_m: Mapped[float] = mapped_column(Float, default=10.0)
    predicted_flood_margin_m: Mapped[float] = mapped_column(Float, default=2.0)
    capacity: Mapped[int] = mapped_column(Integer, default=500)
    current_occupancy: Mapped[int] = mapped_column(Integer, default=0)
    access_status: Mapped[str] = mapped_column(String, default="accessible") # accessible | limited | blocked
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"), nullable=True)

class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False) # boat | medical_kit | food_packet | vehicle | personnel
    quantity_available: Mapped[int] = mapped_column(Integer, default=10)
    unit: Mapped[str] = mapped_column(String, default="units")
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"), nullable=True)
    status: Mapped[str] = mapped_column(String, default="available") # available | reserved | dispatched | depleted

class Dispatch(Base):
    __tablename__ = "dispatches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    incident_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("incidents.id"), nullable=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("resources.id"), nullable=True)
    assigned_user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending") # pending | en_route | on_site | completed
    eta_minutes: Mapped[int] = mapped_column(Integer, default=15)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dispatched_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"), nullable=True)
    message_en: Mapped[str] = mapped_column(Text, nullable=False)
    message_translated: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    severity: Mapped[str] = mapped_column(String, default="medium")
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class PopulationProfile(Base):
    __tablename__ = "population_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"), nullable=True)
    population_est: Mapped[int] = mapped_column(Integer, default=1000)
    households_est: Mapped[int] = mapped_column(Integer, default=250)
    vulnerability_index: Mapped[float] = mapped_column(Float, default=0.5) # 0.0 to 1.0
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"), nullable=True)
    resource_type: Mapped[str] = mapped_column(String, nullable=False) # food | water | medical_kit | sanitation_kit
    quantity_needed: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[float] = mapped_column(Float, default=0.85)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
