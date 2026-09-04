import datetime
import hashlib
import hmac
import secrets
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..core.config import settings
from ..database import get_db
from ..models import User

security_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hash_bytes = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${hash_bytes.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or "$" not in hashed_password:
        return False
    salt, expected_hash = hashed_password.split("$", 1)
    hash_bytes = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return hmac.compare_digest(hash_bytes.hex(), expected_hash)


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.UTC) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_user_from_token(
    token: Optional[str],
    db: Session
) -> Optional[User]:
    """Resolve a JWT to the authenticated DB user."""

    if not token:
        print("[AUTH DEBUG] No token")
        return None

    payload = decode_access_token(token)

    print("[AUTH DEBUG] JWT payload:", payload)

    if payload is None:
        print("[AUTH DEBUG] JWT decode FAILED")
        return None

    user_id = payload.get("sub")

    print("[AUTH DEBUG] User ID from token:", user_id)

    if user_id is None:
        print("[AUTH DEBUG] Token has no 'sub'")
        return None

    user = db.query(User).filter(User.id == user_id).first()

    print(
        "[AUTH DEBUG] Database user:",
        user.id if user else None,
        "Role:",
        user.role if user else None,
    )

    return user
    """Resolve a JWT to the authenticated DB user. Shared by HTTP and WebSocket auth."""
    if not token:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    return db.query(User).filter(User.id == user_id).first()

def get_current_user(
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = auth_credentials.credentials if auth_credentials else None
    user = get_user_from_token(token, db)
    if user is None:
        raise credentials_exception
    return user

def get_optional_current_user(
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not auth_credentials:
        return None
    token = auth_credentials.credentials
    return get_user_from_token(token, db)


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {self.allowed_roles}",
            )
        return current_user

# Reusable role guards
# Dashboard WS is used by citizen, volunteer, and officer frontends (plus admin).
DASHBOARD_WS_ALLOWED_ROLES = ["citizen", "officer", "volunteer", "admin"]
require_citizen = RoleChecker(["citizen", "officer", "volunteer", "admin"])
require_volunteer = RoleChecker(["volunteer", "officer", "admin"])
require_officer = RoleChecker(["officer", "admin"])
require_admin = RoleChecker(["admin"])
