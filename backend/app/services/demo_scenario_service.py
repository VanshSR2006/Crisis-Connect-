# TEAM OWNERSHIP: MEMBER 5 — OPTIMIZATION + RESPONSE PLAN + DEMO
# Deterministic Demo Scenario Service for Assam Cachar Flood Response.
# Coordinate before modifying outside this workstream.

"""
Prepares and executes a single deterministic Assam Cachar flood demo scenario
by orchestrating all Member 5 services end-to-end:

  Phase 1 — Rescue-site ranking        (site_ranking_service)
  Phase 2 — Resource allocation         (resource_allocation_service)
  Phase 3 — Regional clustering         (resource_allocation_service)
  Phase 4 — Response plan generation    (response_plan_service)
  Phase 5 — Explain Decision            (explanation_service)
  Phase 6 — What-If simulation          (what_if_service)
"""

from typing import Dict, Any

# -------------------------------------------------------------------------
# Service imports (resilient to different import contexts)
# -------------------------------------------------------------------------
try:
    from .site_ranking_service import rank_rescue_sites
    from .resource_allocation_service import (
        allocate_resources,
        cluster_regional_rescues,
    )
    from .response_plan_service import generate_response_plan
    from .explanation_service import explain_decision
    from .what_if_service import simulate_what_if
except ImportError:
    try:
        from app.services.site_ranking_service import rank_rescue_sites
        from app.services.resource_allocation_service import (
            allocate_resources,
            cluster_regional_rescues,
        )
        from app.services.response_plan_service import generate_response_plan
        from app.services.explanation_service import explain_decision
        from app.services.what_if_service import simulate_what_if
    except ImportError:
        from site_ranking_service import rank_rescue_sites
        from resource_allocation_service import (
            allocate_resources,
            cluster_regional_rescues,
        )
        from response_plan_service import generate_response_plan
        from explanation_service import explain_decision
        from what_if_service import simulate_what_if


# =====================================================================
# Demo Fixture Data — Assam Cachar Flood Scenario
# =====================================================================

DEMO_SCENARIO_NAME = "Assam Cachar Flood Response — 2024"

DEMO_PREDICTED_FLOOD_LEVEL_M = 3.5

# ----- Rescue Sites (Phase 1) -----
DEMO_SITES = [
    {
        "id": "site-silchar-school",
        "name": "Silchar Higher Secondary School",
        "lat": 24.8333,
        "lng": 92.7789,
        "elevation_m": 12.0,
        "capacity": 400,
        "current_occupancy": 120,
        "access_status": "accessible",
        "status": "open",
    },
    {
        "id": "site-badarpur-community",
        "name": "Badarpur Community Hall",
        "lat": 24.8686,
        "lng": 92.5961,
        "elevation_m": 8.0,
        "capacity": 250,
        "current_occupancy": 200,
        "access_status": "limited",
        "status": "open",
    },
    {
        "id": "site-lakhipur-temple",
        "name": "Lakhipur Hilltop Temple",
        "lat": 24.7917,
        "lng": 93.0089,
        "elevation_m": 22.0,
        "capacity": 150,
        "current_occupancy": 10,
        "access_status": "accessible",
        "status": "open",
    },
    {
        "id": "site-sonai-depot",
        "name": "Sonai Relief Depot",
        "lat": 24.9500,
        "lng": 92.8667,
        "elevation_m": 2.5,
        "capacity": 300,
        "current_occupancy": 0,
        "access_status": "blocked",
        "status": "flooded",
    },
]

