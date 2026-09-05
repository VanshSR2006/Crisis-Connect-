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

    # Officers must explicitly select a real volunteer.
    # Never silently assign a dispatch to a demo account.
    assigned_user_id: Optional[str] = None

    eta_minutes: Optional[int] = 15
    notes: Optional[str] = "Authorized by Command Officer"


class TeamDispatchCreate(BaseModel):
    """
    Request model for dispatching multiple volunteers
    to the same incident as one coordinated team.
    """
    incident_id: str
    volunteer_ids: List[str]
    resource_id: Optional[str] = None
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
    return (
        db.query(Dispatch)
        .order_by(Dispatch.dispatched_at.desc())
        .all()
    )


@router.post("", response_model=DispatchResponse)
async def create_dispatch(
    d: DispatchCreate,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """
    Authorizes and executes a single resource dispatch with
    database-level row locking.

    This endpoint is intentionally kept as the existing
    single-volunteer dispatch workflow.
    """

    # 1. Row Lock: Incident to ensure consistency
    incident = (
        db.query(Incident)
        .filter(Incident.id == d.incident_id)
        .with_for_update()
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    if incident.status == "dispatched":
        raise HTTPException(
            status_code=400,
            detail="Incident has already been dispatched"
        )

    # 2. Row Lock: Resource if assigned
    resource = None

    if d.resource_id:
        resource = (
            db.query(Resource)
            .filter(Resource.id == d.resource_id)
            .with_for_update()
            .first()
        )

        if not resource:
            raise HTTPException(
                status_code=404,
                detail="Resource not found"
            )

        res_qty = int(resource.quantity_available)

        if res_qty <= 0:
            raise HTTPException(
                status_code=400,
                detail="Resource quantity is depleted"
            )

        # Deduct quantity atomically
        setattr(resource, "quantity_available", res_qty - 1)

        if res_qty - 1 == 0:
            setattr(resource, "status", "depleted")
        else:
            setattr(resource, "status", "dispatched")

    # 3. Check if assigned user exists
    if d.assigned_user_id:
        volunteer = (
            db.query(User)
            .filter(User.id == d.assigned_user_id)
            .first()
        )

        if not volunteer:
            raise HTTPException(
                status_code=400,
                detail="Assigned volunteer user does not exist"
            )

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

    # 4. WebSocket broadcasting
    await manager.broadcast(
        "dispatch.authorized",
        {
            "id": new_dispatch.id,
            "incident_id": new_dispatch.incident_id,
            "resource_id": new_dispatch.resource_id,
            "assigned_user_id": new_dispatch.assigned_user_id,
            "status": new_dispatch.status
        }
    )

    if resource:
        await manager.broadcast(
            "resource.updated",
            {
                "id": resource.id,
                "quantity_available": resource.quantity_available,
                "status": resource.status
            }
        )

    return new_dispatch


@router.post("/team", response_model=List[DispatchResponse])
async def create_team_dispatch(
    d: TeamDispatchCreate,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """
    Dispatch multiple volunteers to the same incident as
    one coordinated rescue team.

    Creates one Dispatch record per volunteer while treating
    the selected resource as a single team resource.

    Example:

        volunteer_ids = [
            "usr-volunteer-1",
            "usr-volunteer-2",
            "usr-volunteer-3"
        ]

    Results in three individual Dispatch records, allowing
    each volunteer to see and update their own assignment.

    The operation is validated before database changes are
    committed so an invalid volunteer/resource does not result
    in a partially created team.
    """

    # ---------------------------------------------------------
    # 1. Validate volunteer selection
    # ---------------------------------------------------------

    # Remove duplicate volunteer IDs while preserving order.
    volunteer_ids = list(dict.fromkeys(d.volunteer_ids))

    if not volunteer_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one volunteer must be selected"
        )

    # ---------------------------------------------------------
    # 2. Lock and validate incident
    # ---------------------------------------------------------

    incident = (
        db.query(Incident)
        .filter(Incident.id == d.incident_id)
        .with_for_update()
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    if incident.status == "dispatched":
        raise HTTPException(
            status_code=400,
            detail="Incident has already been dispatched"
        )

    # ---------------------------------------------------------
    # 3. Validate ALL selected volunteers
    # ---------------------------------------------------------

    volunteers = (
        db.query(User)
        .filter(
            User.id.in_(volunteer_ids),
            User.role == "volunteer"
        )
        .all()
    )

    volunteers_by_id = {
        str(volunteer.id): volunteer
        for volunteer in volunteers
    }

    missing_volunteers = [
        volunteer_id
        for volunteer_id in volunteer_ids
        if volunteer_id not in volunteers_by_id
    ]

    if missing_volunteers:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid volunteer selection: "
                + ", ".join(missing_volunteers)
            )
        )

    # ---------------------------------------------------------
    # 4. Lock and validate team resource
    # ---------------------------------------------------------

    resource = None

    if d.resource_id:
        resource = (
            db.query(Resource)
            .filter(Resource.id == d.resource_id)
            .with_for_update()
            .first()
        )

        if not resource:
            raise HTTPException(
                status_code=404,
                detail="Resource not found"
            )

        res_qty = int(resource.quantity_available)

        if res_qty <= 0:
            raise HTTPException(
                status_code=400,
                detail="Resource quantity is depleted"
            )

        # IMPORTANT:
        # One selected resource belongs to the entire team.
        # Therefore we decrement it ONCE, not once per volunteer.
        setattr(
            resource,
            "quantity_available",
            res_qty - 1
        )

        if res_qty - 1 == 0:
            setattr(resource, "status", "depleted")
        else:
            setattr(resource, "status", "dispatched")

    # ---------------------------------------------------------
    # 5. Create one dispatch record for every volunteer
    # ---------------------------------------------------------

    created_dispatches = []

    for volunteer_id in volunteer_ids:
        new_dispatch = Dispatch(
            incident_id=d.incident_id,
            resource_id=d.resource_id,
            assigned_user_id=volunteer_id,
            status="pending",
            eta_minutes=d.eta_minutes,
            notes=d.notes
        )

        db.add(new_dispatch)
        created_dispatches.append(new_dispatch)

    # ---------------------------------------------------------
    # 6. Update incident state
    # ---------------------------------------------------------

    incident.status = "dispatched"

    # ---------------------------------------------------------
    # 7. Commit the complete team dispatch
    # ---------------------------------------------------------

    db.commit()

    # Refresh generated Dispatch IDs and database values.
    for dispatch in created_dispatches:
        db.refresh(dispatch)

    # ---------------------------------------------------------
    # 8. Notify each assigned volunteer
    # ---------------------------------------------------------

    for dispatch in created_dispatches:
        await manager.broadcast(
            "dispatch.authorized",
            {
                "id": dispatch.id,
                "incident_id": dispatch.incident_id,
                "resource_id": dispatch.resource_id,
                "assigned_user_id": dispatch.assigned_user_id,
                "status": dispatch.status
            }
        )

    # ---------------------------------------------------------
    # 9. Notify dashboards about resource change
    # ---------------------------------------------------------

    if resource:
        await manager.broadcast(
            "resource.updated",
            {
                "id": resource.id,
                "quantity_available": resource.quantity_available,
                "status": resource.status
            }
        )

    return created_dispatches


@router.patch("/{dispatch_id}", response_model=DispatchResponse)
async def update_dispatch_status(
    dispatch_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the status of an existing dispatch assignment.

    Officers/admins may update any dispatch.

    Volunteers may update only dispatches assigned to them
    through assigned_user_id.
    """

    dispatch = (
        db.query(Dispatch)
        .filter(Dispatch.id == dispatch_id)
        .first()
    )

    if not dispatch:
        raise HTTPException(
            status_code=404,
            detail="Dispatch not found"
        )

    if current_user.role in ("officer", "admin"):
        pass

    elif current_user.role == "volunteer":
        if str(dispatch.assigned_user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Operation not permitted. Volunteers may "
                    "update only their assigned dispatches."
                ),
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Operation not permitted. Required roles: "
                "['officer', 'admin', 'volunteer']"
            ),
        )

    if "status" in payload:
        new_status = payload["status"]
        dispatch.status = new_status

        # Synchronize associated Incident status in database
        incident = (
            db.query(Incident)
            .filter(Incident.id == dispatch.incident_id)
            .first()
        )

        if incident:
            if new_status in ("on_site", "arrived"):
                incident.status = "arrived"

            elif new_status in ("completed", "resolved"):
                incident.status = "resolved"

            elif new_status in (
                "dispatched",
                "pending",
                "en_route"
            ):
                incident.status = "dispatched"

    db.commit()
    db.refresh(dispatch)

    await manager.broadcast(
        "dispatch.status_changed",
        {
            "id": dispatch.id,
            "incident_id": dispatch.incident_id,
            "status": dispatch.status
        }
    )

    return dispatch