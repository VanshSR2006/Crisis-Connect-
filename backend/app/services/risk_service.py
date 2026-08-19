# TEAM OWNERSHIP: MEMBER 4 — AI / DATA / INTELLIGENCE
# Flood risk ML model (scikit-learn logistic regression) and training data.
# Coordinate before modifying outside this workstream.
# pyrefly: ignore [missing-import]
import numpy as np
from sklearn.linear_model import LogisticRegression

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
