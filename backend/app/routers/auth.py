from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..core.security import create_access_token, hash_password, verify_password
from ..core.rate_limiter import RateLimiter
from ..core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class SignupRequest(BaseModel):
    name: str
    role: str
    password: str
    phone: Optional[str] = None
    email: Optional[str] = None
    language_pref: Optional[str] = "en"

class UserResponse(BaseModel):
    id: str
    name: str
    role: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    language_pref: Optional[str] = "en"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/login", response_model=AuthResponse)
def login(
    req: LoginRequest,
    db: Session = Depends(get_db),
    _limiter: None = Depends(RateLimiter(times=settings.RATE_LIMIT_LOGIN, seconds=settings.RATE_LIMIT_WINDOW_SECONDS, key_prefix="auth_login")),
):
    """
    Authenticates an existing user by phone number (Citizen) or email (Officer/Volunteer) and password.
    Returns a JWT containing the authenticated user's true database role.
    """
    if not req.phone and not req.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number or email is required."
        )

    if not req.password or not req.password.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is required for authentication."
        )

    user: Optional[User] = None

    if req.phone and req.phone.strip():
        phone_clean = req.phone.strip()
        user = db.query(User).filter(User.phone == phone_clean).first()
    elif req.email and req.email.strip():
        email_clean = req.email.strip().lower()
        user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number/email or password."
        )

    # Optional role check verification
    if req.role and req.role.strip() and user.role != req.role.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Selected role '{req.role}' does not match authenticated user role '{user.role}'."
        )

    # Password verification — requires password_hash to exist and match
    if not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number/email or password."
        )

    # Generate JWT containing authenticated user ID and role
    access_token = create_access_token(data={"sub": user.id, "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "phone": user.phone or "",
            "email": user.email or "",
            "language_pref": user.language_pref or "en"
        }
    }


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(
    req: SignupRequest,
    db: Session = Depends(get_db),
    _limiter: None = Depends(RateLimiter(times=settings.RATE_LIMIT_SIGNUP, seconds=settings.RATE_LIMIT_WINDOW_SECONDS, key_prefix="auth_signup")),
):
    """
    Registers a new Citizen or Volunteer.
    Citizen requires phone + password.
    Volunteer requires email + password.
    Officer registration is completely disabled.
    """
    clean_role = req.role.strip().lower() if req.role else ""
    if clean_role == "officer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Officer registration is disabled. Officers must log in using existing credentials."
        )

    if clean_role not in ["citizen", "volunteer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified. Must be 'citizen' or 'volunteer'."
        )

    if not req.name or not req.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required."
        )

    if not req.password or len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    phone_clean: Optional[str] = req.phone.strip() if req.phone else None
    email_clean: Optional[str] = req.email.strip().lower() if req.email else None

    if clean_role == "citizen":
        if not phone_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is required for Citizen signup."
            )
        existing_phone = db.query(User).filter(User.phone == phone_clean).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this phone number already exists."
            )
    else:  # volunteer
        if not email_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is required for Volunteer signup."
            )
        existing_email = db.query(User).filter(User.email == email_clean).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )

    # Hash password and create user
    hashed_pwd = hash_password(req.password)
    new_user = User(
        name=req.name.strip(),
        phone=phone_clean,
        email=email_clean,
        password_hash=hashed_pwd,
        role=clean_role,
        language_pref=req.language_pref or "en"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate access token
    access_token = create_access_token(data={"sub": new_user.id, "role": new_user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "role": new_user.role,
            "phone": new_user.phone or "",
            "email": new_user.email or "",
            "language_pref": new_user.language_pref or "en"
        }
    }
