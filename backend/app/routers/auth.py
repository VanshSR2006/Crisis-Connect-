from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    phone: str

class UserResponse(BaseModel):
    id: str
    name: str
    role: str
    phone: str
    language_pref: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a user by phone number. If they do not exist, they are registered as a 'citizen'.
    Privileged roles cannot be self-selected and must be pre-authorized in the database.
    """
    user = db.query(User).filter(User.phone == req.phone).first()
    
    if not user:
        # Register a new citizen
        user = User(
            name=f"Citizen {req.phone[-4:]}" if len(req.phone) >= 4 else "New Citizen",
            phone=req.phone,
            role="citizen",  # Default new registration role
            language_pref="en"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generate access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "phone": user.phone or "",
            "language_pref": user.language_pref or "en"
        }
    }