# ----- Resources (Phase 2) -----
DEMO_RESOURCES = [
    {
        "id": "res-boat-01",
        "name": "NDRF Rescue Boats",
        "category": "boat",
        "quantity": 8,
        "unit": "boats",
        "status": "available",
        "lat": 24.8200,
        "lng": 92.7500,
    },
    {
        "id": "res-medical-01",
        "name": "Silchar District Medical Kits",
        "category": "medical",
        "quantity": 50,
        "unit": "kits",
        "status": "available",
        "lat": 24.8333,
        "lng": 92.7789,
    },
    {
        "id": "res-food-01",
        "name": "SDRF Food Rations",
        "category": "food",
        "quantity": 300,
        "unit": "packets",
        "status": "available",
        "lat": 24.8400,
        "lng": 92.8000,
    },
    {
        "id": "res-water-01",
        "name": "Potable Water Pouches",
        "category": "water",
        "quantity": 200,
        "unit": "pouches",
        "status": "available",
        "lat": 24.8400,
        "lng": 92.8000,
    },
    {
        "id": "res-boat-02",
        "name": "Army Inflatable Rafts",
        "category": "boat",
        "quantity": 4,
        "unit": "rafts",
        "status": "available",
        "lat": 24.8700,
        "lng": 92.6000,
    },
]

# ----- Flood Incidents (Phase 2 + 3 + 4) -----
DEMO_INCIDENTS = [
    {
        "id": "inc-silchar-ward7",
        "title": "Silchar Ward-7 Residential Flooding",
        "lat": 24.8290,
        "lng": 92.7720,
        "zone_id": "zone-silchar-central",
        "severity": "critical",
        "priority_score": 95.0,
        "predicted_flood_level_m": 3.5,
        "requested_resources": {
            "boat": 5,
            "medical": 20,
            "food": 150,
            "water": 100,
        },
    },
    {
        "id": "inc-silchar-ward12",
        "title": "Silchar Ward-12 Marooned Families",
        "lat": 24.8350,
        "lng": 92.7850,
        "zone_id": "zone-silchar-central",
        "severity": "high",
        "priority_score": 80.0,
        "predicted_flood_level_m": 3.2,
        "requested_resources": {
            "boat": 3,
            "medical": 10,
            "food": 100,
            "water": 80,
        },
    },
    {
        "id": "inc-badarpur-lowland",
        "title": "Badarpur Lowland Village Submersion",
        "lat": 24.8650,
        "lng": 92.5900,
        "zone_id": "zone-badarpur",
        "severity": "high",
        "priority_score": 78.0,
        "predicted_flood_level_m": 4.0,
        "requested_resources": {
            "boat": 6,
            "medical": 15,
            "food": 200,
            "water": 150,
        },
    },
]


# =====================================================================
# Public function
# =====================================================================

