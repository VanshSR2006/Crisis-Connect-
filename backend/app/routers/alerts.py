from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Alert, User
from ..core.security import require_officer
from ..websocket.manager import manager

router = APIRouter(prefix="/alerts", tags=["Emergency Alerts"])

class AlertCreate(BaseModel):
    zone_id: str
    message_en: str
    message_translated: Optional[dict] = None
    severity: Optional[str] = "medium"

class AlertResponse(BaseModel):
    id: str
    zone_id: str | None
    message_en: str
    message_translated: dict | None
    severity: str
    issued_at: datetime

    class Config:
        from_attributes = True

@router.post("", response_model=AlertResponse)
async def create_alert(
    a: AlertCreate, 
    current_user: User = Depends(require_officer), 
    db: Session = Depends(get_db)
):
    """
    Creates and broadcasts an emergency alert to a specific zone. Translated versions are loaded.
    Only authorized officers can issue alerts.
    """
    translations = a.message_translated or {
        "hi": f"[Hindi Translation Placeholder] {a.message_en}",
        "ka": f"[Kannada Translation Placeholder] {a.message_en}"
    }

    new_alert = Alert(
        zone_id=a.zone_id,
        message_en=a.message_en,
        message_translated=translations,
        severity=a.severity or "medium"
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    # Broadcast structured event
    await manager.broadcast("alert.created", {
        "id": new_alert.id,
        "zone_id": new_alert.zone_id,
        "message_en": new_alert.message_en,
        "severity": new_alert.severity
    })

    return new_alert
