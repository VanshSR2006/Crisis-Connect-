# TEAM OWNERSHIP: MEMBER 5 — OPTIMIZATION + RESPONSE PLAN + DEMO
# Deterministic Response Plan Generation Engine for Emergency Operations.
# Coordinates outputs from Phase 1 (Site Ranking), Phase 2 (Resource Allocation), and Phase 3 (Regional Clustering).
# Coordinate before modifying outside this workstream.

from typing import List, Dict, Any, Optional

try:
    from .site_ranking_service import rank_rescue_sites
    from .resource_allocation_service import (
        allocate_resources,
        cluster_regional_rescues,
        normalize_category,
        parse_priority_score
    )
except ImportError:
    try:
        from app.services.site_ranking_service import rank_rescue_sites
        from app.services.resource_allocation_service import (
            allocate_resources,
            cluster_regional_rescues,
            normalize_category,
            parse_priority_score
        )
    except ImportError:
        from site_ranking_service import rank_rescue_sites
        from resource_allocation_service import (
            allocate_resources,
            cluster_regional_rescues,
            normalize_category,
            parse_priority_score
        )


def generate_response_plan(
    incidents: Optional[List[Dict[str, Any]]] = None,
    resources: Optional[List[Dict[str, Any]]] = None,
    sites: Optional[List[Dict[str, Any]]] = None,
    clusters: Optional[List[Dict[str, Any]]] = None,
    max_cluster_distance_km: float = 5.0,
    predicted_flood_level_m: float = 2.0,
    committed_allocations: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generates a structured, actionable, and deterministic disaster response plan.

    Reuses:
      - Phase 1 (rank_rescue_sites): Selects safest, highest-suitability rescue sites.
      - Phase 2 (allocate_resources): Deterministically allocates inventory and identifies shortages.
      - Phase 3 (cluster_regional_rescues): Consolidates nearby incidents into regional clusters.

    Features:
      1. Prioritizes critical and high-priority rescue operations before lower-priority ones.
      2. Assigns sequential execution order (response_sequence 1, 2, 3...).
      3. Integrates recommended rescue sites from Phase 1 ranking.
      4. Explicitly exposes resource shortages without pretending demand was fully met.
      5. Provides actionable alternative/recovery suggestions for shortages.
      6. Computes realistic ETAs without inventing fake coordinates.
      7. Generates human-readable recommendation summaries for field incident commanders.
      8. Completely deterministic (identical input produces identical response plan).
    """
    if incidents is None:
        incidents = []
    if resources is None:
        resources = []
    if sites is None:
        sites = []

    # -------------------------------------------------------------------------
    # 1. Edge Case: No Incidents and No Pre-formed Clusters
    # -------------------------------------------------------------------------
    if not incidents and not clusters:
        return {
            "plans": [],
            "summary": {
                "total_plans": 0,
                "total_incidents_covered": 0,
                "total_zones_covered": 0,
                "priority_breakdown": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0
                },
                "total_resources_requested": 0,
                "total_resources_allocated": 0,
                "total_shortage": 0,
                "is_fully_satisfied": True,
                "overall_status": "empty",
                "explanation": "No incidents or clusters provided. Response plan is empty."
            }
        }

    # -------------------------------------------------------------------------
    # 2. Acquire or Reuse Clusters from Phase 3
    # -------------------------------------------------------------------------
    if clusters is None:
        clustering_output = cluster_regional_rescues(
            incidents=incidents,
            resources=resources,
            sites=sites,
            max_cluster_distance_km=max_cluster_distance_km,
            predicted_flood_level_m=predicted_flood_level_m,
            committed_allocations=committed_allocations
        )
        raw_clusters = clustering_output.get("clusters", [])
    else:
        raw_clusters = clusters

    # -------------------------------------------------------------------------
    # 3. Sort Clusters Deterministically by Priority (Critical first) then ID
    # -------------------------------------------------------------------------
    # Stable sort key: priority score descending, then cluster_id ascending
    sorted_clusters = sorted(
        raw_clusters,
        key=lambda c: (
            c.get("highest_priority", {}).get("score", parse_priority_score(c.get("priority", 50.0))),
            str(c.get("cluster_id", ""))
        ),
        reverse=True
    )

    # -------------------------------------------------------------------------
    # 4. Build Structured Response Plan Items
    # -------------------------------------------------------------------------
    plan_items: List[Dict[str, Any]] = []
    priority_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    total_requested_sum = 0
    total_allocated_sum = 0
    total_shortage_sum = 0
    all_covered_incidents_set = set()
    all_covered_zones_set = set()

    for idx, cl in enumerate(sorted_clusters):
        seq_num = idx + 1
        cluster_id = str(cl.get("cluster_id", f"cluster-{seq_num}"))
        plan_id = f"plan-{cluster_id}"

        # Priority metadata
        hp = cl.get("highest_priority", {})
        p_score = float(hp.get("score", parse_priority_score(cl.get("priority", 50.0))))
        severity = str(hp.get("severity", "medium")).lower()
        if severity not in priority_counts:
            if p_score >= 85.0:
                severity = "critical"
            elif p_score >= 65.0:
                severity = "high"
            elif p_score >= 40.0:
                severity = "medium"
            else:
                severity = "low"
        priority_counts[severity] = priority_counts.get(severity, 0) + 1

        # Incidents & Zones covered
        member_incidents = cl.get("incidents", [])
        inc_ids = cl.get("incident_ids", [m.get("id") for m in member_incidents if m.get("id")])
        for inc_id in inc_ids:
            if inc_id:
                all_covered_incidents_set.add(str(inc_id))

        zones_covered = []
        for m in member_incidents:
            z = m.get("zone_id")
            if z and z not in zones_covered:
                zones_covered.append(z)
                all_covered_zones_set.add(str(z))
        zones_covered.sort()

        # Recommended Rescue Site from Phase 1
        recommended_site = cl.get("recommended_rescue_site")
        site_selection_reason = cl.get("site_selection_reason", "")

        # Allocated Resources from Phase 2
        allocations = cl.get("allocated_resources", [])
        # Deterministically sort allocations by category, then resource name, then resource ID
        sorted_allocations = sorted(
            allocations,
            key=lambda a: (str(a.get("category", "")), str(a.get("resource_name", "")), str(a.get("resource_id", "")))
        )

        allocated_totals = cl.get("allocated_totals", {})
        shortage_totals = cl.get("shortage_totals", {})
        total_demand = cl.get("total_demand", {})

        for cat, q in total_demand.items():
            total_requested_sum += int(q)
        for cat, q in allocated_totals.items():
            total_allocated_sum += int(q)
        for cat, q in shortage_totals.items():
            total_shortage_sum += int(q)

        # Build explicit shortage records & actionable recovery advice
        shortage_records: List[Dict[str, Any]] = []
        has_shortage = False

        # Stable iteration over category shortages
        for cat in sorted(shortage_totals.keys()):
            short_qty = int(shortage_totals[cat])
            if short_qty > 0:
                has_shortage = True
                req_qty = int(total_demand.get(cat, short_qty))
                alloc_qty = int(allocated_totals.get(cat, 0))

                # Grounded recovery actions based strictly on existing data
                alternative_actions = []
                if alloc_qty > 0:
                    alternative_actions.append(
                        f"Deploy initial batch of {alloc_qty} {cat}(s) immediately; queue wave-2 dispatch for remaining {short_qty}."
                    )
                if recommended_site and int(recommended_site.get("available_capacity", 1)) <= 0:
                    alternative_actions.append(
                        f"Target site '{recommended_site.get('name')}' is at capacity; divert evacuees to secondary suitable rescue shelter."
                    )
                alternative_actions.append(
                    f"Stockpile depleted for {cat}; request mutual aid / external regional stockpile replenishment of {short_qty} {cat}(s)."
                )

                shortage_records.append({
                    "category": cat,
                    "requested_quantity": req_qty,
                    "allocated_quantity": alloc_qty,
                    "shortage_quantity": short_qty,
                    "impact": f"Shortfall of {short_qty} {cat}(s) for {len(inc_ids)} incident(s) in {cluster_id}",
                    "suggested_actions": alternative_actions
                })

        # ETA
        eta_minutes = cl.get("estimated_eta_minutes")

        # Recommendation Summary for Field Officers
        site_name_str = recommended_site.get("name") if recommended_site else "None Available"
        alloc_summary_parts = [f"{q} {c}" for c, q in sorted(allocated_totals.items()) if q > 0]
        alloc_str = ", ".join(alloc_summary_parts) if alloc_summary_parts else "No resources allocated"

        shortage_summary_parts = [f"{q} {c}" for c, q in sorted(shortage_totals.items()) if q > 0]
        shortage_str = ", ".join(shortage_summary_parts) if shortage_summary_parts else "None"

        eta_str = f"{eta_minutes} mins" if eta_minutes is not None else "N/A"

        summary_text = (
            f"Response Sequence #{seq_num} [{severity.upper()}, Priority {round(p_score, 1)}]: "
            f"Consolidated {len(inc_ids)} incident(s) in {cluster_id} (Zones: {', '.join(zones_covered) if zones_covered else 'Unassigned'}). "
            f"Evacuation Site: {site_name_str}. "
            f"Allocated: {alloc_str} (ETA: {eta_str}). "
            f"Shortages: {shortage_str}."
        )

        plan_status = "ready"
        if has_shortage:
            plan_status = "partial_shortage" if total_allocated_sum > 0 else "unfulfilled_shortage"

        plan_items.append({
            "plan_id": plan_id,
            "cluster_id": cluster_id,
            "response_sequence": seq_num,
            "priority": {
                "score": round(p_score, 1),
                "severity": severity
            },
            "incidents_covered": inc_ids,
            "incident_count": len(inc_ids),
            "zones_covered": zones_covered,
            "recommended_rescue_site": recommended_site,
            "site_selection_reason": site_selection_reason,
            "allocated_resources": sorted_allocations,
            "allocated_totals": allocated_totals,
            "total_demand": total_demand,
            "has_shortage": has_shortage,
            "resource_shortages": shortage_records,
            "shortage_totals": shortage_totals,
            "estimated_eta_minutes": eta_minutes,
            "recommendation_summary": summary_text,
            "status": plan_status
        })

    # Overall Status
    if total_shortage_sum > 0:
        overall_status = "resource_constrained"
    elif total_requested_sum > 0:
        overall_status = "optimal"
    else:
        overall_status = "ready"

    overall_explanation = (
        f"Response plan generated {len(plan_items)} prioritized operational plan(s) covering "
        f"{len(all_covered_incidents_set)} incident(s) across {len(all_covered_zones_set)} zone(s). "
        f"Total resources requested: {total_requested_sum}, Allocated: {total_allocated_sum}, Shortage: {total_shortage_sum}. "
        f"Execution order prioritized strictly by incident severity."
    )

    return {
        "plans": plan_items,
        "summary": {
            "total_plans": len(plan_items),
            "total_incidents_covered": len(all_covered_incidents_set),
            "total_zones_covered": len(all_covered_zones_set),
            "priority_breakdown": priority_counts,
            "total_resources_requested": total_requested_sum,
            "total_resources_allocated": total_allocated_sum,
            "total_shortage": total_shortage_sum,
            "is_fully_satisfied": (total_shortage_sum == 0) and (total_requested_sum > 0),
            "overall_status": overall_status,
            "explanation": overall_explanation
        }
    }
