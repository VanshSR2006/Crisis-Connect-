from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Incident, User
from ..core.security import get_current_user, require_officer
from ..services.priority_service import calculate_response_priority
from ..websocket.manager import manager

router = APIRouter(prefix="/incidents", tags=["Incidents"])

class IncidentCreate(BaseModel):
    category: str
    severity: str
    description: str
    lat: float
    lng: float
    title: Optional[str] = "Emergency SOS Report"
    zone_id: Optional[str] = "z-silchar"
    reporter_id: Optional[str] = "usr-citizen-1"

class IncidentVerifyRequest(BaseModel):
    review_state: str  # verified | flagged
    credibility_score: float

class IncidentResponse(BaseModel):
    id: str
    title: Optional[str]
    category: str
    severity: str
    description: Optional[str]
    lat: float
    lng: float
    zone_id: Optional[str]
    reporter_id: Optional[str]
    status: str
    priority_score: float
    credibility_score: float
    review_state: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[IncidentResponse])
def list_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.priority_score.desc()).all()

@router.post("", response_model=IncidentResponse)
async def create_incident(inc: IncidentCreate, db: Session = Depends(get_db)):
    """
    Submits a new incident SOS report and broadcasts a structured JSON event to the WebSocket.
    """
    # Normalize reporter_id for guest/placeholder values
    reporter_id = inc.reporter_id
    if reporter_id is not None:
        reporter_id_clean = reporter_id.strip()
        if reporter_id_clean.lower() in ("usr-guest", "guest", ""):
            reporter_id = None
        else:
            reporter_id = reporter_id_clean

    # Validate real reporter_id before INSERT if non-null
    if reporter_id is not None:
        user = db.query(User).filter(User.id == reporter_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reporter_id"
            )

    # Dynamic priority score calculation based on default factors
    priority = calculate_response_priority(
        risk_score=0.8,
        severity=inc.severity,
        credibility_score=1.0,  # Starts fully credible until verified otherwise
        vulnerability_index=0.7
    )
    new_inc = Incident(
        title=inc.title,
        category=inc.category,
        severity=inc.severity,
        description=inc.description,
        lat=inc.lat,
        lng=inc.lng,
        zone_id=inc.zone_id,
        reporter_id=reporter_id,
        status="reported",
        review_state="unverified",
        credibility_score=1.0,
        priority_score=priority
    )
    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)

    # Broadcast structured event
    await manager.broadcast("incident.created", {
        "id": new_inc.id,
        "title": new_inc.title,
        "category": new_inc.category,
        "severity": new_inc.severity,
        "status": new_inc.status,
        "priority_score": new_inc.priority_score
    })
    return new_inc

@router.post("/{id}/verify", response_model=IncidentResponse)
async def verify_incident(
    id: str, 
    req: IncidentVerifyRequest, 
    current_user: User = Depends(require_officer), 
    db: Session = Depends(get_db)
):
    """
    Verifies or flags an incident. Recalculates response priority dynamically and broadcasts incident.verified event.
    """
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if req.review_state not in ["verified", "flagged"]:
        raise HTTPException(status_code=400, detail="Invalid review_state. Must be 'verified' or 'flagged'")

    incident.review_state = req.review_state
    incident.credibility_score = req.credibility_score
    
    # Recalculate priority score with updated credibility
    incident.priority_score = calculate_response_priority(
        risk_score=0.8,  # Dynamic risk loading placeholder
        severity=incident.severity,
        credibility_score=incident.credibility_score,
        vulnerability_index=0.7
    )
    
    db.commit()
    db.refresh(incident)

    # Broadcast structured event
    await manager.broadcast("incident.verified", {
        "id": incident.id,
        "review_state": incident.review_state,
        "credibility_score": incident.credibility_score,
        "priority_score": incident.priority_score
    })
    return incident
