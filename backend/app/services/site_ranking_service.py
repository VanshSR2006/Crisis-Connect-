# TEAM OWNERSHIP: MEMBER 5 — OPTIMIZATION + RESPONSE PLAN + DEMO
# Multi-factor rescue site ranking algorithm (Haversine distance, suitability formula).
# Coordinate before modifying outside this workstream.
import math

def calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def rank_rescue_sites(
    incident_lat: float,
    incident_lng: float,
    predicted_flood_level_m: float,
    sites: list
):
    """
    Ranks candidate rescue sites using multi-factor suitability formula.
    """
    ranked_results = []
    
    for site in sites:
        elevation = site.get("elevation_m", 10.0)
        predicted_margin = elevation - predicted_flood_level_m
        capacity = site.get("capacity", 500)
        occupancy = site.get("current_occupancy", 0)
        available_cap = max(0, capacity - occupancy)
        access_status = site.get("access_status", "accessible")
        
        dist_km = calculate_haversine_km(
            incident_lat, incident_lng,
            site.get("lat", 0.0), site.get("lng", 0.0)
        )

        # 1. Elevation score (30%)
        elevation_score = min(1.0, max(0.0, elevation / 50.0))
        
        # 2. Flood margin score (25%)
        margin_score = 1.0 if predicted_margin > 2.0 else (0.5 if predicted_margin > 0.0 else 0.0)
        
        # 3. Available capacity score (25%)
        cap_score = min(1.0, available_cap / max(1, capacity))
        
        # 4. Access score (10%)
        access_score = 1.0 if access_status == "accessible" else (0.5 if access_status == "limited" else 0.0)
        
        # 5. Distance score (10%)
        dist_score = max(0.0, 1.0 - (dist_km / 25.0))

        suitability = (
            (elevation_score * 0.30) +
            (margin_score * 0.25) +
            (cap_score * 0.25) +
            (access_score * 0.10) +
            (dist_score * 0.10)
        ) * 100

        reasons = {
            "elevation_m": f"{elevation}m ({'+' if predicted_margin >= 0 else ''}{round(predicted_margin, 1)}m margin)",
            "capacity_available": f"{available_cap}/{capacity} spots free",
            "distance_km": f"{round(dist_km, 2)} km away",
            "access_status": access_status.capitalize()
        }

        ranked_results.append({
            **site,
            "suitability_score": round(suitability, 1),
            "predicted_flood_margin_m": round(predicted_margin, 2),
            "distance_km": round(dist_km, 2),
            "available_capacity": available_cap,
            "reason_breakdown": reasons
        })

    # Sort descending by suitability score
    ranked_results.sort(key=lambda x: x["suitability_score"], reverse=True)
    return ranked_results
