from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..core.security import require_officer
from ..database import get_db
from ..models import User

router = APIRouter(prefix="/users", tags=["Users"])


class VolunteerResponse(BaseModel):
    id: str
    name: str
    email: str | None

    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=list[VolunteerResponse])
def list_volunteers(
    role: Literal["volunteer"] = Query(...),
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    return db.query(User).filter(User.role == role).order_by(User.name).all()
