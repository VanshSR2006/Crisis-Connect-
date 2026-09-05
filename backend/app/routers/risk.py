from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from ..database import get_db
from ..models import RiskScore, WeatherReading
from ..services.risk_service import (
    calculate_flood_risk,
    DEFAULT_ELEVATION_M,
    DEFAULT_SOIL_SATURATION,
)

router = APIRouter(prefix="/risk", tags=["Risk Intelligence"])

class RiskScoreResponse(BaseModel):
    id: str
    zone_id: str
    risk_level: str
    score: float
    computed_at: datetime
    rainfall_mm: Optional[float] = None
    river_level_m: Optional[float] = None
    elevation_m: Optional[float] = DEFAULT_ELEVATION_M
    soil_saturation: Optional[float] = DEFAULT_SOIL_SATURATION

    model_config = ConfigDict(from_attributes=True)

class RiskCalcInput(BaseModel):
    rainfall_mm: float
    river_level_m: float
    elevation_m: float
    soil_saturation: Optional[float] = 0.5

class RiskCalcOutput(BaseModel):
    score: float
    risk_level: str
    rainfall_mm: float
    river_level_m: float
    elevation_m: float
    soil_saturation: float

@router.get("/zones", response_model=List[RiskScoreResponse])
def get_risk_zones(db: Session = Depends(get_db)):
    scores = db.query(RiskScore).all()
    readings = (
        db.query(WeatherReading)
        .order_by(WeatherReading.recorded_at.desc())
        .all()
    )
    latest_by_zone = {}
    for r in readings:
        if r.zone_id and r.zone_id not in latest_by_zone:
            latest_by_zone[r.zone_id] = r

    results = []
    for s in scores:
        w = latest_by_zone.get(s.zone_id)
        results.append(
            RiskScoreResponse(
                id=s.id,
                zone_id=s.zone_id,
                risk_level=s.risk_level or "medium",
                score=s.score,
                computed_at=s.computed_at,
                rainfall_mm=w.rainfall_mm if w else None,
                river_level_m=w.river_level_m if w else None,
                elevation_m=DEFAULT_ELEVATION_M,
                soil_saturation=DEFAULT_SOIL_SATURATION,
            )
        )
    return results

@router.post("/calculate", response_model=RiskCalcOutput)
def calculate_risk(input_data: RiskCalcInput):
    """
    Evaluates flood risk probability using Logistic Regression.
    """
    soil_sat = input_data.soil_saturation if input_data.soil_saturation is not None else 0.5
    return calculate_flood_risk(
        rainfall_mm=input_data.rainfall_mm,
        river_level_m=input_data.river_level_m,
        elevation_m=input_data.elevation_m,
        soil_saturation=soil_sat
    )
