import pytest
from app.services.site_ranking_service import rank_rescue_sites, calculate_haversine_km, MAX_RESCUE_SITE_DISTANCE_KM

# Common mock site template
def create_site(id, name, lat, lng, capacity=100, occupancy=0, access="accessible", elev=10.0, flood_margin=2.0):
    return {
        "id": id,
        "name": name,
        "lat": lat,
        "lng": lng,
        "capacity": capacity,
        "current_occupancy": occupancy,
        "access_status": access,
        "elevation_m": elev,
        "predicted_flood_margin_m": flood_margin,
        "status": "open"
    }

# Mock database of sites geographically distributed
SITES = [
    create_site("delhi-1", "Delhi NCR Emergency", 28.6139, 77.2090),
    create_site("delhi-2", "Delhi Suburbs", 28.5355, 77.3910), # Noida
    create_site("assam-1", "Silchar HS School", 24.8250, 92.7950),
    create_site("mumbai-1", "Mumbai Coastal", 19.0760, 72.8777),
]

def test_delhi_incident_returns_delhi_sites():
    # Incident near Delhi
    incident_lat = 28.7041
    incident_lng = 77.1025
    predicted_flood_level = 5.0
    
    results = rank_rescue_sites(incident_lat, incident_lng, predicted_flood_level, SITES)
    
    # Should only return the two Delhi sites. Assam and Mumbai are too far.
    assert len(results) == 2
    assert results[0]["id"] in ["delhi-1", "delhi-2"]
    assert results[1]["id"] in ["delhi-1", "delhi-2"]

def test_assam_incident_returns_assam_sites():
    # Incident near Silchar
    incident_lat = 24.8000
    incident_lng = 92.8000
    predicted_flood_level = 5.0
    
    results = rank_rescue_sites(incident_lat, incident_lng, predicted_flood_level, SITES)
    
    # Should only return the Assam site.
    assert len(results) == 1
    assert results[0]["id"] == "assam-1"

def test_far_away_only_scenario():
    # Incident in Andaman and Nicobar Islands (far from all seeds)
    incident_lat = 11.7401
    incident_lng = 92.6586
    predicted_flood_level = 5.0
    
    results = rank_rescue_sites(incident_lat, incident_lng, predicted_flood_level, SITES)
    
    # Empty result because all sites > MAX_RESCUE_SITE_DISTANCE_KM
    assert len(results) == 0

def test_capacity_constraint():
    incident_lat = 28.6139
    incident_lng = 77.2090
    predicted_flood_level = 5.0
    
    # Site is at exactly the same location, but full
    full_site = create_site("full-1", "Full Site", 28.6139, 77.2090, capacity=100, occupancy=100)
    
    results = rank_rescue_sites(incident_lat, incident_lng, predicted_flood_level, [full_site])
    
    # Site is within distance, so it IS returned, but suitability_score should be 0.0
    assert len(results) == 1
    assert results[0]["suitability_score"] == 0.0
    assert "Site is at full capacity" in results[0]["reason_breakdown"]["rejection_reason"]

def test_access_constraint():
    incident_lat = 28.6139
    incident_lng = 77.2090
    predicted_flood_level = 5.0
    
    # Site is blocked
    blocked_site = create_site("blocked-1", "Blocked Site", 28.6139, 77.2090, access="blocked")
    
    results = rank_rescue_sites(incident_lat, incident_lng, predicted_flood_level, [blocked_site])
    
    # Site is within distance, so it IS returned, but suitability_score should be 0.0
    assert len(results) == 1
    assert results[0]["suitability_score"] == 0.0
    assert "Access route is blocked" in results[0]["reason_breakdown"]["rejection_reason"]

def test_distance_calculation():
    # Delhi to Noida
    dist = calculate_haversine_km(28.6139, 77.2090, 28.5355, 77.3910)
    # roughly 19-20 km
    assert 18.0 <= dist <= 22.0
    
    # Delhi to Mumbai
    dist_far = calculate_haversine_km(28.6139, 77.2090, 19.0760, 72.8777)
    # roughly 1100-1200 km
    assert 1100.0 <= dist_far <= 1250.0
