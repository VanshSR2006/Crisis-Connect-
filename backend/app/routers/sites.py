from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import RescueSite
from ..services.site_ranking_service import rank_rescue_sites

router = APIRouter(prefix="/rescue-sites", tags=["Rescue Sites"])

class RescueSiteRankResponse(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    elevation_m: float
    predicted_flood_margin_m: float
    capacity: int
    current_occupancy: int
    access_status: str
    zone_id: str | None
    suitability_score: float
    distance_km: float
    available_capacity: int
    reason_breakdown: Dict[str, str]

@router.post("/rank", response_model=List[RescueSiteRankResponse])
def rank_sites(
    incident_lat: float, 
    incident_lng: float, 
    predicted_flood_m: float = 2.0, 
    db: Session = Depends(get_db)
):
    """
    Ranks rescue sites according to multi-factor suitability models.
    """
    sites = db.query(RescueSite).all()
    sites_dict = [
        {
            "id": s.id,
            "name": s.name,
            "lat": s.lat,
            "lng": s.lng,
            "elevation_m": s.elevation_m,
            "predicted_flood_margin_m": s.predicted_flood_margin_m,
            "capacity": s.capacity,
            "current_occupancy": s.current_occupancy,
            "access_status": s.access_status,
            "zone_id": s.zone_id
        }
        for s in sites
    ]
    return rank_rescue_sites(incident_lat, incident_lng, sites_dict)
