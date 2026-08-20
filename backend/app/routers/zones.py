from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Zone, PopulationProfile
from ..services.demand_service import calculate_demographic_demand

router = APIRouter(prefix="/zones", tags=["Zones"])

class ZoneResponse(BaseModel):
    id: str
    name: str
    district: str | None
    boundary_json: str | None
    population_est: int

    class Config:
        from_attributes = True

class PopulationProfileResponse(BaseModel):
    zone_id: str
    population_est: int
    households_est: int
    vulnerability_index: float
    updated_at: datetime

    class Config:
        from_attributes = True

class DemandResponse(BaseModel):
    food_packets: int
    drinking_water_liters: int
    medical_kits: int
    sanitation_kits: int
    population: int
    households: int
    vulnerability_index: float

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
            "updated_at": datetime.utcnow()
        }
    return profile

@router.get("/{id}/demand", response_model=DemandResponse)
def get_zone_demand(id: str, db: Session = Depends(get_db)):
    """
    Evaluates demographics-based resource demand forecast.
    """
    zone = db.query(Zone).filter(Zone.id == id).first()
    pop_profile = db.query(PopulationProfile).filter(PopulationProfile.zone_id == id).first()

    pop = zone.population_est if zone else 15000
    households = pop_profile.households_est if pop_profile else int(pop / 4)
    vulnerability = pop_profile.vulnerability_index if pop_profile else 0.65

    return calculate_demographic_demand(pop, households, vulnerability)
