from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from ..database import get_db
from ..models import Resource

router = APIRouter(prefix="/resources", tags=["Resources"])

class ResourceResponse(BaseModel):
    id: str
    name: str
    type: str
    quantity_available: int
    unit: str
    zone_id: str | None
    status: str

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[ResourceResponse])
def list_resources(db: Session = Depends(get_db)):
    """
    Returns lists of all resource inventories and status.
    """
    return db.query(Resource).all()
