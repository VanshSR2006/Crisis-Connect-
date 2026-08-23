from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from .core.config import settings
from .core.redis import redis_client
from .core.security import DASHBOARD_WS_ALLOWED_ROLES, get_user_from_token
from .database import get_db
from .websocket.manager import manager

# Import routers
from .routers import auth, incidents, resources, dispatch, zones, risk, sites, alerts, demo

# Auto-create SQLite tables on startup in development mode
if settings.DATABASE_URL.startswith("sqlite"):
    from .database import Base, engine
    Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events using the modern lifespan pattern."""
    # --- Startup ---
    settings.validate()
    redis_client.connect()
    yield
    # --- Shutdown (add cleanup here if needed) ---


app = FastAPI(
    title="Crisis Connect Backend API",
    description="Disaster Response Intelligence Platform API Server",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
allow_origins_list = ["http://localhost:3000", "http://127.0.0.1:3000"]
if settings.FRONTEND_ORIGINS:
    allow_origins_list.extend([origin.strip() for origin in settings.FRONTEND_ORIGINS.split(",") if origin.strip()])
if settings.FRONTEND_ORIGIN and settings.FRONTEND_ORIGIN != "*":
    allow_origins_list.append(settings.FRONTEND_ORIGIN.strip())

allow_origins_list = list(set(allow_origins_list))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(resources.router)
app.include_router(dispatch.router)
app.include_router(zones.router)
app.include_router(risk.router)
app.include_router(sites.router)
app.include_router(alerts.router)
app.include_router(demo.router)

# Health & Readiness split
@app.get("/health", tags=["System Health"])
def health_check():
    """
    Liveness probe: verifies the API process is alive.
    """
    return {
        "status": "healthy",
        "service": "Crisis Connect Intelligence Backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

@app.get("/ready", tags=["System Health"])
def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness probe: verifies the database and Redis connections are active.
    """
    details = {}
    
    # 1. Verify database connection
    try:
        db.execute(text("SELECT 1"))
        details["database"] = "connected"
    except Exception as e:
        details["database"] = f"failed: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail={"status": "not ready", "details": details}
        )

    # 2. Verify Redis connection
    try:
        redis_client.ping()
        details["redis"] = "connected"
    except Exception as e:
        details["redis"] = f"failed: {str(e)}"
        # In production, Redis failure makes service unready
        if settings.ENVIRONMENT == "production":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"status": "not ready", "details": details}
            )
        else:
            details["redis"] = f"failed (non-blocking in development): {str(e)}"

    return {
        "status": "ready",
        "details": details
    }

# Backward compatibility / route redirect
@app.get("/")
def home_redirect():
    return health_check()

def _websocket_bearer_token(websocket: WebSocket) -> Optional[str]:
    """Read JWT from ?token= (browser WS) or Authorization: Bearer (clients/tests)."""
    query_token = websocket.query_params.get("token")
    if query_token:
        return query_token
    auth_header = websocket.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip() or None
    return None


# WebSocket dashboard endpoint
@app.websocket("/ws/dashboard")
async def websocket_dashboard_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    token = _websocket_bearer_token(websocket)
    user = get_user_from_token(token, db)
    if user is None:
        await websocket.close(code=4401)
        return
    if user.role not in DASHBOARD_WS_ALLOWED_ROLES:
        await websocket.close(code=4403)
        return

    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; acknowledge messages
            data = await websocket.receive_text()
            await websocket.send_text(f"ACK:{data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Global Exception Handlers to avoid leaking internal stack traces in production
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
