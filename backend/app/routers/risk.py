from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import RiskScore
from ..services.risk_service import calculate_flood_risk

router = APIRouter(prefix="/risk", tags=["Risk Intelligence"])

class RiskScoreResponse(BaseModel):
    id: str
    zone_id: str
    risk_level: str
    score: float
    computed_at: datetime

    class Config:
        from_attributes = True

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
    return db.query(RiskScore).all()

@router.post("/calculate", response_model=RiskCalcOutput)
def calculate_risk(input_data: RiskCalcInput):
    """
    Evaluates flood risk probability using Logistic Regression.
    """
    return calculate_flood_risk(
        rainfall_mm=input_data.rainfall_mm,
        river_level_m=input_data.river_level_m,
        elevation_m=input_data.elevation_m,
        soil_saturation=input_data.soil_saturation
    )
