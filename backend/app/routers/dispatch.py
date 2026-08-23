from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from pydantic import BaseModel, ConfigDict

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Dispatch, Incident, Resource, User
from ..core.security import get_current_user, require_officer
from ..websocket.manager import manager

router = APIRouter(prefix="/dispatches", tags=["Dispatches"])

class DispatchCreate(BaseModel):
    incident_id: str
    resource_id: Optional[str] = None
    assigned_user_id: Optional[str] = "usr-volunteer-1"
    eta_minutes: Optional[int] = 15
    notes: Optional[str] = "Authorized by Command Officer"

class DispatchResponse(BaseModel):
    id: str
    incident_id: str
    resource_id: Optional[str]
    assigned_user_id: Optional[str]
    status: str
    eta_minutes: int
    notes: Optional[str]
    dispatched_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[DispatchResponse])
def list_dispatches(db: Session = Depends(get_db)):
    return db.query(Dispatch).all()

@router.post("", response_model=DispatchResponse)
async def create_dispatch(
    d: DispatchCreate, 
    current_user: User = Depends(require_officer), 
    db: Session = Depends(get_db)
):
    """
    Authorizes and executes a resource dispatch with database-level row locking.
    Ensures resources are committed atomically and prevents race conditions.
    """
    # 1. Row Lock: Incident to ensure consistency
    incident = db.query(Incident).filter(Incident.id == d.incident_id).with_for_update().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    if incident.status == "dispatched":
        raise HTTPException(status_code=400, detail="Incident has already been dispatched")

    # 2. Row Lock: Resource if assigned
    resource = None
    if d.resource_id:
        resource = db.query(Resource).filter(Resource.id == d.resource_id).with_for_update().first()
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")
            
        if resource.quantity_available <= 0:
            raise HTTPException(status_code=400, detail="Resource quantity is depleted")
            
        # Deduct quantity atomically
        resource.quantity_available -= 1
        if resource.quantity_available == 0:
            resource.status = "depleted"
        else:
            resource.status = "dispatched"

    # 3. Check if assigned user (volunteer) exists
    if d.assigned_user_id:
        volunteer = db.query(User).filter(User.id == d.assigned_user_id).first()
        if not volunteer:
            raise HTTPException(status_code=400, detail="Assigned volunteer user does not exist")

    # Update incident state
    incident.status = "dispatched"

    # Create dispatch record
    new_dispatch = Dispatch(
        incident_id=d.incident_id,
        resource_id=d.resource_id,
        assigned_user_id=d.assigned_user_id,
        status="pending",
        eta_minutes=d.eta_minutes,
        notes=d.notes
    )

    db.add(new_dispatch)
    db.commit()
    db.refresh(new_dispatch)

    # 4. WebSockets Broadcasting
    await manager.broadcast("dispatch.authorized", {
        "id": new_dispatch.id,
        "incident_id": new_dispatch.incident_id,
        "resource_id": new_dispatch.resource_id,
        "assigned_user_id": new_dispatch.assigned_user_id,
        "status": new_dispatch.status
    })

    if resource:
        await manager.broadcast("resource.updated", {
            "id": resource.id,
            "quantity_available": resource.quantity_available,
            "status": resource.status
        })

    return new_dispatch

@router.patch("/{dispatch_id}", response_model=DispatchResponse)
async def update_dispatch_status(
    dispatch_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the status of an existing dispatch assignment.
    Officers/admins may update any dispatch. Volunteers may update only
    dispatches assigned to them (assigned_user_id).
    """
    dispatch = db.query(Dispatch).filter(Dispatch.id == dispatch_id).first()
    if not dispatch:
        raise HTTPException(status_code=404, detail="Dispatch not found")

    if current_user.role in ("officer", "admin"):
        pass
    elif current_user.role == "volunteer":
        if dispatch.assigned_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted. Volunteers may update only their assigned dispatches.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. Required roles: ['officer', 'admin', 'volunteer']",
        )

    if "status" in payload:
        new_status = payload["status"]
        dispatch.status = new_status
        
        # Synchronize associated Incident status in database
        incident = db.query(Incident).filter(Incident.id == dispatch.incident_id).first()
        if incident:
            if new_status in ("on_site", "arrived"):
                incident.status = "arrived"
            elif new_status in ("completed", "resolved"):
                incident.status = "resolved"
            elif new_status in ("dispatched", "pending", "en_route"):
                incident.status = "dispatched"

    db.commit()
    db.refresh(dispatch)

    await manager.broadcast("dispatch.status_changed", {
        "id": dispatch.id,
        "incident_id": dispatch.incident_id,
        "status": dispatch.status
    })

    return dispatch
