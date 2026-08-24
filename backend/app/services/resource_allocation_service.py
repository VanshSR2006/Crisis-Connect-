# TEAM OWNERSHIP: MEMBER 5 — OPTIMIZATION + RESPONSE PLAN + DEMO
# Deterministic Resource Allocation Engine for Disaster Response Optimization.
# Coordinate before modifying outside this workstream.
import math
from typing import List, Dict, Any, Optional, Tuple
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
def estimate_eta_minutes(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    resource_category: str
) -> float:
    """
    Calculates estimated travel time (ETA) in minutes based on Haversine distance
    and resource transport mode speed.
    """
    dist_km = calculate_haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
    cat_clean = resource_category.lower()
    if "boat" in cat_clean:
        speed_kmh = 20.0  # Water navigation speed in flooded terrain
        prep_time_min = 10.0
    elif "medical" in cat_clean or "first_aid" in cat_clean:
        speed_kmh = 50.0  # Rapid emergency response vehicle
        prep_time_min = 5.0
    elif "food" in cat_clean or "water" in cat_clean:
        speed_kmh = 40.0  # Heavy relief supply truck
        prep_time_min = 15.0
    else:
        speed_kmh = 35.0  # General transport speed
        prep_time_min = 10.0
    travel_time_min = (dist_km / speed_kmh) * 60.0
    total_eta = travel_time_min + prep_time_min
    return round(total_eta, 1)
def parse_priority_score(priority_val: Any) -> float:
    """
    Converts priority values (string severity or numeric score) into a standardized float score [0.0 - 100.0].
    """
    if isinstance(priority_val, (int, float)):
        return float(priority_val)
    val_str = str(priority_val).strip().lower()
    severity_map = {
        "critical": 100.0,
        "high": 75.0,
        "medium": 50.0,
        "low": 25.0,
    }
    return severity_map.get(val_str, 50.0)
def normalize_category(category_or_name: str) -> str:
    """
    Standardizes resource category aliases (e.g. 'rescue_boats' -> 'boat', 'first_aid_kits' -> 'medical').
    """
    c = str(category_or_name).lower().strip()
    if any(k in c for k in ["boat", "rescue_boat", "vessel"]):
        return "boat"
    if any(k in c for k in ["medical", "first_aid", "health", "medicine", "kit"]):
        return "medical"
    if any(k in c for k in ["food", "ration", "mre", "meal"]):
        return "food"
    if any(k in c for k in ["water", "pouch", "drink"]):
        return "water"
    return c
def extract_coordinates(
    entity: Dict[str, Any],
    sites_map: Optional[Dict[str, Dict[str, Any]]] = None,
    fallback_site_id: Optional[str] = None
) -> Tuple[Optional[float], Optional[float]]:
    """
    Extracts valid latitude and longitude from an entity (resource or demand target).
    Coordinate Resolution Hierarchy:
      1. Direct 'lat'/'latitude' and 'lng'/'longitude' fields on the entity.
      2. If direct coordinates are missing, resolve from shelter/site via 'shelter_id' or 'site_id' or fallback_site_id in sites_map.
      3. If no valid coordinates can be resolved, return (None, None).
    DO NOT default missing coordinates to arbitrary geographic locations (e.g. Delhi).
    """
    lat_val = entity.get("lat") if entity.get("lat") is not None else entity.get("latitude")
    lng_val = entity.get("lng") if entity.get("lng") is not None else entity.get("longitude")
    if lat_val is not None and lng_val is not None:
        try:
            return float(lat_val), float(lng_val)
        except (ValueError, TypeError):
            pass
    target_site_id = str(fallback_site_id or entity.get("shelter_id") or entity.get("site_id") or entity.get("target_site_id") or "")
    if sites_map and target_site_id and target_site_id in sites_map:
        site_obj = sites_map[target_site_id]
        s_lat = site_obj.get("lat") if site_obj.get("lat") is not None else site_obj.get("latitude")
        s_lng = site_obj.get("lng") if site_obj.get("lng") is not None else site_obj.get("longitude")
        if s_lat is not None and s_lng is not None:
            try:
                return float(s_lat), float(s_lng)
            except (ValueError, TypeError):
                pass
    return None, None
