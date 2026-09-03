# TEAM OWNERSHIP: MEMBER 5 — OPTIMIZATION + RESPONSE PLAN + DEMO
# Multi-factor rescue site ranking algorithm (Haversine distance, suitability formula).
# Coordinate before modifying outside this workstream.
import math
from typing import List, Dict, Any

MAX_RESCUE_SITE_DISTANCE_KM = 200.0

def calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two point pairs on Earth in kilometers.
    """
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c
def rank_rescue_sites(
    incident_lat: float,
    incident_lng: float,
    sites: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Ranks candidate rescue sites using a deterministic multi-factor suitability formula:
      1. Elevation (25% weight)
      2. Flood/Water Safety Margin (25% weight)
      3. Capacity & Available Headroom (25% weight)
      4. Accessibility (15% weight)
      5. Distance Proximity (10% weight)
    Unsafe or full sites (negative flood margin, 0 available spots, blocked access, closed status)
    are marked as unsuitable, assigned a suitability_score of 0.0, and provided with explicit
    rejection reasons so they are never recommended as the best site.
    """
    ranked_results = []
    for site in sites:
        elevation = float(site.get("elevation_m", 10.0))
        predicted_margin = float(site.get("predicted_flood_margin_m", 0.0))
        capacity = max(0, int(site.get("capacity", 500)))
        occupancy = max(0, int(site.get("current_occupancy", 0)))
        available_cap = max(0, capacity - occupancy)
        access_status = str(site.get("access_status", "accessible")).strip().lower()
        status = str(site.get("status", "open")).strip().lower()
        site_lat = float(site.get("lat", 0.0))
        site_lng = float(site.get("lng", 0.0))
        dist_km = calculate_haversine_km(incident_lat, incident_lng, site_lat, site_lng)

        # 0. Geographic Eligibility Constraint
        if dist_km > MAX_RESCUE_SITE_DISTANCE_KM:
            continue

        # ---------------------------------------------------------------------
        # 1. Availability and Safety Constraint Validation
        # ---------------------------------------------------------------------
        rejection_reasons = []
        if available_cap <= 0 or status in ["full", "depleted"]:
            rejection_reasons.append(f"Site is at full capacity ({occupancy}/{capacity} occupied)")
        if predicted_margin <= 0.0 or status in ["flooded", "unsafe", "damaged"]:
            rejection_reasons.append(
                f"Unsafe water level! Safety margin is {round(predicted_margin, 2)}m (must be > 0)."
            )
        if access_status in ["blocked", "impassable", "closed"]:
            rejection_reasons.append(f"Access route is blocked (status: '{access_status}')")
        if status in ["closed", "inactive", "offline"]:
            rejection_reasons.append(f"Site operational status is '{status}'")
        is_suitable = len(rejection_reasons) == 0
        # ---------------------------------------------------------------------
        # 2. Multi-Factor Deterministic Scoring (for suitable sites)
        # ---------------------------------------------------------------------
        if is_suitable:
            # Elevation score (25% weight / max 25 pts)
            # Scores baseline ground height; 50m+ terrain gets full 1.0
            elevation_score = min(1.0, max(0.0, elevation / 50.0))
            elev_pts = elevation_score * 25.0
            # Flood margin score (25% weight / max 25 pts)
            # Margin >= 5.0m gets full 1.0 credit; positive margins scale proportionally
            margin_score = min(1.0, max(0.0, predicted_margin / 5.0))
            margin_pts = margin_score * 25.0
            # Available capacity & headroom score (25% weight / max 25 pts)
            cap_ratio = available_cap / max(1, capacity)
            cap_score = min(1.0, max(0.0, cap_ratio))
            cap_pts = cap_score * 25.0
            # Accessibility score (15% weight / max 15 pts)
            if access_status in ["accessible", "clear", "open"]:
                access_score = 1.0
            elif access_status in ["limited", "caution"]:
                access_score = 0.5
            else:
                access_score = 0.0
            access_pts = access_score * 15.0
            # Distance proximity score (10% weight / max 10 pts)
            # Linear decay up to 30km radius
            dist_score = max(0.0, 1.0 - (dist_km / 30.0))
            dist_pts = dist_score * 10.0
            total_score = elev_pts + margin_pts + cap_pts + access_pts + dist_pts
            suitability_score = round(total_score, 1)
            rejection_summary = "None (Site is safe and operational)"
        else:
            elev_pts = 0.0
            margin_pts = 0.0
            cap_pts = 0.0
            access_pts = 0.0
            dist_pts = 0.0
            suitability_score = 0.0
            rejection_summary = "REJECTED: " + "; ".join(rejection_reasons)
        factor_breakdown_str = (
            f"Elevation: {round(elev_pts, 1)}/25, "
            f"Flood Margin: {round(margin_pts, 1)}/25, "
            f"Capacity: {round(cap_pts, 1)}/25, "
            f"Access: {round(access_pts, 1)}/15, "
            f"Distance: {round(dist_pts, 1)}/10"
        )
        safety_status_str = (
            f"SAFE (+{round(predicted_margin, 2)}m margin)"
            if predicted_margin > 0
            else f"UNSAFE ({round(predicted_margin, 2)}m margin below flood level)"
        )
        reasons = {
            "elevation_m": f"{elevation}m ({'+' if predicted_margin >= 0 else ''}{round(predicted_margin, 1)}m margin)",
            "capacity_available": f"{available_cap}/{capacity} spots free",
            "distance_km": f"{round(dist_km, 2)} km away",
            "access_status": access_status.capitalize(),
            "safety_info": safety_status_str,
            "rejection_reason": rejection_summary,
            "factor_breakdown": factor_breakdown_str
        }
        ranked_results.append({
            **site,
            "suitability_score": suitability_score,
            "predicted_flood_margin_m": round(predicted_margin, 2),
            "distance_km": round(dist_km, 2),
            "available_capacity": available_cap,
            "reason_breakdown": reasons
        })
    # Sort descending: suitable sites first by suitability_score, resolving ties by closer distance.
    # Unsuitable sites (suitability_score == 0.0) are placed at the bottom.
    ranked_results.sort(
        key=lambda s: (s["suitability_score"] > 0, s["suitability_score"], -s["distance_km"]),
        reverse=True
    )
    return ranked_results
