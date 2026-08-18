def calculate_response_priority(
    risk_score: float,          # 0.0 to 1.0
    severity: str,               # low, medium, high, critical
    credibility_score: float,   # 0.0 to 1.0
    vulnerability_index: float  # 0.0 to 1.0
) -> float:
    """
    Computes unified 0-100 Response Priority Score for an incident.
    """
    severity_weights = {
        "low": 0.2,
        "medium": 0.5,
        "high": 0.8,
        "critical": 1.0
    }
    
    sev_w = severity_weights.get(severity.lower(), 0.5)
    
    weighted_score = (
        (risk_score * 0.30) +
        (sev_w * 0.30) +
        (credibility_score * 0.20) +
        (vulnerability_index * 0.20)
    )
    
    return round(float(weighted_score * 100), 2)
