from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from .database import engine, Base, get_db
from .models import Incident, Resource, Zone, RiskScore, RescueSite
from .routers import demo
from .services.risk_service import calculate_flood_risk
from .services.site_ranking_service import rank_rescue_sites
from .services.demand_service import calculate_demographic_demand
from pydantic import BaseModel
from typing import Optional

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Crisis Connect Backend API",
    description="Disaster Response Intelligence Platform API Server",
    version="1.0.0"
)

# CORS middleware for frontend origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager for Realtime Officer Dashboard & Volunteer updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# Include routers
app.include_router(demo.router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "Crisis Connect Intelligence Backend",
        "version": "1.0.0"
    }

@app.get("/incidents")
def list_incidents(db=Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.priority_score.desc()).all()
    return incidents

class IncidentCreate(BaseModel):
    category: str
    severity: str
    description: str
    lat: float
    lng: float
    title: Optional[str] = "Emergency SOS Report"
    zone_id: Optional[str] = "z-silchar"
    reporter_id: Optional[str] = "usr-citizen-1"

@app.post("/incidents")
async def create_incident(inc: IncidentCreate, db=Depends(get_db)):
    new_inc = Incident(
        title=inc.title,
        category=inc.category,
        severity=inc.severity,
        description=inc.description,
        lat=inc.lat,
        lng=inc.lng,
        zone_id=inc.zone_id,
        reporter_id=inc.reporter_id,
        status="reported",
        priority_score=75.0 if inc.severity == "critical" else 50.0
    )
    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)

    # Broadcast new incident via WebSocket
    await manager.broadcast(f"NEW_INCIDENT:{new_inc.id}:{new_inc.category}:{new_inc.severity}")
    return new_inc

@app.get("/zones")
def list_zones(db=Depends(get_db)):
    return db.query(Zone).all()

@app.get("/risk/zones")
def get_risk_zones(db=Depends(get_db)):
    scores = db.query(RiskScore).all()
    return scores

@app.post("/rescue-sites/rank")
def rank_sites(incident_lat: float, incident_lng: float, predicted_flood_m: float = 2.0, db=Depends(get_db)):
    sites = db.query(RescueSite).all()
    sites_dict = [
        {
            "id": s.id,
            "name": s.name,
            "lat": s.lat,
            "lng": s.lng,
            "elevation_m": s.elevation_m,
            "predicted_flood_margin_m": s.predicted_flood_margin_m,
            "capacity": s.capacity,
            "current_occupancy": s.current_occupancy,
            "access_status": s.access_status,
            "zone_id": s.zone_id
        }
        for s in sites
    ]
    return rank_rescue_sites(incident_lat, incident_lng, predicted_flood_m, sites_dict)

@app.websocket("/ws/dashboard")
async def websocket_dashboard_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"ACK:{data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
