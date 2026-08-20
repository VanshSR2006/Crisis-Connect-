# API Contracts — Crisis Connect

> **Document every API endpoint here before integration.**
> Backend owner: Member 3.
> Service logic owners: Member 4 (AI/risk), Member 5 (optimization/demo).
> If an endpoint does not exist yet, mark it `STATUS: NOT IMPLEMENTED`.

---

## Authentication

### POST /auth/login

| Field | Value |
|-------|-------|
| **Owner** | Member 3 |
| **Purpose** | Authenticate a user and return a JWT access token |
| **Method** | POST |
| **Auth** | None (public endpoint) |
| **Status** | **IMPLEMENTED** (`backend/app/routers/auth.py`) |
| **Frontend Consumers** | `src/pages/auth/Login.tsx` |
| **Backend Owner** | Member 3 |

**Request Shape:**
```json
{
  "phone": "string"
}
```

> [!IMPORTANT]  
> **Security rule: role is NEVER accepted from the client.**  
> The role is always resolved from the server-side user record in the database.  
> - New unknown phone numbers → auto-registered as `citizen`.  
> - Officer / Volunteer / Admin roles MUST be pre-seeded (e.g. via `/demo/reset-scenario` or direct DB seeding).  
> - A client cannot escalate their own privileges by sending `role=officer`.

**Response Shape:**
```json
{
  "access_token": "string (JWT Bearer)",
  "token_type": "bearer",
  "user": {
    "id": "string",
    "name": "string",
    "role": "citizen | officer | volunteer | admin",
    "phone": "string",
    "language_pref": "en | hi | ka"
  }
}
```

---

## Incidents

### POST /incidents

| Field | Value |
|-------|-------|
| **Owner** | Member 3 |
| **Purpose** | Create a new incident (SOS report) submitted by a citizen |
| **Method** | POST |
| **Auth** | Not currently enforced (Phase 1 demo mode) |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 78) |
| **Frontend Consumers** | `src/pages/citizen/SosReport.tsx`, `src/lib/api/incidents.ts` |
| **Backend Owner** | Member 3 |

**Request Shape:**
```json
{
  "category": "rescue | medical | food | shelter | water | other",
  "severity": "low | medium | high | critical",
  "description": "string",
  "lat": 0.0,
  "lng": 0.0,
  "title": "string (optional, default: Emergency SOS Report)",
  "zone_id": "string (optional, default: z-silchar)",
  "reporter_id": "string (optional, default: usr-citizen-1)"
}
```

**Response Shape:**
```json
{
  "id": "string (UUID)",
  "title": "string",
  "category": "string",
  "severity": "string",
  "description": "string",
  "lat": 0.0,
  "lng": 0.0,
  "zone_id": "string",
  "reporter_id": "string",
  "status": "reported",
  "priority_score": 0.0,
  "credibility_score": 1.0,
  "review_state": "unverified",
  "created_at": "ISO-8601 string"
}
```

> Also broadcasts WebSocket event: `NEW_INCIDENT:{id}:{category}:{severity}`

---

### GET /incidents

| Field | Value |
|-------|-------|
| **Owner** | Member 3 |
| **Purpose** | Retrieve all incidents ordered by priority score descending |
| **Method** | GET |
| **Auth** | Not currently enforced |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 64) |
| **Frontend Consumers** | `src/pages/officer/Incidents.tsx`, `src/pages/officer/Dashboard.tsx`, `src/lib/api/incidents.ts` |
| **Backend Owner** | Member 3 |

**Response Shape:**
```json
[
  {
    "id": "string",
    "title": "string",
    "category": "string",
    "severity": "string",
    "status": "reported | acknowledged | dispatched | resolved",
    "lat": 0.0,
    "lng": 0.0,
    "zone_id": "string",
    "reporter_id": "string",
    "priority_score": 0.0,
    "credibility_score": 1.0,
    "review_state": "unverified | flagged | verified",
    "created_at": "ISO-8601 string"
  }
]
```

---

### POST /incidents/{id}/verify

