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

from ..core.security import hash_password, require_officer

router = APIRouter(prefix="/auth", tags=["Authentication"]) if False else APIRouter(prefix="/demo", tags=["Demo Scenario"])

@router.post("/reset-scenario")
def reset_demo_scenario(
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
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
    # Note: Do NOT delete all users so non-demo users persist.
    db.commit()

    # 2. Upsert Canonical Demo Users by phone/email
    default_hash = hash_password("DemoPassword123")
    canonical_users = [
        {"id": "usr-officer-1", "name": "Officer R. Sharma", "phone": "1111111110", "email": "command.officer@crisisconnect.org", "role": "officer", "language_pref": "en"},
        {"id": "usr-officer-2", "name": "Command Officer", "phone": "9876543210", "email": "officer2@crisisconnect.org", "role": "officer", "language_pref": "en"},
        {"id": "usr-volunteer-1", "name": "Volunteer Team Alpha", "phone": "1111111111", "email": "volunteer.lead@crisisconnect.org", "role": "volunteer", "language_pref": "en"},
        {"id": "usr-volunteer-2", "name": "Volunteer Priya Patel", "phone": "9876543211", "email": "volunteer2@crisisconnect.org", "role": "volunteer", "language_pref": "en"},
        {"id": "usr-citizen-1", "name": "Anita Das", "phone": "1111111112", "email": "citizen@crisisconnect.org", "role": "citizen", "language_pref": "en"},
        {"id": "usr-citizen-2", "name": "Ramesh Kumar", "phone": "9876543212", "email": "ramesh@crisisconnect.org", "role": "citizen", "language_pref": "en"},
    ]

    for cdata in canonical_users:
        user_by_phone = db.query(User).filter(User.phone == cdata["phone"]).first()
        user_by_id = db.query(User).filter(User.id == cdata["id"]).first()

        target_user = user_by_phone or user_by_id
        if target_user:
            target_user.id = cdata["id"]
            target_user.name = cdata["name"]
            target_user.phone = cdata["phone"]
            target_user.email = cdata["email"]
            target_user.role = cdata["role"]
            target_user.language_pref = cdata["language_pref"]
            if not target_user.password_hash:
                target_user.password_hash = default_hash
        else:
            new_user = User(
                id=cdata["id"],
                name=cdata["name"],
                phone=cdata["phone"],
                email=cdata["email"],
                role=cdata["role"],
                language_pref=cdata["language_pref"],
                password_hash=default_hash
            )
            db.add(new_user)

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

    # --- New Geographic Demo Sites (India Wide) ---
    site_delhi = RescueSite(id="site-delhi-1", name="Delhi NCR Emergency Rescue Site", lat=28.6139, lng=77.2090, elevation_m=210.0, predicted_flood_margin_m=5.0, capacity=1000, current_occupancy=200, access_status="accessible", zone_id=None)
    site_chd = RescueSite(id="site-chd-1", name="Chandigarh Regional Rescue Site", lat=30.7333, lng=76.7794, elevation_m=321.0, predicted_flood_margin_m=4.5, capacity=500, current_occupancy=50, access_status="accessible", zone_id=None)
    site_jaipur = RescueSite(id="site-jaipur-1", name="Jaipur Emergency Shelter", lat=26.9124, lng=75.7873, elevation_m=431.0, predicted_flood_margin_m=10.0, capacity=600, current_occupancy=100, access_status="accessible", zone_id=None)
    site_lucknow = RescueSite(id="site-lucknow-1", name="Lucknow Central Rescue Site", lat=26.8467, lng=80.9462, elevation_m=123.0, predicted_flood_margin_m=3.0, capacity=800, current_occupancy=300, access_status="accessible", zone_id=None)
    site_kolkata = RescueSite(id="site-kolkata-1", name="Kolkata Coastal Relief Center", lat=22.5726, lng=88.3639, elevation_m=9.0, predicted_flood_margin_m=1.5, capacity=1200, current_occupancy=900, access_status="limited", zone_id=None)
    site_guwahati = RescueSite(id="site-guwahati-1", name="Guwahati Secondary Rescue Site", lat=26.1445, lng=91.7362, elevation_m=55.0, predicted_flood_margin_m=2.0, capacity=400, current_occupancy=50, access_status="accessible", zone_id=None)
    site_bhubaneswar = RescueSite(id="site-bhubaneswar-1", name="Bhubaneswar Cyclone Shelter", lat=20.2961, lng=85.8245, elevation_m=45.0, predicted_flood_margin_m=6.0, capacity=750, current_occupancy=250, access_status="accessible", zone_id=None)
    site_mumbai = RescueSite(id="site-mumbai-1", name="Mumbai Regional Rescue Site", lat=19.0760, lng=72.8777, elevation_m=14.0, predicted_flood_margin_m=2.5, capacity=1500, current_occupancy=800, access_status="accessible", zone_id=None)
    site_pune = RescueSite(id="site-pune-1", name="Pune Highland Shelter", lat=18.5204, lng=73.8567, elevation_m=560.0, predicted_flood_margin_m=15.0, capacity=600, current_occupancy=100, access_status="accessible", zone_id=None)
    site_ahmedabad = RescueSite(id="site-ahmedabad-1", name="Ahmedabad Relief Camp", lat=23.0225, lng=72.5714, elevation_m=53.0, predicted_flood_margin_m=4.0, capacity=900, current_occupancy=400, access_status="accessible", zone_id=None)
    site_bhopal = RescueSite(id="site-bhopal-1", name="Bhopal Emergency Rescue Site", lat=23.2599, lng=77.4126, elevation_m=527.0, predicted_flood_margin_m=8.0, capacity=550, current_occupancy=120, access_status="accessible", zone_id=None)
    site_hyderabad = RescueSite(id="site-hyderabad-1", name="Hyderabad Central Shelter", lat=17.3850, lng=78.4867, elevation_m=542.0, predicted_flood_margin_m=12.0, capacity=1100, current_occupancy=450, access_status="accessible", zone_id=None)
    site_bengaluru = RescueSite(id="site-bengaluru-1", name="Bengaluru Emergency Rescue Site", lat=12.9716, lng=77.5946, elevation_m=920.0, predicted_flood_margin_m=20.0, capacity=1000, current_occupancy=200, access_status="accessible", zone_id=None)
    site_chennai = RescueSite(id="site-chennai-1", name="Chennai Coastal Rescue Camp", lat=13.0827, lng=80.2707, elevation_m=6.0, predicted_flood_margin_m=1.0, capacity=1300, current_occupancy=950, access_status="limited", zone_id=None)
    site_kochi = RescueSite(id="site-kochi-1", name="Kochi Relief Base", lat=9.9312, lng=76.2673, elevation_m=5.0, predicted_flood_margin_m=0.8, capacity=700, current_occupancy=650, access_status="accessible", zone_id=None)

    all_sites = [
        site1, site2,
        site_delhi, site_chd, site_jaipur, site_lucknow, site_kolkata,
        site_guwahati, site_bhubaneswar, site_mumbai, site_pune, site_ahmedabad,
        site_bhopal, site_hyderabad, site_bengaluru, site_chennai, site_kochi
    ]
    db.add_all(all_sites)
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
        reporter_id="usr-citizen-1",
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
        reporter_id="usr-citizen-1",
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
        "rescue_sites_seeded": len(all_sites),
        "resources_seeded": 3
    }
