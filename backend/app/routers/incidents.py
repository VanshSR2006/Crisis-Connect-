from typing import List, Literal, Optional
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from pydantic import BaseModel, ConfigDict, field_serializer

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Incident, User
from ..core.security import get_current_user, get_optional_current_user, require_officer
from ..core.rate_limiter import RateLimiter
from ..core.config import settings
from ..services.priority_service import calculate_response_priority
from ..services.credibility_service import calculate_incident_credibility
from ..services.risk_service import get_zone_risk_snapshot
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
    reporter_id: Optional[str] = None

class IncidentVerifyRequest(BaseModel):
    review_state: str  # verified | flagged
    credibility_score: float

class IncidentStatusUpdateRequest(BaseModel):
    status: Literal["acknowledged", "resolved"]

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

    @field_serializer('created_at')
    def serialize_created_at(self, dt: datetime, _info) -> str:
        if dt is None:
            return ""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace('+00:00', 'Z')

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[IncidentResponse])
def list_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc(), Incident.priority_score.desc()).all()

@router.post("", response_model=IncidentResponse)
async def create_incident(
    inc: IncidentCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
    _limiter: None = Depends(RateLimiter(times=settings.RATE_LIMIT_INCIDENTS, seconds=settings.RATE_LIMIT_WINDOW_SECONDS, key_prefix="incidents_create")),
):
    """
    Submits a new incident SOS report and broadcasts a structured JSON event to the WebSocket.
    Enforces JWT authentication: if authenticated, reporter_id is strictly set to current_user.id.
    If unauthenticated (guest SOS), reporter_id is set to None.
    """
    if current_user is not None:
        reporter_id = current_user.id
    else:
        reporter_id = None

    # Deduplicate recent identical emergency SOS submissions within 15 seconds
    recent_cutoff = datetime.now(timezone.utc) - timedelta(seconds=15)
    existing = db.query(Incident).filter(
        Incident.description == inc.description,
        Incident.created_at >= recent_cutoff
    ).first()
    if existing:
        return existing

    # Dynamic risk calculation based on zone intelligence
    risk = get_zone_risk_snapshot(inc.zone_id or "z-silchar", db)

    # Automatically evaluate SOS credibility before saving
    credibility = calculate_incident_credibility(inc, db)

    # Dynamic priority score calculation using zone risk and credibility
    priority = calculate_response_priority(
        risk_score=risk["risk_score"],
        severity=inc.severity,
        credibility_score=credibility["credibility_score"],
        vulnerability_index=risk["vulnerability_index"]
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
        review_state="flagged" if credibility.get("suspicious") else "unverified",
        credibility_score=credibility["credibility_score"],
        priority_score=priority
    )
    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)

    # Broadcast structured event
    created_at_str = new_inc.created_at.isoformat().replace('+00:00', 'Z') if new_inc.created_at else datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    await manager.broadcast("incident.created", {
        "id": new_inc.id,
        "title": new_inc.title,
        "category": new_inc.category,
        "severity": new_inc.severity,
        "status": new_inc.status,
        "priority_score": new_inc.priority_score,
        "description": new_inc.description,
        "lat": new_inc.lat,
        "lng": new_inc.lng,
        "zone_id": new_inc.zone_id,
        "reporter_id": new_inc.reporter_id,
        "review_state": new_inc.review_state,
        "credibility_score": new_inc.credibility_score,
        "created_at": created_at_str
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
    
    # Recalculate priority score with updated credibility and zone risk
    risk = get_zone_risk_snapshot(incident.zone_id or "z-silchar", db)
    incident.priority_score = calculate_response_priority(
        risk_score=risk["risk_score"],
        severity=str(incident.severity),
        credibility_score=incident.credibility_score,
        vulnerability_index=risk["vulnerability_index"]
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


@router.patch("/{id}/status", response_model=IncidentResponse)
async def update_incident_status(
    id: str,
    req: IncidentStatusUpdateRequest,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    """Persist an officer acknowledgement or resolution on the Incident record."""
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = req.status
    db.commit()
    db.refresh(incident)

    await manager.broadcast("incident.updated", {
        "id": incident.id,
        "status": incident.status,
    })
    return incident