| Field | Value |
|-------|-------|
| **Owner** | Member 3 (router) |
| **Purpose** | Officer marks an incident as verified or flagged (credibility update) |
| **Method** | POST |
| **Auth** | Officer role required |
| **Status** | NOT IMPLEMENTED |
| **Frontend Consumers** | `src/pages/officer/Incidents.tsx` |
| **Backend Owner** | Member 3 |

**Intended Request Shape:**
```json
{
  "review_state": "verified | flagged",
  "credibility_score": 0.0
}
```

**Intended Response Shape:**
```json
{
  "id": "string",
  "review_state": "verified | flagged",
  "credibility_score": 0.0
}
```

---

## Risk Intelligence

### GET /risk/zones

| Field | Value |
|-------|-------|
| **Owner** | Member 3 (router), Member 4 (data) |
| **Purpose** | Return all pre-computed zone risk scores |
| **Method** | GET |
| **Auth** | Not currently enforced |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 110) |
| **Frontend Consumers** | `src/pages/officer/RiskHeatmap.tsx`, `src/pages/officer/LiveMap.tsx` |
| **Backend Owner** | Member 3 |

**Response Shape:**
```json
[
  {
    "id": "string",
    "zone_id": "string",
    "risk_level": "low | medium | high | critical",
    "score": 0.0,
    "computed_at": "ISO-8601 string"
  }
]
```

---

### POST /risk/calculate

| Field | Value |
|-------|-------|
| **Owner** | Member 3 (router), Member 4 (service) |
| **Purpose** | Run real-time flood risk calculation for given weather inputs |
| **Method** | POST |
| **Auth** | Not currently enforced |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 120) |
| **Frontend Consumers** | `src/pages/officer/RiskHeatmap.tsx` (planned) |
| **Backend Owner** | Member 3; service logic: Member 4 (`risk_service.py`) |

**Request Shape:**
```json
{
  "rainfall_mm": 0.0,
  "river_level_m": 0.0,
  "elevation_m": 0.0,
  "soil_saturation": 0.5
}
```

**Response Shape:**
```json
{
  "score": 0.0,
  "risk_level": "low | medium | high | critical",
  "rainfall_mm": 0.0,
  "river_level_m": 0.0,
  "elevation_m": 0.0,
  "soil_saturation": 0.0
}
```

---

## Population / Demand Intelligence

### GET /zones/{id}/population

| Field | Value |
|-------|-------|
| **Owner** | Member 3 |
| **Purpose** | Return population profile for a given zone |
| **Method** | GET |
| **Auth** | Not currently enforced |
| **Status** | NOT IMPLEMENTED (zone population is embedded in Zone model; dedicated endpoint missing) |
| **Frontend Consumers** | `src/pages/officer/Statistics.tsx` (planned) |
| **Backend Owner** | Member 3 |

**Intended Response Shape:**
```json
{
  "zone_id": "string",
  "population_est": 0,
  "households_est": 0,
  "vulnerability_index": 0.0,
  "updated_at": "ISO-8601 string"
}
```

---

### GET /zones/{id}/demand

| Field | Value |
|-------|-------|
| **Owner** | Member 3 (router), Member 4 (service) |
| **Purpose** | Return estimated resource demand for a zone based on population and vulnerability |
| **Method** | GET |
| **Auth** | Not currently enforced |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 174) |
| **Frontend Consumers** | `src/pages/officer/Statistics.tsx` (planned) |
| **Backend Owner** | Member 3; service logic: Member 4 (`demand_service.py`) |

**Response Shape:**
```json
{
  "food_packets": 0,
  "drinking_water_liters": 0,
  "medical_kits": 0,
  "sanitation_kits": 0,
  "population": 0,
  "households": 0,
  "vulnerability_index": 0.0
}
```

---

## Rescue Sites

### POST /rescue-sites/rank

| Field | Value |
|-------|-------|
| **Owner** | Member 3 (router), Member 5 (service) |
| **Purpose** | Rank all candidate rescue sites for a given incident location |
| **Method** | POST |
| **Auth** | Not currently enforced |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 185) |
| **Frontend Consumers** | `src/pages/officer/LiveMap.tsx`, `src/pages/officer/Dashboard.tsx` |
| **Backend Owner** | Member 3; optimization logic: Member 5 (`site_ranking_service.py`) |

