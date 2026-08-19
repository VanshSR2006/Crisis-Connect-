# TEAM OWNERSHIP: MEMBER 3 — BACKEND + DATABASE + SECURITY + REALTIME
# This file is the primary FastAPI application entry point.
# Coordinate before modifying outside this workstream.
# API contract changes must be announced to all affected members (see docs/API_CONTRACTS.md).
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from .database import engine, Base, get_db
from .models import Incident, Resource, Zone, RiskScore, RescueSite, Dispatch, PopulationProfile
from .routers import demo
from .services.risk_service import calculate_flood_risk
from .services.site_ranking_service import rank_rescue_sites
from .services.demand_service import calculate_demographic_demand
from .services.priority_service import calculate_response_priority

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
    return db.query(Incident).order_by(Incident.priority_score.desc()).all()

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
    priority = calculate_response_priority(
        risk_score=0.8,
        severity=inc.severity,
        credibility_score=0.9,
        vulnerability_index=0.7
    )
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
        priority_score=priority
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
    return db.query(RiskScore).all()

class RiskCalcInput(BaseModel):
    rainfall_mm: float
    river_level_m: float
    elevation_m: float
    soil_saturation: Optional[float] = 0.5

@app.post("/risk/calculate")
def calculate_risk(input_data: RiskCalcInput):
    return calculate_flood_risk(
        rainfall_mm=input_data.rainfall_mm,
        river_level_m=input_data.river_level_m,
        elevation_m=input_data.elevation_m,
        soil_saturation=input_data.soil_saturation
    )

@app.get("/resources")
def list_resources(db=Depends(get_db)):
    return db.query(Resource).all()

@app.get("/dispatches")
def list_dispatches(db=Depends(get_db)):
    return db.query(Dispatch).all()

class DispatchCreate(BaseModel):
    incident_id: str
    resource_id: Optional[str] = None
    assigned_user_id: Optional[str] = "usr-volunteer-1"
    eta_minutes: Optional[int] = 15
    notes: Optional[str] = "Authorized by Command Officer"

@app.post("/dispatches")
async def create_dispatch(d: DispatchCreate, db=Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == d.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if d.resource_id:
        res = db.query(Resource).filter(Resource.id == d.resource_id).first()
        if res and res.status == "dispatched":
            raise HTTPException(status_code=400, detail="Resource already committed/dispatched")
        if res:
            res.status = "dispatched"

    incident.status = "dispatched"

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

    await manager.broadcast(f"DISPATCH_AUTHORIZED:{new_dispatch.id}:{d.incident_id}")
    return new_dispatch

@app.get("/zones/{zone_id}/demand")
def get_zone_demand(zone_id: str, db=Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    pop_profile = db.query(PopulationProfile).filter(PopulationProfile.zone_id == zone_id).first()

    pop = zone.population_est if zone else 15000
    households = pop_profile.households_est if pop_profile else int(pop / 4)
    vulnerability = pop_profile.vulnerability_index if pop_profile else 0.65

    return calculate_demographic_demand(pop, households, vulnerability)

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
