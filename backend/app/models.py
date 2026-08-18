import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=True)
    role = Column(String, nullable=False) # citizen | volunteer | officer | admin
    language_pref = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

class Zone(Base):
    __tablename__ = "zones"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    district = Column(String, nullable=True)
    boundary_json = Column(Text, nullable=True) # GeoJSON polygon string
    population_est = Column(Integer, default=0)

class WeatherReading(Base):
    __tablename__ = "weather_readings"

    id = Column(String, primary_key=True, default=generate_uuid)
    zone_id = Column(String, ForeignKey("zones.id"))
    rainfall_mm = Column(Float, default=0.0)
    river_level_m = Column(Float, default=0.0)
    recorded_at = Column(DateTime, default=datetime.utcnow)

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(String, primary_key=True, default=generate_uuid)
    zone_id = Column(String, ForeignKey("zones.id"))
    risk_level = Column(String) # low | medium | high | critical
    score = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=generate_uuid)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=True)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=True)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False) # rescue | medical | food | shelter | water | other
    severity = Column(String, nullable=False) # low | medium | high | critical
    status = Column(String, default="reported") # reported | acknowledged | dispatched | resolved
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    credibility_score = Column(Float, default=1.0)
    review_state = Column(String, default="unverified") # unverified | flagged | verified
    priority_score = Column(Float, default=50.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    capacity = Column(Integer, default=100)
    current_occupancy = Column(Integer, default=0)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=True)

class RescueSite(Base):
    __tablename__ = "rescue_sites"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    shelter_id = Column(String, ForeignKey("shelters.id"), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    elevation_m = Column(Float, default=10.0)
    predicted_flood_margin_m = Column(Float, default=2.0)
    capacity = Column(Integer, default=500)
    current_occupancy = Column(Integer, default=0)
    access_status = Column(String, default="accessible") # accessible | limited | blocked
    zone_id = Column(String, ForeignKey("zones.id"), nullable=True)

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # boat | medical_kit | food_packet | vehicle | personnel
    quantity_available = Column(Integer, default=10)
    unit = Column(String, default="units")
    zone_id = Column(String, ForeignKey("zones.id"), nullable=True)
    status = Column(String, default="available") # available | reserved | dispatched | depleted

class Dispatch(Base):
    __tablename__ = "dispatches"

    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"))
    resource_id = Column(String, ForeignKey("resources.id"), nullable=True)
    assigned_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="pending") # pending | en_route | on_site | completed
    eta_minutes = Column(Integer, default=15)
    notes = Column(Text, nullable=True)
    dispatched_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=True)
    message_en = Column(Text, nullable=False)
    message_translated = Column(JSON, nullable=True)
    severity = Column(String, default="medium")
    issued_at = Column(DateTime, default=datetime.utcnow)

class PopulationProfile(Base):
    __tablename__ = "population_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    zone_id = Column(String, ForeignKey("zones.id"))
    population_est = Column(Integer, default=1000)
    households_est = Column(Integer, default=250)
    vulnerability_index = Column(Float, default=0.5) # 0.0 to 1.0
    updated_at = Column(DateTime, default=datetime.utcnow)

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(String, primary_key=True, default=generate_uuid)
    zone_id = Column(String, ForeignKey("zones.id"))
    resource_type = Column(String, nullable=False) # food | water | medical_kit | sanitation_kit
    quantity_needed = Column(Integer, default=0)
    confidence = Column(Float, default=0.85)
    computed_at = Column(DateTime, default=datetime.utcnow)