**Query Parameters:**
```
incident_lat: float
incident_lng: float
predicted_flood_m: float (optional, default: 2.0)
```

**Response Shape:**
```json
[
  {
    "id": "string",
    "name": "string",
    "lat": 0.0,
    "lng": 0.0,
    "elevation_m": 0.0,
    "capacity": 0,
    "current_occupancy": 0,
    "access_status": "accessible | limited | blocked",
    "zone_id": "string",
    "suitability_score": 0.0,
    "predicted_flood_margin_m": 0.0,
    "distance_km": 0.0,
    "available_capacity": 0,
    "reason_breakdown": {
      "elevation_m": "string",
      "capacity_available": "string",
      "distance_km": "string",
      "access_status": "string"
    }
  }
]
```

---

## Optimization / Response Plan

### POST /optimize/rescue-plan

| Field | Value |
|-------|-------|
| **Owner** | Member 5 (service logic) + Member 3 (router wiring) |
| **Purpose** | Generate a full resource allocation and response plan for a set of incidents |
| **Method** | POST |
| **Auth** | Officer role required |
| **Status** | NOT IMPLEMENTED |
| **Frontend Consumers** | `src/pages/officer/Dashboard.tsx` (planned) |
| **Backend Owner** | Member 5 defines logic; Member 3 wires the endpoint |

**Intended Request Shape:**
```json
{
  "incident_ids": ["string"],
  "available_resource_ids": ["string"]
}
```

**Intended Response Shape:**
```json
{
  "plan_id": "string",
  "assignments": [
    {
      "incident_id": "string",
      "resource_id": "string",
      "rescue_site_id": "string",
      "priority_rank": 0
    }
  ],
  "generated_at": "ISO-8601 string"
}
```

---

## Resources

### GET /resources

| Field | Value |
|-------|-------|
| **Owner** | Member 3 |
| **Purpose** | Return all available resources |
| **Method** | GET |
| **Auth** | Not currently enforced |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 129) |
| **Frontend Consumers** | `src/pages/officer/Dispatch.tsx`, `src/pages/volunteer/Resources.tsx` |
| **Backend Owner** | Member 3 |

**Response Shape:**
```json
[
  {
    "id": "string",
    "name": "string",
    "type": "boat | medical_kit | food_packet | vehicle | personnel",
    "quantity_available": 0,
    "unit": "string",
    "zone_id": "string",
    "status": "available | reserved | dispatched | depleted"
  }
]
```

---

### GET /resource-forecasts

| Field | Value |
|-------|-------|
| **Owner** | Member 4 (forecast logic) + Member 3 (endpoint) |
| **Purpose** | Return shortage forecasts for resources across zones |
| **Method** | GET |
| **Auth** | Officer role |
| **Status** | NOT IMPLEMENTED |
| **Frontend Consumers** | `src/pages/officer/Statistics.tsx` (planned) |
| **Backend Owner** | Member 4 defines forecast logic; Member 3 wires the endpoint |

**Intended Response Shape:**
```json
[
  {
    "id": "string",
    "zone_id": "string",
    "resource_type": "food | water | medical_kit | sanitation_kit",
    "quantity_needed": 0,
    "confidence": 0.0,
    "computed_at": "ISO-8601 string"
  }
]
```

---

## Dispatches

### POST /dispatches

| Field | Value |
|-------|-------|
| **Owner** | Member 3 |
| **Purpose** | Authorize and create a dispatch for an incident |
| **Method** | POST |
| **Auth** | Officer role required |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 144) |
| **Frontend Consumers** | `src/pages/officer/Dispatch.tsx` |
| **Backend Owner** | Member 3 |

**Request Shape:**
```json
{
  "incident_id": "string",
  "resource_id": "string (optional)",
  "assigned_user_id": "string (optional, default: usr-volunteer-1)",
  "eta_minutes": 15,
  "notes": "string (optional)"
}
```

