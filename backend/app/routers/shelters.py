from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Shelter

router = APIRouter(prefix="/shelters", tags=["Shelters"])


class ShelterResponse(BaseModel):
    id: str
    name: str
    location_name: str
    lat: float
    lng: float
    capacity: int
    current_occupancy: int
    status: str
    contact_number: str
    zone_id: str | None


@router.get("", response_model=List[ShelterResponse])
def list_shelters(db: Session = Depends(get_db)):
    """Return the persisted shelter inventory for map and citizen views."""
    shelters = db.query(Shelter).all()
    return [
        {
            "id": shelter.id,
            "name": shelter.name,
            "location_name": shelter.name,
            "lat": shelter.lat,
            "lng": shelter.lng,
            "capacity": shelter.capacity,
            "current_occupancy": shelter.current_occupancy,
            "status": "full" if shelter.current_occupancy >= shelter.capacity else "open",
            "contact_number": "",
            "zone_id": shelter.zone_id,
        }
        for shelter in shelters
    ]
