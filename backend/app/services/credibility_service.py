"""
Crisis Connect — SOS Credibility / Verification Intelligence

Member 4 — AI / Data / Intelligence

Calculates a deterministic credibility score for an incident using
signals available in the existing Incident and Zone models.

Signals:
- duplicate/similar nearby reports
- coordinate consistency with the claimed zone
- basic metadata validity
- text quality/similarity

Suspicious incidents are flagged for review; they are never deleted.
"""

import json
import math
import re
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from ..models import Incident, Zone


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DUPLICATE_DISTANCE_M = 100.0
TEXT_SIMILARITY_THRESHOLD = 0.80

DEFAULT_CREDIBILITY_SCORE = 1.0
MIN_CREDIBILITY_SCORE = 0.0
MAX_CREDIBILITY_SCORE = 1.0


# ---------------------------------------------------------------------------
# Basic helpers
# ---------------------------------------------------------------------------

def _normalize_text(value: Optional[str]) -> str:
    """Normalize text for deterministic comparison."""
    if not value:
        return ""

    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value)

    return value


def _text_similarity(left: str, right: str) -> float:
    """
    Simple deterministic token Jaccard similarity.

    Returns a value between 0 and 1.
    """
    left_tokens = set(_normalize_text(left).split())
    right_tokens = set(_normalize_text(right).split())

    if not left_tokens or not right_tokens:
        return 0.0

    intersection = left_tokens.intersection(right_tokens)
    union = left_tokens.union(right_tokens)

    if not union:
        return 0.0

    return len(intersection) / len(union)


def _haversine_distance_m(
    lat1: float,
    lng1: float,
    lat2: float,
    lng2: float,
) -> float:
    """Return distance between two coordinates in metres."""
    earth_radius_m = 6_371_000.0

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lng / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1 - a)))

    return earth_radius_m * c


# ---------------------------------------------------------------------------
# GeoJSON coordinate handling
# ---------------------------------------------------------------------------

def _point_in_polygon(
    lat: float,
    lng: float,
    polygon: List[List[List[float]]],
) -> bool:
    """
    Ray-casting point-in-polygon check.

    GeoJSON coordinates are [longitude, latitude].
    Supports Polygon outer rings.
    """

    if not polygon:
        return False

    ring = polygon[0]

    if len(ring) < 3:
        return False

    inside = False
    x = lng
    y = lat

    j = len(ring) - 1

    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]

        intersects = (
            ((yi > y) != (yj > y))
            and (
                x
                < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi
            )
        )

        if intersects:
            inside = not inside

        j = i

    return inside


def _coordinate_matches_zone(
    incident: Incident,
    zone: Optional[Zone],
) -> Tuple[bool, str]:
    """
    Check whether the incident coordinate lies inside the zone boundary.

    If no usable boundary exists, the signal is treated as unavailable
    rather than automatically suspicious.
    """

    if zone is None:
        return False, "zone_not_found"

    if not zone.boundary_json:
        return False, "zone_boundary_unavailable"

    try:
        geojson = json.loads(zone.boundary_json)
    except (TypeError, ValueError, json.JSONDecodeError):
        return False, "zone_boundary_invalid"

    geometry = geojson.get("geometry", geojson)

    if geometry.get("type") != "Polygon":
        return False, "zone_boundary_not_polygon"

    coordinates = geometry.get("coordinates")

    if not coordinates:
        return False, "zone_boundary_empty"

    matches = _point_in_polygon(
        incident.lat,
        incident.lng,
        coordinates,
    )

    if matches:
        return True, "coordinate_inside_zone"

    return False, "coordinate_outside_zone"


# ---------------------------------------------------------------------------
# Duplicate detection
# ---------------------------------------------------------------------------

def _find_duplicate_signals(
    incident: Incident,
    existing_incidents: List[Incident],
) -> List[Dict[str, Any]]:
    """
    Find nearby incidents that appear to describe the same event.
    """

    signals: List[Dict[str, Any]] = []
    inc_id = getattr(incident, "id", None)
    for other in existing_incidents:
        if inc_id and other.id == inc_id:
            continue

        distance = _haversine_distance_m(
            incident.lat,
            incident.lng,
            other.lat,
            other.lng,
        )

        if distance > DUPLICATE_DISTANCE_M:
            continue

        text_similarity = _text_similarity(
            incident.description or "",
            other.description or "",
        )

        same_category = (
            incident.category == other.category
        )

        same_severity = (
            incident.severity == other.severity
        )

        if (
            text_similarity >= TEXT_SIMILARITY_THRESHOLD
            or (same_category and same_severity and distance <= 50.0)
        ):
            signals.append(
                {
                    "incident_id": other.id,
                    "distance_m": round(distance, 2),
                    "text_similarity": round(text_similarity, 3),
                    "same_category": same_category,
                    "same_severity": same_severity,
                }
            )

    return signals