**Response Shape:**
```json
{
  "id": "string",
  "incident_id": "string",
  "resource_id": "string",
  "assigned_user_id": "string",
  "status": "pending",
  "eta_minutes": 15,
  "notes": "string",
  "dispatched_at": "ISO-8601 string"
}
```

> Also broadcasts WebSocket event: `DISPATCH_AUTHORIZED:{dispatch_id}:{incident_id}`

---

## Alerts

### POST /alerts

| Field | Value |
|-------|-------|
| **Owner** | Member 3 |
| **Purpose** | Issue an emergency alert to a zone |
| **Method** | POST |
| **Auth** | Officer role required |
| **Status** | NOT IMPLEMENTED (Alert model exists; endpoint not yet wired) |
| **Frontend Consumers** | `src/pages/officer/Dashboard.tsx`, `src/pages/citizen/Alerts.tsx` |
| **Backend Owner** | Member 3 |

**Intended Request Shape:**
```json
{
  "zone_id": "string",
  "message_en": "string",
  "message_translated": {"hi": "string", "ka": "string"},
  "severity": "low | medium | high | critical"
}
```

**Intended Response Shape:**
```json
{
  "id": "string",
  "zone_id": "string",
  "message_en": "string",
  "message_translated": {},
  "severity": "string",
  "issued_at": "ISO-8601 string"
}
```

---

## WebSocket

### WS /ws/dashboard

| Field | Value |
|-------|-------|
| **Owner** | Member 3 |
| **Purpose** | Realtime push events to the officer dashboard and volunteer portal |
| **Protocol** | WebSocket |
| **Auth** | Not currently enforced |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 205) |
| **Frontend Consumers** | `src/pages/officer/Dashboard.tsx`, `src/layouts/OfficerLayout.tsx` |
| **Backend Owner** | Member 3 |

**Outbound Event Formats (server → client) — Structured JSON:**
```json
{
  "type": "incident.created | incident.updated | incident.verified | dispatch.authorized | dispatch.status_changed | resource.updated | alert.created",
  "payload": { ... },
  "timestamp": "ISO-8601Z"
}
```

**Supported event types:**

| Event type | Trigger |
|---|---|
| `incident.created` | POST /incidents |
| `incident.verified` | POST /incidents/{id}/verify |
| `dispatch.authorized` | POST /dispatches |
| `resource.updated` | POST /dispatches (resource quantity changed) |
| `alert.created` | POST /alerts |

**Inbound Event Format (client → server):**
```
Any text string → server responds with ACK:{text}
```

---

## Simulation / What-If

### POST /simulate

| Field | Value |
|-------|-------|
| **Owner** | Member 5 (logic) + Member 3 (endpoint wiring) |
| **Purpose** | Run a what-if simulation given hypothetical parameter changes |
| **Method** | POST |
| **Auth** | Officer role |
| **Status** | NOT IMPLEMENTED |
| **Frontend Consumers** | `src/pages/officer/Dashboard.tsx` (planned What-If panel) |
| **Backend Owner** | Member 5 defines logic; Member 3 wires endpoint |

**Intended Request Shape:**
```json
{
  "scenario_overrides": {
    "rainfall_mm": 0.0,
    "river_level_m": 0.0,
    "resource_availability": {}
  }
}
```

**Intended Response Shape:**
```json
{
  "simulation_id": "string",
  "projected_risk_scores": [],
  "projected_demand": {},
  "recommended_sites": [],
  "generated_at": "ISO-8601 string"
}
```

---

## Explain Decision

### GET /recommendations/{id}/explanation

| Field | Value |
|-------|-------|
| **Owner** | Member 5 (logic) + Member 3 (endpoint wiring) |
| **Purpose** | Return the human-readable rationale for a site recommendation or dispatch decision |
| **Method** | GET |
| **Auth** | Officer role |
| **Status** | NOT IMPLEMENTED |
| **Frontend Consumers** | `src/pages/officer/Dashboard.tsx` (planned Explain Decision panel) |
| **Backend Owner** | Member 5 defines logic; Member 3 wires endpoint |