def run_demo_scenario() -> Dict[str, Any]:
    """
    Execute the complete Assam Cachar Flood demo scenario end-to-end.

    Returns a single structured dictionary containing results from every
    Member 5 optimisation phase:

      - scenario_name          : human-readable scenario label
      - incident_summary       : overview of the demo incidents
      - selected_rescue_site   : Phase 1 top-ranked rescue site
      - ranked_sites           : Phase 1 full ranking list
      - resource_allocation    : Phase 2 allocation result
      - regional_clusters      : Phase 3 clustering result
      - response_plan          : Phase 4 response plan
      - explanation            : Phase 5 explain-decision output
      - what_if_result         : Phase 6 what-if simulation output
    """

    # -----------------------------------------------------------------
    # Phase 1 — Rescue-Site Ranking
    # -----------------------------------------------------------------
    # Use centroid of Silchar incidents as the reference point
    ref_lat = 24.8320
    ref_lng = 92.7785

    ranked_sites = rank_rescue_sites(
        incident_lat=ref_lat,
        incident_lng=ref_lng,
        predicted_flood_level_m=DEMO_PREDICTED_FLOOD_LEVEL_M,
        sites=DEMO_SITES,
    )

    selected_site = ranked_sites[0] if ranked_sites and ranked_sites[0].get("suitability_score", 0) > 0 else None

    # -----------------------------------------------------------------
    # Phase 2 — Resource Allocation
    # -----------------------------------------------------------------
    allocation_demands = [
        {
            "id": inc["id"],
            "target_name": inc["title"],
            "lat": inc["lat"],
            "lng": inc["lng"],
            "target_site_id": selected_site["id"] if selected_site else None,
            "priority_score": inc["priority_score"],
            "requested_resources": inc["requested_resources"],
        }
        for inc in DEMO_INCIDENTS
    ]

    allocation_result = allocate_resources(
        demands=allocation_demands,
        resources=DEMO_RESOURCES,
        sites=DEMO_SITES,
    )

    # -----------------------------------------------------------------
    # Phase 3 — Regional Clustering
    # -----------------------------------------------------------------
    clustering_result = cluster_regional_rescues(
        incidents=DEMO_INCIDENTS,
        resources=DEMO_RESOURCES,
        sites=DEMO_SITES,
        max_cluster_distance_km=5.0,
        predicted_flood_level_m=DEMO_PREDICTED_FLOOD_LEVEL_M,
    )

    # -----------------------------------------------------------------
    # Phase 4 — Response Plan
    # -----------------------------------------------------------------
    response_plan = generate_response_plan(
        incidents=DEMO_INCIDENTS,
        resources=DEMO_RESOURCES,
        sites=DEMO_SITES,
        max_cluster_distance_km=5.0,
        predicted_flood_level_m=DEMO_PREDICTED_FLOOD_LEVEL_M,
    )

    # -----------------------------------------------------------------
    # Phase 5 — Explain Decision
    # -----------------------------------------------------------------
    # Feed the first (highest-priority) plan item into explain_decision
    plan_items = response_plan.get("plans", [])
    explanation_input = plan_items[0] if plan_items else response_plan
    explanation = explain_decision(explanation_input)

    # -----------------------------------------------------------------
    # Phase 6 — What-If Simulation
    # -----------------------------------------------------------------
    # Build the decision snapshot from current data for what-if
    decision_snapshot = {
        "resources": [dict(r) for r in DEMO_RESOURCES],
        "sites": [dict(s) for s in DEMO_SITES],
        "demands": [dict(inc) for inc in DEMO_INCIDENTS],
        "allocations": allocation_result.get("allocations", []),
    }

    # Simulate: "What if NDRF boats are reduced from 8 to 3?"
    what_if_changes = {
        "resource_quantity": {
            "resource": "NDRF Rescue Boats",
            "new_quantity": 3,
        },
        "site_availability": {
            "site": "Sonai Relief Depot",
            "available": True,
        },
        "demand_quantity": {
            "demand": "inc-badarpur-lowland",
            "category": "boat",
            "new_quantity": 10,
        },
    }

    what_if_result = simulate_what_if(
        decision=decision_snapshot,
        changes=what_if_changes,
    )

    # -----------------------------------------------------------------
    # Incident Summary
    # -----------------------------------------------------------------
    incident_summary = {
        "total_incidents": len(DEMO_INCIDENTS),
        "region": "Cachar District, Assam",
        "predicted_flood_level_m": DEMO_PREDICTED_FLOOD_LEVEL_M,
        "incidents": [
            {
                "id": inc["id"],
                "title": inc["title"],
                "severity": inc["severity"],
                "priority_score": inc["priority_score"],
                "zone_id": inc["zone_id"],
                "lat": inc["lat"],
                "lng": inc["lng"],
                "resource_demands": inc["requested_resources"],
            }
            for inc in DEMO_INCIDENTS
        ],
    }

    # -----------------------------------------------------------------
    # Assemble full demo result
    # -----------------------------------------------------------------
    return {
        "scenario_name": DEMO_SCENARIO_NAME,
        "incident_summary": incident_summary,
        "selected_rescue_site": selected_site,
        "ranked_sites": ranked_sites,
        "resource_allocation": allocation_result,
        "regional_clusters": clustering_result,
        "response_plan": response_plan,
        "explanation": explanation,
        "what_if_result": what_if_result,
    }
