"""
Service for simulating what-if scenarios on existing decisions.

Supports three change types, applied against values already present in the
decision dictionary (no external data is invented):

  1. resource_quantity  — adjust available quantity of a named resource.
  2. site_availability  — mark a rescue site as available or unavailable.
  3. demand_quantity    — adjust the requested quantity for a named demand item.
"""

from typing import Any, Dict, List


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _safe_int(value: Any, fallback: int = 0) -> int:
    """Convert value to int safely; return fallback on failure."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _find_resource(resources: List[Dict], name_or_id: str) -> Dict | None:
    """
    Return the first resource whose 'id' or 'name' matches name_or_id
    (case-insensitive).  Returns None if not found.
    """
    key = str(name_or_id).strip().lower()
    for r in resources:
        if str(r.get("id", "")).lower() == key:
            return r
        if str(r.get("name", "")).lower() == key:
            return r
    return None


def _find_site(sites: List[Dict], name_or_id: str) -> Dict | None:
    """
    Return the first site whose 'id' or 'name' matches name_or_id
    (case-insensitive).  Returns None if not found.
    """
    key = str(name_or_id).strip().lower()
    for s in sites:
        if str(s.get("id", "")).lower() == key:
            return s
        if str(s.get("name", "")).lower() == key:
            return s
    return None


def _find_demand(demands: List[Dict], name_or_id: str) -> Dict | None:
    """
    Return the first demand entry whose 'id', 'name', or 'target_name'
    matches name_or_id (case-insensitive).  Returns None if not found.
    """
    key = str(name_or_id).strip().lower()
    for d in demands:
        if str(d.get("id", "")).lower() == key:
            return d
        if str(d.get("name", "")).lower() == key:
            return d
        if str(d.get("target_name", "")).lower() == key:
            return d
    return None


def _detect_shortages(
    resources: List[Dict],
    demands: List[Dict],
) -> List[Dict]:
    """
    Compare demand quantities against resource quantities in the
    (possibly mutated) snapshot.  Returns a list of shortage records
    only for categories where demand exceeds supply.
    """
    # Build supply map: category -> total available quantity
    supply: Dict[str, int] = {}
    for r in resources:
        cat = str(r.get("category", r.get("name", "other"))).lower()
        qty = _safe_int(r.get("quantity", r.get("quantity_available", 0)))
        supply[cat] = supply.get(cat, 0) + qty

    # Build demand map from demand entries
    demand_totals: Dict[str, int] = {}
    for d in demands:
        reqs = d.get("requested_resources", d.get("requirements", {}))
        if isinstance(reqs, dict):
            for cat, qty in reqs.items():
                demand_totals[cat] = demand_totals.get(cat, 0) + _safe_int(qty)
        elif isinstance(reqs, list):
            for item in reqs:
                if isinstance(item, dict):
                    cat = str(
                        item.get("category", item.get("name", "other"))
                    ).lower()
                    qty = _safe_int(
                        item.get("quantity", item.get("requested_quantity", 0))
                    )
                    demand_totals[cat] = demand_totals.get(cat, 0) + qty

    shortages = []
    for cat, demanded in demand_totals.items():
        available = supply.get(cat, 0)
        if demanded > available:
            shortages.append(
                {
                    "category": cat,
                    "demanded": demanded,
                    "available": available,
                    "shortage": demanded - available,
                }
            )
    return shortages


# ---------------------------------------------------------------------------
# Public function
# ---------------------------------------------------------------------------

def simulate_what_if(decision: dict, changes: dict) -> dict:
    """
    Simulate a what-if scenario by applying proposed changes to an existing
    decision and reporting the downstream impact.

    Args:
        decision: The original decision dictionary.  Expected optional keys:
                    - "resources"  : list of resource dicts
                    - "sites"      : list of rescue-site dicts
                    - "demands"    : list of demand / incident dicts
                    - "allocations": list of existing allocation dicts
                  Any other keys are preserved unchanged.

        changes: A dictionary describing proposed modifications.  Supported
                 keys (all optional, unknown keys are ignored):

                 resource_quantity:
                   { "resource": "<id or name>", "new_quantity": <int> }

                 site_availability:
                   { "site": "<id or name>", "available": <bool> }

                 demand_quantity:
                   { "demand": "<id or name>",
                     "category": "<resource category>",
                     "new_quantity": <int> }

    Returns:
        {
          "original_decision" : <original decision dict, unmodified>,
          "applied_changes"   : { ... changes that were successfully applied },
          "affected_resources": [ ... resource snapshots after change ],
          "affected_site"     : <site snapshot after change> | None,
          "affected_demand"   : <demand snapshot after change> | None,
          "shortages"         : [ ... shortage records ],
          "status"            : "simulated" | "simulated_with_warnings",
          "explanation"       : "<human-readable summary>",
        }
    """
    # ------------------------------------------------------------------
    # 0. Guard inputs
    # ------------------------------------------------------------------
    if not isinstance(decision, dict):
        decision = {}
    if not isinstance(changes, dict):
        changes = {}

    # Deep-copy the mutable lists so we never mutate the caller's data.
    import copy
    snapshot = copy.deepcopy(decision)

    resources: List[Dict] = snapshot.get("resources") or []
    sites: List[Dict] = snapshot.get("sites") or []
    demands: List[Dict] = snapshot.get("demands") or []

    applied_changes: Dict[str, Any] = {}
    warnings: List[str] = []
    explanation_parts: List[str] = []

    affected_resources: List[Dict] = []
    affected_site: Dict | None = None
    affected_demand: Dict | None = None

    # ------------------------------------------------------------------
    # 1. Resource quantity change
    # ------------------------------------------------------------------
    rq_change = changes.get("resource_quantity")
    if rq_change is not None:
        if not isinstance(rq_change, dict):
            warnings.append("'resource_quantity' must be a dict — skipped.")
        else:
            res_key = rq_change.get("resource")
            new_qty = rq_change.get("new_quantity")

            if not res_key:
                warnings.append(
                    "'resource_quantity.resource' is missing — skipped."
                )
            elif new_qty is None:
                warnings.append(
                    "'resource_quantity.new_quantity' is missing — skipped."
                )
            else:
                new_qty_int = _safe_int(new_qty, fallback=-1)
                if new_qty_int < 0:
                    warnings.append(
                        f"'resource_quantity.new_quantity' must be a non-negative "
                        f"integer (got {new_qty!r}) — skipped."
                    )
                else:
                    target_res = _find_resource(resources, res_key)
                    if target_res is None:
                        warnings.append(
                            f"Resource '{res_key}' not found in decision — skipped."
                        )
                    else:
                        old_qty = _safe_int(
                            target_res.get(
                                "quantity",
                                target_res.get("quantity_available", 0),
                            )
                        )
                        # Apply to whichever quantity key exists
                        if "quantity" in target_res:
                            target_res["quantity"] = new_qty_int
                        elif "quantity_available" in target_res:
                            target_res["quantity_available"] = new_qty_int
                        else:
                            target_res["quantity"] = new_qty_int

                        affected_resources.append(target_res)
                        applied_changes["resource_quantity"] = {
                            "resource": res_key,
                            "old_quantity": old_qty,
                            "new_quantity": new_qty_int,
                        }
                        diff = new_qty_int - old_qty
                        direction = "increased" if diff >= 0 else "decreased"
                        explanation_parts.append(
                            f"Resource '{target_res.get('name', res_key)}' quantity "
                            f"{direction} from {old_qty} to {new_qty_int} "
                            f"({abs(diff):+d} units)."
                        )

    # ------------------------------------------------------------------
    # 2. Rescue-site availability change
    # ------------------------------------------------------------------
    sa_change = changes.get("site_availability")
    if sa_change is not None:
        if not isinstance(sa_change, dict):
            warnings.append("'site_availability' must be a dict — skipped.")
        else:
            site_key = sa_change.get("site")
            available = sa_change.get("available")

            if not site_key:
                warnings.append(
                    "'site_availability.site' is missing — skipped."
                )
            elif available is None:
                warnings.append(
                    "'site_availability.available' is missing — skipped."
                )
            else:
                target_site = _find_site(sites, site_key)
                if target_site is None:
                    warnings.append(
                        f"Site '{site_key}' not found in decision — skipped."
                    )
                else:
                    old_status = target_site.get("status", "open")
                    old_access = target_site.get("access_status", "accessible")

                    is_available = bool(available)
                    new_status = "open" if is_available else "closed"
                    new_access = "accessible" if is_available else "blocked"

                    target_site["status"] = new_status
                    target_site["access_status"] = new_access

                    affected_site = target_site
                    applied_changes["site_availability"] = {
                        "site": site_key,
                        "old_status": old_status,
                        "old_access_status": old_access,
                        "new_status": new_status,
                        "new_access_status": new_access,
                        "available": is_available,
                    }
                    availability_str = "available" if is_available else "unavailable"
                    explanation_parts.append(
                        f"Rescue site '{target_site.get('name', site_key)}' marked as "
                        f"{availability_str} (status: '{new_status}', "
                        f"access: '{new_access}')."
                    )

    # ------------------------------------------------------------------
    # 3. Demand quantity change
    # ------------------------------------------------------------------
    dq_change = changes.get("demand_quantity")
    if dq_change is not None:
        if not isinstance(dq_change, dict):
            warnings.append("'demand_quantity' must be a dict — skipped.")
        else:
            dem_key = dq_change.get("demand")
            category = dq_change.get("category")
            new_qty = dq_change.get("new_quantity")

            if not dem_key:
                warnings.append(
                    "'demand_quantity.demand' is missing — skipped."
                )
            elif not category:
                warnings.append(
                    "'demand_quantity.category' is missing — skipped."
                )
            elif new_qty is None:
                warnings.append(
                    "'demand_quantity.new_quantity' is missing — skipped."
                )
            else:
                new_qty_int = _safe_int(new_qty, fallback=-1)
                if new_qty_int < 0:
                    warnings.append(
                        f"'demand_quantity.new_quantity' must be a non-negative "
                        f"integer (got {new_qty!r}) — skipped."
                    )
                else:
                    target_dem = _find_demand(demands, dem_key)
                    if target_dem is None:
                        warnings.append(
                            f"Demand '{dem_key}' not found in decision — skipped."
                        )
                    else:
                        reqs = target_dem.get(
                            "requested_resources",
                            target_dem.get("requirements", {}),
                        )
                        old_qty = 0
                        cat_key = str(category).lower()

                        if isinstance(reqs, dict):
                            # Try exact key first, then case-insensitive match
                            if cat_key in reqs:
                                old_qty = _safe_int(reqs[cat_key])
                                reqs[cat_key] = new_qty_int
                            else:
                                matched_key = next(
                                    (k for k in reqs if k.lower() == cat_key),
                                    None,
                                )
                                if matched_key:
                                    old_qty = _safe_int(reqs[matched_key])
                                    reqs[matched_key] = new_qty_int
                                else:
                                    reqs[cat_key] = new_qty_int

                            # Ensure the demand dict holds the updated reqs
                            if "requested_resources" in target_dem:
                                target_dem["requested_resources"] = reqs
                            else:
                                target_dem["requirements"] = reqs

                        elif isinstance(reqs, list):
                            matched = False
                            for item in reqs:
                                if isinstance(item, dict):
                                    item_cat = str(
                                        item.get("category", item.get("name", ""))
                                    ).lower()
                                    if item_cat == cat_key:
                                        old_qty = _safe_int(
                                            item.get(
                                                "quantity",
                                                item.get("requested_quantity", 0),
                                            )
                                        )
                                        if "quantity" in item:
                                            item["quantity"] = new_qty_int
                                        else:
                                            item["requested_quantity"] = new_qty_int
                                        matched = True
                                        break
                            if not matched:
                                warnings.append(
                                    f"Category '{category}' not found in demand "
                                    f"'{dem_key}' requirements list — skipped."
                                )

                        affected_demand = target_dem
                        applied_changes["demand_quantity"] = {
                            "demand": dem_key,
                            "category": category,
                            "old_quantity": old_qty,
                            "new_quantity": new_qty_int,
                        }
                        diff = new_qty_int - old_qty
                        direction = "increased" if diff >= 0 else "decreased"
                        explanation_parts.append(
                            f"Demand '{target_dem.get('target_name', target_dem.get('name', dem_key))}' "
                            f"requirement for '{category}' {direction} from {old_qty} "
                            f"to {new_qty_int} ({abs(diff):+d} units)."
                        )

    # ------------------------------------------------------------------
    # 4. Detect shortages on the mutated snapshot
    # ------------------------------------------------------------------
    shortages = _detect_shortages(resources, demands)

    # ------------------------------------------------------------------
    # 5. Compose explanation and status
    # ------------------------------------------------------------------
    if not applied_changes:
        explanation_parts.append("No valid changes were applied.")

    if shortages:
        shortage_labels = ", ".join(
            f"{s['shortage']} {s['category']}" for s in shortages
        )
        explanation_parts.append(
            f"Post-change shortage detected: {shortage_labels}."
        )

    if warnings:
        explanation_parts.append("Warnings: " + "; ".join(warnings))

    has_warnings = bool(warnings) or bool(shortages)
    status = "simulated_with_warnings" if has_warnings else "simulated"
    explanation = " ".join(explanation_parts) if explanation_parts else "Simulation complete."

    # ------------------------------------------------------------------
    # 6. Return structured result
    # ------------------------------------------------------------------
    return {
        "original_decision": decision,
        "applied_changes": applied_changes,
        "affected_resources": affected_resources,
        "affected_site": affected_site,
        "affected_demand": affected_demand,
        "shortages": shortages,
        "status": status,
        "explanation": explanation,
    }