def allocate_resources(
    demands: List[Dict[str, Any]],
    resources: Optional[List[Dict[str, Any]]] = None,
    sites: Optional[List[Dict[str, Any]]] = None,
    committed_allocations: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Deterministically allocates available emergency resources (boats, medical kits, food, water)
    to prioritized incident/zone demand requests.
    Considers:
      - Incident / Zone Priority score (highest priority served first)
      - Resource Availability & Status (unusable/depleted/reserved/dispatched resources are excluded)
      - Estimated Travel Time (ETA) via Haversine distance and transport mode when valid coordinates exist
      - Explicit handling of missing coordinates (sets ETA to None without inventing fake coordinates)
      - Already Committed Resources (deducted upfront from stockpile)
      - Person shelter capacity limits only applied to person/evacuee shelter requests, NOT material supply quantities
    Exposes shortages explicitly when demand exceeds available supply.
    """
    if resources is None:
        resources = []
    # -------------------------------------------------------------------------
    # 1. Index Rescue Sites & Build Coordinates / Person Capacity Map
    # -------------------------------------------------------------------------
    sites_map: Dict[str, Dict[str, Any]] = {}
    site_headroom: Dict[str, int] = {}
    if sites:
        for s in sites:
            s_id = str(s.get("id", ""))
            if s_id:
                sites_map[s_id] = s
                cap = max(0, int(s.get("capacity", 500)))
                occ = max(0, int(s.get("current_occupancy", 0)))
                site_headroom[s_id] = max(0, cap - occ)
    # -------------------------------------------------------------------------
    # 2. Build Inventory Pool & Deduct Already Committed Allocations
    # -------------------------------------------------------------------------
    committed_totals: Dict[str, int] = {}
    if committed_allocations:
        for ca in committed_allocations:
            r_id = str(ca.get("resource_id", ""))
            q = max(0, int(ca.get("allocated_quantity", 0)))
            committed_totals[r_id] = committed_totals.get(r_id, 0) + q
    inventory: List[Dict[str, Any]] = []
    for r in resources:
        r_id = str(r.get("id", ""))
        status = str(r.get("status", "available")).strip().lower()
        # Determine raw quantity from field variants
        raw_qty = int(r.get("quantity", r.get("quantity_available", 0)))
        already_committed = committed_totals.get(r_id, 0)
        usable_qty = max(0, raw_qty - already_committed)
        # Exclude unavailable, reserved, dispatched, or depleted stock
        if status in ["available", "open"] and usable_qty > 0:
            norm_cat = normalize_category(r.get("category", r.get("name", "other")))
            r_lat, r_lng = extract_coordinates(r, sites_map=sites_map)
            inventory.append({
                "id": r_id,
                "name": str(r.get("name", r_id)),
                "category": norm_cat,
                "available_quantity": usable_qty,
                "unit": str(r.get("unit", "units")),
                "lat": r_lat,
                "lng": r_lng,
                "shelter_id": r.get("shelter_id")
            })
    # -------------------------------------------------------------------------
    # 3. Sort Demands by Priority (Highest Priority First)
    # -------------------------------------------------------------------------
    parsed_demands: List[Dict[str, Any]] = []
    for idx, d in enumerate(demands):
        p_score = parse_priority_score(d.get("priority_score", d.get("severity", 50.0)))
        t_site_id = d.get("target_site_id", d.get("shelter_id"))
        t_lat, t_lng = extract_coordinates(d, sites_map=sites_map, fallback_site_id=t_site_id)
        parsed_demands.append({
            "index": idx,
            "raw": d,
            "id": str(d.get("id", d.get("incident_id", d.get("zone_id", f"dem-{idx+1}")))),
            "target_name": str(d.get("target_name", d.get("name", d.get("title", f"Target-{idx+1}")))),
            "target_lat": t_lat,
            "target_lng": t_lng,
            "target_site_id": t_site_id,
            "priority_score": p_score,
            "requirements": d.get("requested_resources", d.get("requirements", {}))
        })
    parsed_demands.sort(key=lambda x: (x["priority_score"], -x["index"]), reverse=True)
    # -------------------------------------------------------------------------
    # 4. Perform Deterministic Allocation & Shortage Tracking
    # -------------------------------------------------------------------------
    allocations: List[Dict[str, Any]] = []
    category_demand_totals: Dict[str, int] = {}
    category_allocated_totals: Dict[str, int] = {}
    category_shortage_totals: Dict[str, int] = {}
    # Standard categories where shelter person capacity is semantically valid as a cap
    PERSON_CAPACITY_CATEGORIES = {"shelter", "person", "evacuee", "bed"}
    for req in parsed_demands:
        d_id = req["id"]
        t_name = req["target_name"]
        t_lat = req["target_lat"]
        t_lng = req["target_lng"]
        t_site_id = req["target_site_id"]
        p_score = req["priority_score"]
        raw_reqs = req["requirements"]
        # Convert requirements dict or list to normalized category -> qty map
        req_map: Dict[str, int] = {}
        if isinstance(raw_reqs, dict):
            for k, v in raw_reqs.items():
                cat = normalize_category(k)
                req_map[cat] = req_map.get(cat, 0) + max(0, int(v))
        elif isinstance(raw_reqs, list):
            for item in raw_reqs:
                if isinstance(item, dict):
                    cat = normalize_category(item.get("category", item.get("name", "other")))
                    q = max(0, int(item.get("quantity", item.get("requested_quantity", 0))))
                    req_map[cat] = req_map.get(cat, 0) + q
        for cat, requested_qty in req_map.items():
            if requested_qty <= 0:
                continue
            category_demand_totals[cat] = category_demand_totals.get(cat, 0) + requested_qty
            needed_qty = requested_qty
            # Only restrict allocation by site_headroom if the requirement represents person/evacuee capacity
            site_cap_limit = float("inf")
            if cat in PERSON_CAPACITY_CATEGORIES and t_site_id and t_site_id in site_headroom:
                site_cap_limit = site_headroom[t_site_id]
            # Find matching candidate resources in inventory
            candidates = [inv for inv in inventory if inv["category"] == cat and inv["available_quantity"] > 0]
            # Compute ETA for candidates when valid coordinates exist for both resource and demand target
            for c in candidates:
                if (c["lat"] is not None and c["lng"] is not None and
                    t_lat is not None and t_lng is not None):
                    c["current_eta"] = estimate_eta_minutes(c["lat"], c["lng"], t_lat, t_lng, cat)
                else:
                    c["current_eta"] = None
            # Sort candidates: valid numeric ETAs first (ascending), then missing ETAs, then by ID
            candidates.sort(
                key=lambda c: (
                    0 if c["current_eta"] is not None else 1,
                    c["current_eta"] if c["current_eta"] is not None else float("inf"),
                    c["id"]
                )
            )
            allocated_for_this_req = 0
            for inv_item in candidates:
                if needed_qty <= 0 or site_cap_limit <= 0:
                    break
                avail = inv_item["available_quantity"]
                if site_cap_limit == float("inf"):
                    alloc_amount = min(needed_qty, avail)
                else:
                    alloc_amount = min(needed_qty, avail, int(site_cap_limit))
                if alloc_amount > 0:
                    # Deduct from inventory pool
                    inv_item["available_quantity"] -= alloc_amount
                    needed_qty -= alloc_amount
                    allocated_for_this_req += alloc_amount
                    if site_cap_limit != float("inf"):
                        site_cap_limit -= alloc_amount
                        site_headroom[t_site_id] = int(site_cap_limit)
                    eta_val = inv_item["current_eta"]
                    rem_qty = inv_item["available_quantity"]
                    eta_str = f"{eta_val} mins" if eta_val is not None else "ETA N/A (Missing Coords)"
                    allocations.append({
                        "demand_id": d_id,
                        "resource_id": inv_item["id"],
                        "resource_name": inv_item["name"],
                        "category": cat,
                        "requested_quantity": requested_qty,
                        "allocated_quantity": alloc_amount,
                        "remaining_quantity": rem_qty,
                        "shortage_quantity": max(0, requested_qty - allocated_for_this_req),
                        "target": t_name,
                        "target_site_id": t_site_id,
                        "eta_minutes": eta_val,
                        "priority_score": p_score,
                        "status": "fulfilled" if needed_qty == 0 else "partial_shortage",
                        "reason": (
                            f"Allocated {alloc_amount} {inv_item['unit']} from {inv_item['name']} "
                            f"({eta_str}, Priority: {p_score}, {rem_qty} remaining in stock)"
                        )
                    })
            # Record shortage if request could not be fully satisfied
            category_allocated_totals[cat] = category_allocated_totals.get(cat, 0) + allocated_for_this_req
            shortage_qty = requested_qty - allocated_for_this_req
            if shortage_qty > 0:
                category_shortage_totals[cat] = category_shortage_totals.get(cat, 0) + shortage_qty
                # If zero units could be allocated at all
                if allocated_for_this_req == 0:
                    reason_msg = (
                        f"UNSATISFIED SHORTAGE: Requested {requested_qty} {cat} for {t_name} (Priority: {p_score}), "
                        f"but no usable stock was available in inventory."
                    )
                    if cat in PERSON_CAPACITY_CATEGORIES and t_site_id and site_headroom.get(t_site_id, 1) <= 0:
                        reason_msg += f" Target site {t_site_id} is at full capacity limit."
                    allocations.append({
                        "demand_id": d_id,
                        "resource_id": "NONE",
                        "resource_name": f"No available {cat} stock",
                        "category": cat,
                        "requested_quantity": requested_qty,
                        "allocated_quantity": 0,
                        "remaining_quantity": 0,
                        "shortage_quantity": shortage_qty,
                        "target": t_name,
                        "target_site_id": t_site_id,
                        "eta_minutes": None,
                        "priority_score": p_score,
                        "status": "unfulfilled_shortage",
                        "reason": reason_msg
                    })
    # -------------------------------------------------------------------------
    # 5. Build Summary Statistics
    # -------------------------------------------------------------------------
    total_req_sum = sum(category_demand_totals.values())
    total_alloc_sum = sum(category_allocated_totals.values())
    total_short_sum = sum(category_shortage_totals.values())
    is_satisfied = (total_short_sum == 0) and (total_req_sum > 0)
    summary_explanation = (
        f"Resource allocation completed cleanly. Total requested: {total_req_sum}, "
        f"Total allocated: {total_alloc_sum}, Total shortage: {total_short_sum}."
    )
    if total_short_sum > 0:
        summary_explanation += f" Shortage detected in categories: {dict(category_shortage_totals)}."
    return {
        "allocations": allocations,
        "summary": {
            "total_demands_processed": len(parsed_demands),
            "total_requested_items": total_req_sum,
            "total_allocated_items": total_alloc_sum,
            "total_shortage_items": total_short_sum,
            "is_fully_satisfied": is_satisfied,
            "demands_by_category": category_demand_totals,
            "allocated_by_category": category_allocated_totals,
            "shortage_by_category": category_shortage_totals,
            "explanation": summary_explanation
        }
    }
def cluster_regional_rescues(
    incidents: List[Dict[str, Any]],
    resources: Optional[List[Dict[str, Any]]] = None,
    sites: Optional[List[Dict[str, Any]]] = None,
    max_cluster_distance_km: float = 5.0,
    predicted_flood_level_m: float = 2.0,
    committed_allocations: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Deterministically clusters nearby emergency incidents into coordinated regional rescue operations.
    Reuses:
      - Phase 1: rank_rescue_sites for rescue-site evaluation and ranking
      - Phase 2: allocate_resources for deterministic inventory allocation and shortage tracking
    Features:
      1. Spatial clustering within proximity threshold (max_cluster_distance_km).
      2. Preserves and exposes incident priorities, demographic demand, and zone context.
      3. Computes accurate geographic centroids.
      4. Compares Clustered vs. Independent response operations (dispatches saved, ETA, resource demands).
      5. Explicitly exposes shortages when demand exceeds supply without inflating data.
      6. Handles edge cases: empty incidents, single incident, distant incidents, missing coordinates.
    """
    if resources is None:
        resources = []
    # Import site ranking from Member 5's site ranking service
    try:
        from .site_ranking_service import rank_rescue_sites
    except ImportError:
        try:
            from app.services.site_ranking_service import rank_rescue_sites
        except ImportError:
            from site_ranking_service import rank_rescue_sites
    # -------------------------------------------------------------------------
    # 1. Edge Case: Empty Incident List
    # -------------------------------------------------------------------------
    if not incidents:
        return {
            "clusters": [],
            "summary": {
                "total_incidents_processed": 0,
                "total_clusters_formed": 0,
                "total_operations_independent": 0,
                "total_operations_clustered": 0,
                "total_operations_saved": 0,
                "total_resources_requested": 0,
                "total_resources_allocated": 0,
                "total_shortage": 0,
                "is_fully_satisfied": True,
                "explanation": "No incidents provided for clustering. Zero clusters formed."
            }
        }
    # Index sites map for coordinate resolution
    sites_map: Dict[str, Dict[str, Any]] = {}
    if sites:
        for s in sites:
            s_id = str(s.get("id", ""))
            if s_id:
                sites_map[s_id] = s
    # -------------------------------------------------------------------------
    # 2. Normalize and Parse Incidents
    # -------------------------------------------------------------------------
    parsed_incidents: List[Dict[str, Any]] = []
    for idx, inc in enumerate(incidents):
        inc_id = str(inc.get("id", inc.get("incident_id", f"inc-{idx+1}")))
        title = str(inc.get("title", inc.get("name", inc.get("description", f"Incident {inc_id}"))))
        p_score = parse_priority_score(inc.get("priority_score", inc.get("severity", 50.0)))
        severity_str = str(inc.get("severity", "medium")).lower()
        zone_id = inc.get("zone_id")
        lat_val, lng_val = extract_coordinates(inc, sites_map=sites_map)
        flood_lvl = float(inc.get("predicted_flood_level_m", predicted_flood_level_m))
        # Requirements map
        raw_reqs = inc.get("requested_resources", inc.get("requirements", {}))
        req_map: Dict[str, int] = {}
        if isinstance(raw_reqs, dict):
            for k, v in raw_reqs.items():
                cat = normalize_category(k)
                req_map[cat] = req_map.get(cat, 0) + max(0, int(v))
        elif isinstance(raw_reqs, list):
            for item in raw_reqs:
                if isinstance(item, dict):
                    cat = normalize_category(item.get("category", item.get("name", "other")))
                    q = max(0, int(item.get("quantity", item.get("requested_quantity", 0))))
                    req_map[cat] = req_map.get(cat, 0) + q
        parsed_incidents.append({
            "original_index": idx,
            "id": inc_id,
            "title": title,
            "lat": lat_val,
            "lng": lng_val,
            "zone_id": zone_id,
            "priority_score": p_score,
            "severity": severity_str,
            "requirements": req_map,
            "predicted_flood_level_m": flood_lvl,
            "raw": inc
        })
    # Sort deterministically: highest priority first, then original index for stable tie-breaking
    parsed_incidents.sort(key=lambda x: (x["priority_score"], -x["original_index"]), reverse=True)
    # -------------------------------------------------------------------------
    # 3. Deterministic Proximity Grouping
    # -------------------------------------------------------------------------
    raw_clusters: List[List[Dict[str, Any]]] = []
    for inc in parsed_incidents:
        inc_lat = inc["lat"]
        inc_lng = inc["lng"]
        inc_zone = inc["zone_id"]
        assigned_cluster_idx: Optional[int] = None
        min_dist_to_cluster = float("inf")
        # Attempt to match with an existing cluster
        for c_idx, cluster_members in enumerate(raw_clusters):
            # If incident has coordinates, evaluate distance against cluster centroid
            if inc_lat is not None and inc_lng is not None:
                coords_in_cluster = [(m["lat"], m["lng"]) for m in cluster_members if m["lat"] is not None and m["lng"] is not None]
                if coords_in_cluster:
                    centroid_lat = sum(c[0] for c in coords_in_cluster) / len(coords_in_cluster)
                    centroid_lng = sum(c[1] for c in coords_in_cluster) / len(coords_in_cluster)
                    dist_km = calculate_haversine_km(inc_lat, inc_lng, centroid_lat, centroid_lng)
                    if dist_km <= max_cluster_distance_km:
                        if dist_km < min_dist_to_cluster:
                            min_dist_to_cluster = dist_km
                            assigned_cluster_idx = c_idx
            else:
                # If incident is missing coordinates, match by zone_id if available
                if inc_zone and any(m.get("zone_id") == inc_zone for m in cluster_members):
                    assigned_cluster_idx = c_idx
                    break
        if assigned_cluster_idx is not None:
            raw_clusters[assigned_cluster_idx].append(inc)
        else:
            raw_clusters.append([inc])
    # -------------------------------------------------------------------------
    # 4. Build Structured Clusters & Compare Independent vs Clustered
    # -------------------------------------------------------------------------
    structured_clusters: List[Dict[str, Any]] = []
    total_ops_independent = len(parsed_incidents)
    total_ops_clustered = len(raw_clusters)
    total_ops_saved = max(0, total_ops_independent - total_ops_clustered)
    overall_demands_sum: Dict[str, int] = {}
    overall_allocated_sum: Dict[str, int] = {}
    overall_shortage_sum: Dict[str, int] = {}
    for c_idx, members in enumerate(raw_clusters):
        cluster_id = f"cluster-{c_idx + 1}"
        # Sort member incidents deterministically by priority then ID
        members.sort(key=lambda m: (m["priority_score"], m["id"]), reverse=True)
        incident_ids = [m["id"] for m in members]
        # Calculate cluster centroid
        valid_coords = [(m["lat"], m["lng"]) for m in members if m["lat"] is not None and m["lng"] is not None]
        if valid_coords:
            center_lat = round(sum(c[0] for c in valid_coords) / len(valid_coords), 6)
            center_lng = round(sum(c[1] for c in valid_coords) / len(valid_coords), 6)
            center = {"lat": center_lat, "lng": center_lng}
        else:
            center_lat, center_lng = None, None
            center = None
        # Highest priority in cluster
        highest_p_score = max(m["priority_score"] for m in members)
        if highest_p_score >= 85.0:
            highest_severity = "critical"
        elif highest_p_score >= 65.0:
            highest_severity = "high"
        elif highest_p_score >= 40.0:
            highest_severity = "medium"
        else:
            highest_severity = "low"
        # Max flood level among members
        cluster_flood_level = max(m["predicted_flood_level_m"] for m in members)
        # Aggregate total cluster demand
        cluster_demand: Dict[str, int] = {}
        for m in members:
            for cat, q in m["requirements"].items():
                cluster_demand[cat] = cluster_demand.get(cat, 0) + q
        for cat, q in cluster_demand.items():
            overall_demands_sum[cat] = overall_demands_sum.get(cat, 0) + q
        # ---------------------------------------------------------------------
        # Rescue Site Ranking for the Cluster
        # ---------------------------------------------------------------------
        recommended_site: Optional[Dict[str, Any]] = None
        ranked_sites: List[Dict[str, Any]] = []
        site_selection_reason = ""
        if sites and center_lat is not None and center_lng is not None:
            ranked_sites = rank_rescue_sites(
                incident_lat=center_lat,
                incident_lng=center_lng,
                predicted_flood_level_m=cluster_flood_level,
                sites=sites
            )
            if ranked_sites and ranked_sites[0]["suitability_score"] > 0:
                top_s = ranked_sites[0]
                recommended_site = {
                    "id": top_s.get("id"),
                    "name": top_s.get("name"),
                    "lat": top_s.get("lat"),
                    "lng": top_s.get("lng"),
                    "suitability_score": top_s.get("suitability_score"),
                    "available_capacity": top_s.get("available_capacity"),
                    "distance_km": top_s.get("distance_km"),
                    "predicted_flood_margin_m": top_s.get("predicted_flood_margin_m"),
                    "access_status": top_s.get("access_status")
                }
                site_selection_reason = (
                    f"Selected {top_s.get('name')} (Score: {top_s.get('suitability_score')}/100, "
                    f"Distance: {top_s.get('distance_km')}km, Flood Margin: +{top_s.get('predicted_flood_margin_m')}m, "
                    f"Headroom: {top_s.get('available_capacity')} spots)."
                )
            else:
                site_selection_reason = "No suitable rescue site available (all candidate sites are flooded, full, or blocked)."
        elif not sites:
            site_selection_reason = "No rescue sites provided for ranking."
        else:
            site_selection_reason = "Cluster lacks geographic coordinates; site proximity ranking could not be computed."
        # ---------------------------------------------------------------------
        # Clustered Resource Allocation
        # ---------------------------------------------------------------------
        target_site_id = recommended_site["id"] if recommended_site else None
        clustered_demand_payload = [{
            "id": f"dem-{cluster_id}",
            "target_name": f"Regional Cluster {cluster_id} ({len(members)} incidents)",
            "lat": center_lat,
            "lng": center_lng,
            "target_site_id": target_site_id,
            "priority_score": highest_p_score,
            "requested_resources": cluster_demand
        }]
        clustered_alloc_result = allocate_resources(
            demands=clustered_demand_payload,
            resources=resources,
            sites=sites,
            committed_allocations=committed_allocations
        )
        cluster_allocations = clustered_alloc_result["allocations"]
        cluster_allocated_totals = clustered_alloc_result["summary"]["allocated_by_category"]
        cluster_shortage_totals = clustered_alloc_result["summary"]["shortage_by_category"]
        for cat, q in cluster_allocated_totals.items():
            overall_allocated_sum[cat] = overall_allocated_sum.get(cat, 0) + q
        for cat, q in cluster_shortage_totals.items():
            overall_shortage_sum[cat] = overall_shortage_sum.get(cat, 0) + q
        # Compute cluster estimated ETA
        valid_etas = [a["eta_minutes"] for a in cluster_allocations if a.get("eta_minutes") is not None]
        cluster_eta_min = max(valid_etas) if valid_etas else None
        # ---------------------------------------------------------------------
        # Independent Response Comparison
        # ---------------------------------------------------------------------
        independent_demands_payload = []
        for m in members:
            independent_demands_payload.append({
                "id": m["id"],
                "target_name": m["title"],
                "lat": m["lat"],
                "lng": m["lng"],
                "priority_score": m["priority_score"],
                "requested_resources": m["requirements"]
            })
        independent_alloc_result = allocate_resources(
            demands=independent_demands_payload,
            resources=resources,
            sites=sites,
            committed_allocations=committed_allocations
        )
        independent_ops_count = len(members)
        clustered_ops_count = 1
        ops_saved = independent_ops_count - clustered_ops_count
        # Rationale for clustering
        if len(members) > 1:
            clustering_reason = (
                f"Consolidated {len(members)} nearby emergency incidents into 1 coordinated regional rescue operation. "
                f"Reduces deployment missions from {independent_ops_count} separate dispatches to 1 unified dispatch "
                f"({ops_saved} dispatch mission{'s' if ops_saved > 1 else ''} saved). "
                f"Unified highest response priority: {highest_severity.upper()} ({highest_p_score}/100). "
                f"{site_selection_reason}"
            )
        else:
            clustering_reason = (
                f"Isolated incident handled as standalone response operation. "
                f"Priority: {highest_severity.upper()} ({highest_p_score}/100). "
                f"{site_selection_reason}"
            )
        structured_clusters.append({
            "cluster_id": cluster_id,
            "incident_count": len(members),
            "incident_ids": incident_ids,
            "incidents": [
                {
                    "id": m["id"],
                    "title": m["title"],
                    "priority_score": m["priority_score"],
                    "severity": m["severity"],
                    "zone_id": m["zone_id"],
                    "lat": m["lat"],
                    "lng": m["lng"],
                    "requirements": m["requirements"]
                }
                for m in members
            ],
            "center": center,
            "highest_priority": {
                "score": highest_p_score,
                "severity": highest_severity
            },
            "total_demand": cluster_demand,
            "recommended_rescue_site": recommended_site,
            "site_selection_reason": site_selection_reason,
            "ranked_sites": ranked_sites,
            "allocated_resources": cluster_allocations,
            "allocated_totals": cluster_allocated_totals,
            "shortage_totals": cluster_shortage_totals,
            "estimated_eta_minutes": cluster_eta_min,
            "clustering_reason": clustering_reason,
            "comparison": {
                "independent_response": {
                    "operations_count": independent_ops_count,
                    "total_requested_resources": cluster_demand,
                    "allocations": independent_alloc_result["allocations"],
                    "allocated_totals": independent_alloc_result["summary"]["allocated_by_category"],
                    "shortage_totals": independent_alloc_result["summary"]["shortage_by_category"]
                },
                "clustered_response": {
                    "operations_count": clustered_ops_count,
                    "total_requested_resources": cluster_demand,
                    "allocations": cluster_allocations,
                    "allocated_totals": cluster_allocated_totals,
                    "shortage_totals": cluster_shortage_totals,
                    "recommended_rescue_site": recommended_site["name"] if recommended_site else "None",
                    "estimated_eta_minutes": cluster_eta_min
                },
                "operations_saved": ops_saved,
                "efficiency_gain_pct": round((ops_saved / independent_ops_count) * 100.0, 1) if independent_ops_count > 0 else 0.0,
                "resource_integrity_note": "Material resource demand quantities are strictly preserved; vehicle and team deployment missions are consolidated."
            }
        })
    # Sort clusters by highest priority score descending
    structured_clusters.sort(key=lambda c: c["highest_priority"]["score"], reverse=True)
    total_req_all = sum(overall_demands_sum.values())
    total_alloc_all = sum(overall_allocated_sum.values())
    total_short_all = sum(overall_shortage_sum.values())
    is_fully_satisfied = (total_short_all == 0) and (total_req_all > 0)
    summary_msg = (
        f"Regional clustering completed. Grouped {len(parsed_incidents)} incidents into {len(structured_clusters)} "
        f"coordinated rescue cluster{'s' if len(structured_clusters) != 1 else ''}, saving {total_ops_saved} "
        f"deployment operation{'s' if total_ops_saved != 1 else ''}. "
        f"Total requested items: {total_req_all}, Allocated: {total_alloc_all}, Shortage: {total_short_all}."
    )
    return {
        "clusters": structured_clusters,
        "summary": {
            "total_incidents_processed": len(parsed_incidents),
            "total_clusters_formed": len(structured_clusters),
            "total_operations_independent": total_ops_independent,
            "total_operations_clustered": total_ops_clustered,
            "total_operations_saved": total_ops_saved,
            "total_resources_requested": total_req_all,
            "total_resources_allocated": total_alloc_all,
            "total_shortage": total_short_all,
            "is_fully_satisfied": is_fully_satisfied,
            "demands_by_category": overall_demands_sum,
            "allocated_by_category": overall_allocated_sum,
            "shortage_by_category": overall_shortage_sum,
            "explanation": summary_msg
        }
    }
# Alias for flexible integration
cluster_incidents = cluster_regional_rescues
def generate_response_plan(*args, **kwargs):
    """
    Lazy proxy for Phase 4 response plan generation.
    """
    try:
        from .response_plan_service import generate_response_plan as _grp
    except ImportError:
        try:
            from app.services.response_plan_service import generate_response_plan as _grp
        except ImportError:
            from response_plan_service import generate_response_plan as _grp
    return _grp(*args, **kwargs)