# ---------------------------------------------------------------------------
# Main credibility calculation
# ---------------------------------------------------------------------------

def calculate_incident_credibility(
    incident: Incident,
    db: Session,
) -> Dict[str, Any]:
    """
    Calculate deterministic credibility intelligence for an incident.

    Returns:
        credibility_score: float between 0 and 1
        review_state: "verified" or "flagged"
        suspicious: bool
        signals: structured signal information
        reason: human-readable explanation
    """

    score = DEFAULT_CREDIBILITY_SCORE
    reasons: List[str] = []
    signals: Dict[str, Any] = {}

    # ---------------------------------------------------------------
    # 1. Basic metadata validation
    # ---------------------------------------------------------------

    metadata_issues: List[str] = []

    if not incident.category:
        metadata_issues.append("missing_category")

    if not incident.severity:
        metadata_issues.append("missing_severity")

    if not incident.description or not incident.description.strip():
        metadata_issues.append("missing_description")

    if not incident.zone_id:
        metadata_issues.append("missing_zone")

    if not (
        -90.0 <= incident.lat <= 90.0
        and -180.0 <= incident.lng <= 180.0
    ):
        metadata_issues.append("invalid_coordinates")

    signals["metadata"] = {
        "issues": metadata_issues,
        "valid": len(metadata_issues) == 0,
    }

    if metadata_issues:
        score -= 0.10
        reasons.append(
            "metadata issues: " + ", ".join(metadata_issues)
        )

    # ---------------------------------------------------------------
    # 2. Text quality
    # ---------------------------------------------------------------

    normalized_description = _normalize_text(
        incident.description
    )

    text_signal = {
        "length": len(normalized_description),
        "usable": len(normalized_description) >= 10,
    }

    signals["text"] = text_signal

    if not text_signal["usable"]:
        score -= 0.10
        reasons.append("description is missing or too short")

    # ---------------------------------------------------------------
    # 3. Coordinate consistency with claimed zone
    # ---------------------------------------------------------------

    zone = None

    if incident.zone_id:
        zone = (
            db.query(Zone)
            .filter(Zone.id == incident.zone_id)
            .first()
        )

    coordinate_matches, coordinate_reason = (
        _coordinate_matches_zone(
            incident,
            zone,
        )
    )

    signals["coordinate"] = {
        "matches_zone": coordinate_matches,
        "reason": coordinate_reason,
    }

    if coordinate_reason == "coordinate_outside_zone":
        score -= 0.35
        reasons.append(
            "incident coordinates are outside the claimed zone"
        )

    # ---------------------------------------------------------------
    # 4. Duplicate / nearby report detection
    # ---------------------------------------------------------------

    existing_incidents = (
        db.query(Incident)
        .filter(Incident.zone_id == incident.zone_id)
        .all()
    )

    duplicate_signals = _find_duplicate_signals(
        incident,
        existing_incidents,
    )

    signals["duplicates"] = duplicate_signals

    if duplicate_signals:
        score -= 0.40
        reasons.append(
            f"{len(duplicate_signals)} similar nearby incident(s) detected"
        )

    # ---------------------------------------------------------------
    # 5. Final result
    # ---------------------------------------------------------------

    score = max(
        MIN_CREDIBILITY_SCORE,
        min(MAX_CREDIBILITY_SCORE, score),
    )

    suspicious = (
        bool(duplicate_signals)
        or coordinate_reason == "coordinate_outside_zone"
        or bool(metadata_issues)
        or not text_signal["usable"]
    )

    review_state = "flagged" if suspicious else "verified"

    if not reasons:
        reasons.append(
            "no suspicious credibility signals detected"
        )

    return {
        "credibility_score": float(round(score, 4)),
        "review_state": review_state,
        "suspicious": suspicious,
        "signals": signals,
        "reason": "; ".join(reasons),
    }