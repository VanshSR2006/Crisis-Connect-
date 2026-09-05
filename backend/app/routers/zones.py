from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from ..database import get_db
from ..models import Zone, PopulationProfile, DemandForecast
from ..services.demand_service import calculate_demographic_demand
from ..services.shortage_service import calculate_zone_shortages

router = APIRouter(prefix="/zones", tags=["Zones"])

class ZoneResponse(BaseModel):
    id: str
    name: str
    district: str | None
    boundary_json: str | None
    population_est: int

    model_config = ConfigDict(from_attributes=True)

class PopulationProfileResponse(BaseModel):
    zone_id: str
    population_est: int
    households_est: int
    vulnerability_index: float
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DemandDetails(BaseModel):
    food_packets: int
    drinking_water_liters: int
    medical_kits: int
    sanitation_kits: int
    population: int
    households: int
    vulnerability_index: float

class ShortageItem(BaseModel):
    resource_type: str
    required: int
    available: int
    shortage: int
    status: str
    reorder_required: bool

class DemandResponse(BaseModel):
    zone_id: str
    demand: DemandDetails
    total_shortage: int
    shortages: List[ShortageItem]

@router.get("", response_model=List[ZoneResponse])
def list_zones(db: Session = Depends(get_db)):
    return db.query(Zone).all()

@router.get("/{id}/population", response_model=PopulationProfileResponse)
def get_zone_population(id: str, db: Session = Depends(get_db)):
    """
    Returns population demographics profile for a specific zone.
    """
    profile = db.query(PopulationProfile).filter(PopulationProfile.zone_id == id).first()
    if not profile:
        zone = db.query(Zone).filter(Zone.id == id).first()
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        pop = zone.population_est
        return {
            "zone_id": id,
            "population_est": pop,
            "households_est": int(pop / 4),
            "vulnerability_index": 0.5,
            "updated_at": datetime.now(timezone.utc)
        }
    return profile

@router.get("/{id}/demand", response_model=DemandResponse)
def get_zone_demand(id: str, db: Session = Depends(get_db)):
    """
    Calculates demographic demand, persists demand forecasts,
    and compares demand against available resources.
    """
    zone = db.query(Zone).filter(Zone.id == id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    pop_profile = db.query(PopulationProfile).filter(PopulationProfile.zone_id == id).first()
    pop = zone.population_est
    households = pop_profile.households_est if pop_profile else int(pop / 4)
    vulnerability = pop_profile.vulnerability_index if pop_profile else 0.65

    # Calculate demographic demand
    demand = calculate_demographic_demand(pop, households, vulnerability)

    # Map demand to resource inventory types
    forecast_data = {
        "food_packet": demand["food_packets"],
        "water": demand["drinking_water_liters"],
        "medical_kit": demand["medical_kits"],
        "sanitation_kit": demand["sanitation_kits"]
    }

    # Persist or update demand forecasts
    for resource_type, quantity_needed in forecast_data.items():
        forecast = db.query(DemandForecast).filter(
            DemandForecast.zone_id == id,
            DemandForecast.resource_type == resource_type
        ).first()

        if forecast:
            forecast.quantity_needed = quantity_needed
            forecast.confidence = 0.85
            forecast.computed_at = datetime.now(timezone.utc)
        else:
            forecast = DemandForecast(
                zone_id=id,
                resource_type=resource_type,
                quantity_needed=quantity_needed,
                confidence=0.85,
                computed_at=datetime.now(timezone.utc)
            )
            db.add(forecast)

    db.commit()

    # Compare demand against available resources
    shortage_result = calculate_zone_shortages(id, db)

    return {
        "zone_id": id,
        "demand": demand,
        "total_shortage": shortage_result["total_shortage"],
        "shortages": shortage_result["shortages"]
    }

@router.get("/{id}/shortages")
def get_zone_shortages(id: str, db: Session = Depends(get_db)):
    """
    Returns the current resource shortages for a specific zone.
    """
    zone = db.query(Zone).filter(Zone.id == id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    # Make sure the latest demand forecasts exist
    pop_profile = db.query(PopulationProfile).filter(PopulationProfile.zone_id == id).first()
    pop = zone.population_est
    households = pop_profile.households_est if pop_profile else int(pop / 4)
    vulnerability = pop_profile.vulnerability_index if pop_profile else 0.65

    demand = calculate_demographic_demand(pop, households, vulnerability)
    forecast_data = {
        "food_packet": demand["food_packets"],
        "water": demand["drinking_water_liters"],
        "medical_kit": demand["medical_kits"],
        "sanitation_kit": demand["sanitation_kits"]
    }

    for resource_type, quantity_needed in forecast_data.items():
        forecast = db.query(DemandForecast).filter(
            DemandForecast.zone_id == id,
            DemandForecast.resource_type == resource_type
        ).first()

        if forecast:
            forecast.quantity_needed = quantity_needed
            forecast.confidence = 0.85
            forecast.computed_at = datetime.now(timezone.utc)
        else:
            db.add(DemandForecast(
                zone_id=id,
                resource_type=resource_type,
                quantity_needed=quantity_needed,
                confidence=0.85,
                computed_at=datetime.now(timezone.utc)
            ))

    db.commit()
    return calculate_zone_shortages(id, db)
