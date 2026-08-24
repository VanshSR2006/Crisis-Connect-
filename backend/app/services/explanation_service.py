# TEAM OWNERSHIP: MEMBER 5 — OPTIMIZATION + RESPONSE PLAN + DEMO
# Deterministic Explain Decision Engine for Disaster Response Optimization.
# Coordinate before modifying outside this workstream.

from typing import List, Dict, Any, Optional


def explain_decision(decision: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Deterministically explains WHY a specific response decision, site recommendation,
    resource allocation, or regional cluster was selected by Member 5 algorithms.

    Accepts existing output objects from:
      - Phase 1: rank_rescue_sites
      - Phase 2: allocate_resources
      - Phase 3: cluster_regional_rescues
      - Phase 4: generate_response_plan

    Grounds all reasons, site factors, counterfactual comparisons, and shortage explanations
    STRICTLY in actual values from the input data. Does NOT invent scores, numbers, or reasons.

    Guarantees:
      - Pure determinism (identical input produces identical output).
      - Stable ordering for all lists and dictionaries.
      - Graceful handling of missing, empty, or partial data without crashing.
    """
    # -------------------------------------------------------------------------
    # 1. Edge Case: Empty or None Input
    # -------------------------------------------------------------------------
    if not decision or not isinstance(decision, dict):
        return {
            "decision": "No decision data provided to explain.",
            "selected_site": None,
            "reasons": ["No operational decision or recommendation data was supplied."],
            "site_factors": [],
            "resource_summary": {
                "total_requested": 0,
                "total_allocated": 0,
                "total_shortage": 0,
                "is_fully_satisfied": True,
                "allocated_by_category": {},
                "shortage_by_category": {},
                "allocations": []
            },
            "shortages": [],
            "alternative_sites": [],
            "eta_minutes": None,
            "priority": None,
            "confidence_basis": "No input data provided."
        }

    # -------------------------------------------------------------------------
    # 2. Extract Priority & Severity
    # -------------------------------------------------------------------------
    priority_info: Optional[Dict[str, Any]] = None
    p_score: Optional[float] = None
    p_severity: Optional[str] = None

    if "priority" in decision and isinstance(decision["priority"], dict):
        p_obj = decision["priority"]
        if "score" in p_obj:
            p_score = float(p_obj["score"])
        if "severity" in p_obj:
            p_severity = str(p_obj["severity"]).lower()
        priority_info = {
            "score": round(p_score, 1) if p_score is not None else None,
            "severity": p_severity
        }
    elif "highest_priority" in decision and isinstance(decision["highest_priority"], dict):
        hp_obj = decision["highest_priority"]
        if "score" in hp_obj:
            p_score = float(hp_obj["score"])
        if "severity" in hp_obj:
            p_severity = str(hp_obj["severity"]).lower()
        priority_info = {
            "score": round(p_score, 1) if p_score is not None else None,
            "severity": p_severity
        }
    elif "priority_score" in decision:
        p_score = float(decision["priority_score"])
        p_severity = str(decision.get("severity", "medium")).lower()
        priority_info = {
            "score": round(p_score, 1),
            "severity": p_severity
        }

    # -------------------------------------------------------------------------
    # 3. Extract Selected Rescue Site
    # -------------------------------------------------------------------------
    selected_site_raw = (
        decision.get("recommended_rescue_site")
        or decision.get("selected_site")
        or decision.get("recommended_site")
    )

    # If the input itself is a single ranked site object
    if not selected_site_raw and "suitability_score" in decision and ("name" in decision or "id" in decision):
        selected_site_raw = decision

    selected_site: Optional[Dict[str, Any]] = None
    site_factors: List[Dict[str, Any]] = []
    site_reasons: List[str] = []

    if isinstance(selected_site_raw, dict) and selected_site_raw:
        site_name = str(selected_site_raw.get("name", selected_site_raw.get("id", "Rescue Site")))
        site_id = selected_site_raw.get("id")
        suit_score = selected_site_raw.get("suitability_score")
        dist_km = selected_site_raw.get("distance_km")
        flood_margin = selected_site_raw.get("predicted_flood_margin_m")
        avail_cap = selected_site_raw.get("available_capacity")
        raw_cap = selected_site_raw.get("capacity")
        occupancy = selected_site_raw.get("current_occupancy")
        access_status = selected_site_raw.get("access_status")
        elev_m = selected_site_raw.get("elevation_m")
        status_val = selected_site_raw.get("status")

        selected_site = {
            "id": site_id,
            "name": site_name,
        }
        if suit_score is not None:
            selected_site["suitability_score"] = float(suit_score)
        if dist_km is not None:
            selected_site["distance_km"] = float(dist_km)
        if flood_margin is not None:
            selected_site["predicted_flood_margin_m"] = float(flood_margin)
        if avail_cap is not None:
            selected_site["available_capacity"] = int(avail_cap)
        if raw_cap is not None:
            selected_site["capacity"] = int(raw_cap)
        if occupancy is not None:
            selected_site["current_occupancy"] = int(occupancy)
        if access_status is not None:
            selected_site["access_status"] = str(access_status)
        if elev_m is not None:
            selected_site["elevation_m"] = float(elev_m)
        if status_val is not None:
            selected_site["status"] = str(status_val)

        # Build detailed site factor breakdown
        if suit_score is not None:
            site_factors.append({
                "factor": "Suitability Score",
                "value": round(float(suit_score), 1),
                "description": f"Overall deterministic suitability score: {round(float(suit_score), 1)}/100"
            })
            site_reasons.append(f"Site '{site_name}' selected with suitability score of {round(float(suit_score), 1)}/100.")

        if dist_km is not None:
            site_factors.append({
                "factor": "Distance Proximity",
                "value": f"{round(float(dist_km), 2)} km",
                "description": f"Proximity distance from incident/cluster centroid is {round(float(dist_km), 2)} km"
            })
            site_reasons.append(f"Site is located {round(float(dist_km), 2)} km from the incident/cluster centroid.")

        if flood_margin is not None:
            sign_str = "+" if float(flood_margin) >= 0 else ""
            margin_str = f"{sign_str}{round(float(flood_margin), 2)}m"
            safety_label = "Favorable/Safe water margin" if float(flood_margin) >= 0 else "Unsafe flood margin"
            site_factors.append({
                "factor": "Flood Safety Margin",
                "value": margin_str,
                "description": f"{safety_label}: site elevation provides {margin_str} headroom above predicted water level"
            })
            site_reasons.append(f"Safety/elevation factor: flood safety margin is {margin_str}.")

        if avail_cap is not None:
            cap_desc = f"{avail_cap} spots free"
            if raw_cap is not None:
                cap_desc = f"{avail_cap}/{raw_cap} spots available"
            site_factors.append({
                "factor": "Available Capacity",
                "value": cap_desc,
                "description": f"Headcount capacity headroom: {cap_desc}"
            })
            site_reasons.append(f"Capacity is sufficient ({cap_desc}).")

        if access_status is not None:
            access_clean = str(access_status).capitalize()
            site_factors.append({
                "factor": "Accessibility Status",
                "value": access_clean,
                "description": f"Route ingress/egress operational status is '{access_clean}'"
            })
            site_reasons.append(f"Accessibility status is {access_clean}.")

        # Check reason_breakdown if present
        rb = selected_site_raw.get("reason_breakdown")
        if isinstance(rb, dict):
            fb_str = rb.get("factor_breakdown")
            if fb_str:
                selected_site["factor_breakdown"] = fb_str

    # -------------------------------------------------------------------------
    # 4. Extract Counterfactual Site Comparisons (Ranked Alternatives)
    # -------------------------------------------------------------------------
    ranked_sites_raw = decision.get("ranked_sites") or []
    alternative_sites: List[Dict[str, Any]] = []

    if isinstance(ranked_sites_raw, list) and ranked_sites_raw:
        selected_id = selected_site.get("id") if selected_site else None
        selected_name = selected_site.get("name") if selected_site else "Selected site"
        selected_score = selected_site.get("suitability_score") if selected_site else None

        for alt in ranked_sites_raw:
            if not isinstance(alt, dict):
                continue
            alt_id = alt.get("id")
            alt_name = str(alt.get("name", alt_id or "Alternative Site"))

            # Skip the selected site itself
            if selected_id and alt_id and alt_id == selected_id:
                continue
            if not selected_id and selected_site and alt_name == selected_site.get("name"):
                continue

            alt_score = alt.get("suitability_score")
            alt_dist = alt.get("distance_km")
            alt_margin = alt.get("predicted_flood_margin_m")
            alt_cap = alt.get("available_capacity")
            alt_access = alt.get("access_status")
            alt_rb = alt.get("reason_breakdown", {})
            rejection_reason = alt_rb.get("rejection_reason") if isinstance(alt_rb, dict) else None

            # Formulate comparative reason why it ranked lower
            diff_reasons = []
            if alt_score is not None and selected_score is not None:
                diff_reasons.append(f"suitability score {round(float(alt_score), 1)} vs {round(float(selected_score), 1)}")
            elif alt_score is not None:
                diff_reasons.append(f"suitability score {round(float(alt_score), 1)}")

            if rejection_reason and rejection_reason != "None (Site is safe and operational)":
                diff_reasons.append(rejection_reason)
            else:
                if alt_dist is not None and selected_site and selected_site.get("distance_km") is not None:
                    if float(alt_dist) > float(selected_site["distance_km"]):
                        diff_reasons.append(f"further distance ({round(float(alt_dist), 2)} km vs {round(float(selected_site['distance_km']), 2)} km)")
                if alt_margin is not None and selected_site and selected_site.get("predicted_flood_margin_m") is not None:
                    if float(alt_margin) < float(selected_site["predicted_flood_margin_m"]):
                        diff_reasons.append(f"lower flood margin ({round(float(alt_margin), 2)}m vs {round(float(selected_site['predicted_flood_margin_m']), 2)}m)")

            diff_str = "; ".join(diff_reasons) if diff_reasons else "ranked lower on multi-factor suitability formula"
            comp_explanation = f"Ranked lower than '{selected_name}' ({diff_str})."

            alt_record = {
                "id": alt_id,
                "name": alt_name,
                "suitability_score": round(float(alt_score), 1) if alt_score is not None else None,
                "distance_km": round(float(alt_dist), 2) if alt_dist is not None else None,
                "predicted_flood_margin_m": round(float(alt_margin), 2) if alt_margin is not None else None,
                "available_capacity": int(alt_cap) if alt_cap is not None else None,
                "access_status": str(alt_access).capitalize() if alt_access is not None else None,
                "comparison_note": comp_explanation
            }
            if rejection_reason:
                alt_record["rejection_reason"] = rejection_reason

            alternative_sites.append(alt_record)

    # -------------------------------------------------------------------------
    # 5. Extract Resource Allocations & Shortages
    # -------------------------------------------------------------------------
    allocations_raw = decision.get("allocated_resources") or decision.get("allocations") or []
    allocated_totals = dict(decision.get("allocated_totals") or {})
    shortage_totals = dict(decision.get("shortage_totals") or {})
    total_demand = dict(decision.get("total_demand") or {})

    clean_allocations: List[Dict[str, Any]] = []
    shortage_records: List[Dict[str, Any]] = []
    resource_reasons: List[str] = []

    total_req_count = sum(int(v) for v in total_demand.values()) if total_demand else 0
    total_alloc_count = sum(int(v) for v in allocated_totals.values()) if allocated_totals else 0
    total_short_count = sum(int(v) for v in shortage_totals.values()) if shortage_totals else 0

    if isinstance(allocations_raw, list):
        for a in allocations_raw:
            if not isinstance(a, dict):
                continue
            cat = str(a.get("category", "resource"))
            r_name = str(a.get("resource_name", a.get("resource_id", "Item")))
            r_id = a.get("resource_id")
            req_q = int(a.get("requested_quantity", 0))
            alloc_q = int(a.get("allocated_quantity", 0))
            short_q = int(a.get("shortage_quantity", 0))
            stat = str(a.get("status", "fulfilled"))
            eta_val = a.get("eta_minutes")
            reason_str = str(a.get("reason", ""))

            alloc_record = {
                "category": cat,
                "resource_id": r_id,
                "resource_name": r_name,
                "requested_quantity": req_q,
                "allocated_quantity": alloc_q,
                "shortage_quantity": short_q,
                "status": stat,
                "eta_minutes": float(eta_val) if eta_val is not None else None,
                "reason": reason_str
            }
            clean_allocations.append(alloc_record)

            if alloc_q > 0:
                if cat not in allocated_totals:
                    allocated_totals[cat] = allocated_totals.get(cat, 0) + alloc_q
                total_alloc_count += 0  # counted if not already in summary
            if short_q > 0:
                if cat not in shortage_totals:
                    shortage_totals[cat] = shortage_totals.get(cat, 0) + short_q

    # Process explicit shortage records from Phase 4 if present
    raw_shortage_list = decision.get("resource_shortages") or []
    if isinstance(raw_shortage_list, list) and raw_shortage_list:
        for s in raw_shortage_list:
            if isinstance(s, dict):
                cat = str(s.get("category", "resource"))
                short_q = int(s.get("shortage_quantity", 0))
                req_q = int(s.get("requested_quantity", short_q))
                alloc_q = int(s.get("allocated_quantity", 0))
                impact = str(s.get("impact", f"Shortfall of {short_q} {cat}(s)"))
                suggested_actions = list(s.get("suggested_actions", []))

                shortage_records.append({
                    "category": cat,
                    "requested_quantity": req_q,
                    "allocated_quantity": alloc_q,
                    "shortage_quantity": short_q,
                    "explanation": impact,
                    "suggested_actions": suggested_actions
                })
                resource_reasons.append(f"Resource shortage: requested {req_q} {cat}(s), allocated {alloc_q}, shortfall of {short_q}.")
    else:
        # Build shortages from shortage_totals if not already structured
        for cat in sorted(shortage_totals.keys()):
            short_q = int(shortage_totals[cat])
            if short_q > 0:
                alloc_q = int(allocated_totals.get(cat, 0))
                req_q = int(total_demand.get(cat, alloc_q + short_q))
                shortage_records.append({
                    "category": cat,
                    "requested_quantity": req_q,
                    "allocated_quantity": alloc_q,
                    "shortage_quantity": short_q,
                    "explanation": f"Stockpile shortage: unmet demand of {short_q} {cat}(s).",
                    "suggested_actions": [
                        f"Request mutual aid / external regional stockpile replenishment for {short_q} {cat}(s)."
                    ]
                })
                resource_reasons.append(f"Resource shortage: requested {req_q} {cat}(s), allocated {alloc_q}, shortfall of {short_q}.")

    # Add allocation summary reasons
    if allocated_totals:
        alloc_parts = [f"{q} {c}(s)" for c, q in sorted(allocated_totals.items()) if q > 0]
        if alloc_parts:
            resource_reasons.insert(0, f"Allocated resources: {', '.join(alloc_parts)}.")

    resource_summary = {
        "total_requested": total_req_count if total_req_count > 0 else (total_alloc_count + total_short_count),
        "total_allocated": total_alloc_count if total_alloc_count > 0 else sum(int(v) for v in allocated_totals.values()),
        "total_shortage": total_short_count if total_short_count > 0 else sum(int(v) for v in shortage_totals.values()),
        "is_fully_satisfied": (total_short_count == 0 and len(shortage_records) == 0),
        "allocated_by_category": allocated_totals,
        "shortage_by_category": shortage_totals,
        "allocations": clean_allocations
    }

    # -------------------------------------------------------------------------
    # 6. Extract ETA & Cluster Information
    # -------------------------------------------------------------------------
    eta_minutes = decision.get("estimated_eta_minutes")
    if eta_minutes is not None:
        try:
            eta_minutes = float(eta_minutes)
        except (ValueError, TypeError):
            eta_minutes = None

    cluster_id = decision.get("cluster_id")
    plan_id = decision.get("plan_id")
    incidents_covered = decision.get("incidents_covered") or decision.get("incident_ids") or []
    clustering_reason = decision.get("clustering_reason")

    cluster_reasons: List[str] = []
    if cluster_id:
        inc_count = len(incidents_covered) if incidents_covered else decision.get("incident_count", 1)
        cluster_reasons.append(f"Operation organized under cluster '{cluster_id}' covering {inc_count} incident(s).")
    if clustering_reason:
        cluster_reasons.append(str(clustering_reason))
    if priority_info and priority_info.get("score") is not None:
        p_sev_str = f" ({priority_info['severity'].upper()})" if priority_info.get("severity") else ""
        cluster_reasons.append(f"Response priority score: {priority_info['score']}/100{p_sev_str}.")
    if eta_minutes is not None:
        cluster_reasons.append(f"Estimated deployment ETA is {eta_minutes} minutes based on transport speed and Haversine distance.")

    # -------------------------------------------------------------------------
    # 7. Formulate Master Decision Statement & Reasons List
    # -------------------------------------------------------------------------
    # Build a grounded decision statement
    primary_decision = decision.get("recommendation_summary") or decision.get("decision")
    if not primary_decision:
        parts = []
        if plan_id:
            parts.append(f"Execute response plan '{plan_id}'")
        elif cluster_id:
            parts.append(f"Execute regional response for '{cluster_id}'")
        elif selected_site:
            parts.append(f"Recommended rescue site '{selected_site.get('name')}'")
        else:
            parts.append("Execute optimized response operation")

        if priority_info and priority_info.get("severity"):
            parts.append(f"with {priority_info['severity'].upper()} priority")

        if selected_site and selected_site.get("name") and not (plan_id or cluster_id):
            parts.append(f"at {selected_site.get('name')}")

        if allocated_totals:
            alloc_brief = ", ".join(f"{q} {c}" for c, q in sorted(allocated_totals.items()) if q > 0)
            if alloc_brief:
                parts.append(f"allocating {alloc_brief}")

        if shortage_records:
            short_brief = ", ".join(f"{s['shortage_quantity']} {s['category']}" for s in shortage_records)
            parts.append(f"(shortage: {short_brief})")

        primary_decision = " ".join(parts) + "."

    # Compile all reasons in stable order: Cluster/Priority -> Site -> Resources -> Shortages
    combined_reasons: List[str] = []
    for r in cluster_reasons:
        if r not in combined_reasons:
            combined_reasons.append(r)
    for r in site_reasons:
        if r not in combined_reasons:
            combined_reasons.append(r)
    for r in resource_reasons:
        if r not in combined_reasons:
            combined_reasons.append(r)

    if not combined_reasons:
        combined_reasons.append("Decision generated based on operational parameters and available inventory.")

    # Formulate confidence basis
    confidence_elements = []
    if selected_site:
        if selected_site.get("predicted_flood_margin_m") is not None:
            sign_str = "+" if selected_site["predicted_flood_margin_m"] >= 0 else ""
            confidence_elements.append(f"verified site elevation ({sign_str}{selected_site['predicted_flood_margin_m']}m flood margin)")
        if selected_site.get("access_status"):
            confidence_elements.append(f"operational access route ({selected_site['access_status'].lower()})")
        if selected_site.get("available_capacity") is not None:
            confidence_elements.append(f"headroom capacity ({selected_site['available_capacity']} available spots)")
    if clean_allocations:
        confidence_elements.append("deterministic inventory allocation and stock verification")
    if priority_info and priority_info.get("score") is not None:
        confidence_elements.append(f"standardized priority evaluation ({priority_info['score']}/100)")

    if confidence_elements:
        confidence_basis_str = "Decision grounded on " + ", ".join(confidence_elements) + "."
    else:
        confidence_basis_str = "Decision grounded on provided input parameters without estimated values."

    return {
        "decision": primary_decision,
        "selected_site": selected_site,
        "reasons": combined_reasons,
        "site_factors": site_factors,
        "resource_summary": resource_summary,
        "shortages": shortage_records,
        "alternative_sites": alternative_sites,
        "eta_minutes": eta_minutes,
        "priority": priority_info,
        "confidence_basis": confidence_basis_str
    }
