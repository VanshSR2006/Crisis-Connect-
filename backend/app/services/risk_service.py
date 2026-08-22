# TEAM OWNERSHIP: MEMBER 4 — AI / DATA / INTELLIGENCE
# Flood risk ML model (scikit-learn logistic regression) and training data.
# Coordinate before modifying outside this workstream.
# pyrefly: ignore [missing-import]
import numpy as np
from sklearn.linear_model import LogisticRegression
from sqlalchemy.orm import Session

from ..models import Zone, WeatherReading, RiskScore, PopulationProfile

# Synthetic training dataset for Flood Risk Estimation Model
# Features: [rainfall_mm_24h, river_level_m, elevation_m, soil_saturation (0.0-1.0)]
X_train = np.array([
    [10.0, 1.2, 35.0, 0.2],
    [25.0, 2.0, 30.0, 0.4],
    [50.0, 3.1, 20.0, 0.6],
    [120.0, 4.5, 12.0, 0.85],
    [200.0, 5.8, 8.0, 0.95],
    [5.0, 0.8, 50.0, 0.1],
    [85.0, 4.0, 15.0, 0.75],
    [150.0, 5.2, 10.0, 0.9],
])
# Labels: 0 = low/normal, 1 = severe flood risk
y_train = np.array([0, 0, 0, 1, 1, 0, 1, 1])

risk_model = LogisticRegression()
risk_model.fit(X_train, y_train)

def calculate_flood_risk(rainfall_mm: float, river_level_m: float, elevation_m: float, soil_saturation: float = 0.5):
    """
    Evaluates flood risk probability using trained scikit-learn Logistic Regression model.
    Returns dict with probability score (0.0 - 1.0) and severity level label.
    """
    prob = risk_model.predict_proba([[rainfall_mm, river_level_m, elevation_m, soil_saturation]])[0][1]
    
    if prob < 0.25:
        level = "low"
    elif prob < 0.50:
        level = "medium"
    elif prob < 0.75:
        level = "high"
    else:
        level = "critical"

    return {
        "score": round(float(prob), 4),
        "risk_level": level,
        "rainfall_mm": rainfall_mm,
        "river_level_m": river_level_m,
        "elevation_m": elevation_m,
        "soil_saturation": soil_saturation
    }


# ---------------------------------------------------------------------------
# DB-aware wrapper — Member 4
#
# WeatherReading (see models.py) only stores rainfall_mm and river_level_m
# per zone. elevation_m and soil_saturation are NOT currently captured at
# the zone level anywhere in the schema. Rather than inventing per-zone
# values, this module documents fixed neutral defaults for those two
# inputs. These are placeholders until a real elevation/soil data source
# exists (flagged to Member 3 in the audit) and should not be read as
# measured data.
# ---------------------------------------------------------------------------

# Documented fallback constants (not measured data — see note above / audit).
DEFAULT_ELEVATION_M = 20.0        # midpoint of the training data's elevation range (8.0-50.0)
DEFAULT_SOIL_SATURATION = 0.5     # matches calculate_flood_risk()'s own default parameter

# Neutral fallback used ONLY when there is not enough data to compute a
# real score (missing zone or missing weather). Deliberately "medium" so
# it neither under- nor over-states risk when the system has no signal.
FALLBACK_RISK_SCORE = 0.5
FALLBACK_RISK_LEVEL = "medium"

# Vulnerability fallback, matching the convention already used in
# backend/app/routers/zones.py::get_zone_population for zones with no
# PopulationProfile row.
DEFAULT_VULNERABILITY_INDEX = 0.5


def get_zone_risk_snapshot(zone_id: str, db: Session) -> dict:
    """
    DB-aware wrapper around calculate_flood_risk() for a given zone.

    Looks up the zone's latest WeatherReading and PopulationProfile,
    computes (and persists) a fresh RiskScore when weather data is
    available, and always returns a safe, documented result even when
    the zone or its weather data is missing. Never raises for missing
    data, and never exposes ML/DB internals (sklearn objects, ORM
    instances, numpy types) to the caller.

    Returns exactly:
        {
            "risk_score": float,          # 0.0-1.0
            "risk_level": str,            # low | medium | high | critical
            "vulnerability_index": float, # 0.0-1.0
            "source": str,                # computed | fallback_no_weather | fallback_no_zone
            "reason": str,                # short human-readable trace
        }
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()

    if zone is None:
        return {
            "risk_score": FALLBACK_RISK_SCORE,
            "risk_level": FALLBACK_RISK_LEVEL,
            "vulnerability_index": DEFAULT_VULNERABILITY_INDEX,
            "source": "fallback_no_zone",
            "reason": f"Zone '{zone_id}' not found; using neutral fallback risk and vulnerability.",
        }

    latest_reading = (
        db.query(WeatherReading)
        .filter(WeatherReading.zone_id == zone_id)
        .order_by(WeatherReading.recorded_at.desc())
        .first()
    )

    # Vulnerability lookup follows the same fallback convention as
    # zones.py::get_zone_population (PopulationProfile row if present,
    # otherwise a fixed default). This applies regardless of whether
    # weather data exists, since it is looked up independently.
    pop_profile = db.query(PopulationProfile).filter(PopulationProfile.zone_id == zone_id).first()
    vulnerability_index = (
        pop_profile.vulnerability_index if pop_profile is not None else DEFAULT_VULNERABILITY_INDEX
    )

    if latest_reading is None:
        return {
            "risk_score": FALLBACK_RISK_SCORE,
            "risk_level": FALLBACK_RISK_LEVEL,
            "vulnerability_index": vulnerability_index,
            "source": "fallback_no_weather",
            "reason": f"No WeatherReading found for zone '{zone_id}'; using neutral fallback risk.",
        }

    result = calculate_flood_risk(
        rainfall_mm=latest_reading.rainfall_mm,
        river_level_m=latest_reading.river_level_m,
        elevation_m=DEFAULT_ELEVATION_M,
        soil_saturation=DEFAULT_SOIL_SATURATION,
    )

    new_score = RiskScore(
        zone_id=zone_id,
        risk_level=result["risk_level"],
        score=result["score"],
    )
    db.add(new_score)
    db.commit()

    return {
        "risk_score": result["score"],
        "risk_level": result["risk_level"],
        "vulnerability_index": vulnerability_index,
        "source": "computed",
        "reason": (
            f"Computed from WeatherReading recorded_at={latest_reading.recorded_at.isoformat()} "
            f"(rainfall_mm={latest_reading.rainfall_mm}, river_level_m={latest_reading.river_level_m}); "
            f"elevation_m and soil_saturation used documented defaults "
            f"({DEFAULT_ELEVATION_M}, {DEFAULT_SOIL_SATURATION}) since neither is stored per zone."
        ),
    }
