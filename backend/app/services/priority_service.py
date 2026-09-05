# TEAM OWNERSHIP: MEMBER 4 — AI / DATA / INTELLIGENCE
# Response priority scoring formula combining risk, severity, credibility, and vulnerability.
# Coordinate before modifying outside this workstream.
from typing import Optional


VULNERABILITY_CONTEXT_INDEX = {
    "medical_emergency": 1.0,
    "pregnant": 0.9,
    "child_infant": 0.85,
    "elderly": 0.8,
    "disability_mobility_difficulty": 0.8,
    "multiple_people": 0.75,
    "none": 0.0,
    "other": 0.0,
}


def calculate_response_priority(
    risk_score: float,          # 0.0 to 1.0
    severity: str,               # low, medium, high, critical
    credibility_score: float,   # 0.0 to 1.0
    vulnerability_index: float,  # 0.0 to 1.0
    vulnerability_context: Optional[str] = None,
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
    
    # Keep the zone's demographic vulnerability as the baseline. A reporter's
    # SOS context can only raise that factor; omitted/none/other context keeps
    # the established score unchanged. Medical emergencies are intentionally
    # the highest contextual urgency.
    context_index = VULNERABILITY_CONTEXT_INDEX.get(vulnerability_context or "", 0.0)
    effective_vulnerability_index = max(vulnerability_index, context_index)

    weighted_score = (
        (risk_score * 0.30) +
        (sev_w * 0.30) +
        (credibility_score * 0.20) +
        (effective_vulnerability_index * 0.20)
    )
    
    return round(float(weighted_score * 100), 2)