**Intended Response Shape:**
```json
{
  "recommendation_id": "string",
  "site_name": "string",
  "suitability_score": 0.0,
  "factor_breakdown": {
    "elevation_score": 0.0,
    "flood_margin_score": 0.0,
    "capacity_score": 0.0,
    "access_score": 0.0,
    "distance_score": 0.0
  },
  "plain_language_summary": "string",
  "computed_at": "ISO-8601 string"
}
```

---

## Demo

### POST /demo/reset-scenario

| Field | Value |
|-------|-------|
| **Owner** | Member 5 |
| **Purpose** | Reset and seed the Assam Cachar flood crisis demo scenario for judging |
| **Method** | POST |
| **Auth** | Not enforced (demo endpoint) |
| **Status** | IMPLEMENTED (`backend/app/routers/demo.py` line 9) |
| **Frontend Consumers** | Demo control panel (planned in officer UI — Member 2) |
| **Backend Owner** | Member 5 |

**Request Shape:** None (no body required)

**Response Shape:**
```json
{
  "status": "success",
  "message": "Assam Cachar Flood scenario reset successfully",
  "zones_seeded": 3,
  "incidents_seeded": 2,
  "rescue_sites_seeded": 2,
  "resources_seeded": 3
}
```

---

## Zones (General)

### GET /zones

| Field | Value |
|-------|-------|
| **Owner** | Member 3 |
| **Purpose** | Return all zones |
| **Method** | GET |
| **Auth** | Not currently enforced |
| **Status** | IMPLEMENTED (`backend/app/main.py` line 106) |
| **Frontend Consumers** | `src/pages/officer/LiveMap.tsx`, `src/pages/officer/RiskHeatmap.tsx` |
| **Backend Owner** | Member 3 |

**Response Shape:**
```json
[
  {
    "id": "string",
    "name": "string",
    "district": "string",
    "boundary_json": "GeoJSON string",
    "population_est": 0
  }
]
```

---

## API Status Summary

> Last updated: 2026-08-20 by Member 3 (Backend Foundation Phase)

| Endpoint | Method | Status | Auth Required |
|----------|--------|--------|---------------|
| `/auth/login` | POST | ✅ IMPLEMENTED | None |
| `/incidents` | POST | ✅ IMPLEMENTED | None (public SOS) |
| `/incidents` | GET | ✅ IMPLEMENTED | None |
| `/incidents/{id}/verify` | POST | ✅ IMPLEMENTED | Officer |
| `/zones` | GET | ✅ IMPLEMENTED | None |
| `/zones/{id}/population` | GET | ✅ IMPLEMENTED | None |
| `/zones/{id}/demand` | GET | ✅ IMPLEMENTED | None |
| `/risk/zones` | GET | ✅ IMPLEMENTED | None |
| `/risk/calculate` | POST | ✅ IMPLEMENTED | None |
| `/rescue-sites/rank` | POST | ✅ IMPLEMENTED | None |
| `/resources` | GET | ✅ IMPLEMENTED | None |
| `/dispatches` | GET | ✅ IMPLEMENTED | None |
| `/dispatches` | POST | ✅ IMPLEMENTED | Officer |
| `/alerts` | POST | ✅ IMPLEMENTED | Officer |
| `/ws/dashboard` | WS | ✅ IMPLEMENTED | None |
| `/health` | GET | ✅ IMPLEMENTED | None |
| `/ready` | GET | ✅ IMPLEMENTED | None |
| `/demo/reset-scenario` | POST | ✅ IMPLEMENTED | None (demo only) |
| `/optimize/rescue-plan` | POST | ❌ NOT IMPLEMENTED | Officer (Member 5) |
| `/resource-forecasts` | GET | ❌ NOT IMPLEMENTED | Officer (Member 4) |
| `/simulate` | POST | ❌ NOT IMPLEMENTED | Officer (Member 5) |
| `/recommendations/{id}/explanation` | GET | ❌ NOT IMPLEMENTED | Officer (Member 5) |

> **Dispatch safety note:** `POST /dispatches` uses database row-locking (`with_for_update()`) on both the Incident and Resource rows to prevent duplicate allocation under concurrent officer requests.
