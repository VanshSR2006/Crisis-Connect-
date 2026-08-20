# TEAM OWNERSHIP: MEMBER 5 — OPTIMIZATION + RESPONSE PLAN + DEMO
# Demo scenario orchestration: seeds the Assam Cachar flood crisis for judging.
# Coordinate before modifying outside this workstream.
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    Zone, Incident, RescueSite, Resource, User, RiskScore, 
    WeatherReading, Dispatch, Alert, PopulationProfile, DemandForecast
)
from ..services.priority_service import calculate_response_priority

router = APIRouter(prefix="/demo", tags=["Demo Scenario"])

@router.post("/reset-scenario")
def reset_demo_scenario(db: Session = Depends(get_db)):
    """
    Resets & seeds the controlled Assam Cachar Flood crisis scenario for live judging demos.
    Fixes the schema discrepancies of the RiskScore model.
    """
    # 1. Clear existing dynamic tables to prevent database constraints crashes
    db.query(Dispatch).delete()
    db.query(Alert).delete()
    db.query(Incident).delete()
    db.query(Resource).delete()
    db.query(RescueSite).delete()
    db.query(RiskScore).delete()
    db.query(WeatherReading).delete()
    db.query(PopulationProfile).delete()
    db.query(DemandForecast).delete()
    db.query(Zone).delete()
    db.query(User).delete()
    db.commit()

    # 2. Seed Users
    officer = User(id="usr-officer-1", name="Officer R. Sharma", phone="9876543210", role="officer")
    volunteer = User(id="usr-volunteer-1", name="Volunteer Team Alpha", phone="9876543211", role="volunteer")
    citizen = User(id="usr-citizen-1", name="Anita Das", phone="9876543212", role="citizen")
    db.add_all([officer, volunteer, citizen])
    db.commit()

    # 3. Seed Zones (Cachar District, Assam)
    z1 = Zone(id="z-silchar", name="Silchar Urban Sector 4", district="Cachar", population_est=45000)
    z2 = Zone(id="z-lakhipur", name="Lakhipur Rural Zone", district="Cachar", population_est=18000)
    z3 = Zone(id="z-katigorah", name="Katigorah Riverside", district="Cachar", population_est=28000)
    db.add_all([z1, z2, z3])
    db.commit()

    # 4. Seed Weather Readings
    w1 = WeatherReading(zone_id=z1.id, rainfall_mm=140.0, river_level_m=4.8)
    w2 = WeatherReading(zone_id=z2.id, rainfall_mm=95.0, river_level_m=3.2)
    w3 = WeatherReading(zone_id=z3.id, rainfall_mm=45.0, river_level_m=2.1)
    db.add_all([w1, w2, w3])
    db.commit()

    # 5. Seed Risk Scores (Fixed: removed non-existent columns)
    r1 = RiskScore(zone_id=z1.id, risk_level="critical", score=0.88)
    r2 = RiskScore(zone_id=z2.id, risk_level="high", score=0.68)
    r3 = RiskScore(zone_id=z3.id, risk_level="medium", score=0.42)
    db.add_all([r1, r2, r3])
    db.commit()

    # 6. Seed Candidate Rescue Sites
    site1 = RescueSite(
        id="site-1",
        name="Government HS School Silchar",
        lat=24.8250, lng=92.7950,
        elevation_m=24.5,
        predicted_flood_margin_m=3.2,
        capacity=800,
        current_occupancy=150,
        access_status="accessible",
        zone_id=z1.id
    )
    site2 = RescueSite(
        id="site-2",
        name="Primary Health Center Lakhipur",
        lat=24.8100, lng=92.8100,
        elevation_m=14.0,
        predicted_flood_margin_m=-0.5,
        capacity=150,
        current_occupancy=145,
        access_status="limited",
        zone_id=z2.id
    )
    db.add_all([site1, site2])
    db.commit()

    # 7. Seed Resources
    res1 = Resource(id="res-boat-1", name="NDRF Rescue Boat Alpha", type="boat", quantity_available=2, zone_id=z1.id, status="available")
    res2 = Resource(id="res-med-1", name="Emergency Medical Kit Pack", type="medical_kit", quantity_available=50, zone_id=z1.id, status="available")
    res3 = Resource(id="res-food-1", name="Dry Ration Food Packets", type="food_packet", quantity_available=300, zone_id=z1.id, status="available")
    db.add_all([res1, res2, res3])
    db.commit()

    # 8. Seed Incidents
    p_score_1 = calculate_response_priority(0.88, "critical", 0.95, 0.85)
    inc1 = Incident(
        id="inc-101",
        reporter_id=citizen.id,
        zone_id=z1.id,
        title="Flash Flood Evacuation Required",
        description="Water level entering ground floor of 15 households. Elderly people stuck.",
        category="rescue",
        severity="critical",
        status="reported",
        lat=24.8200, lng=92.7900,
        credibility_score=0.95,
        review_state="verified",
        priority_score=p_score_1
    )

    p_score_2 = calculate_response_priority(0.68, "high", 0.90, 0.60)
    inc2 = Incident(
        id="inc-102",
        reporter_id=citizen.id,
        zone_id=z2.id,
        title="Urgent Medical Supplies Needed",
        description="Sub-center flooded. Insulin and basic wound dressing supplies needed.",
        category="medical",
        severity="high",
        status="reported",
        lat=24.8150, lng=92.8050,
        credibility_score=0.90,
        review_state="verified",
        priority_score=p_score_2
    )

    db.add_all([inc1, inc2])
    db.commit()

    return {
        "status": "success",
        "message": "Assam Cachar Flood scenario reset successfully",
        "zones_seeded": 3,
        "incidents_seeded": 2,
        "rescue_sites_seeded": 2,
        "resources_seeded": 3
    }
