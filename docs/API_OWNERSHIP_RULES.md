# API Ownership Rules — Crisis Connect

> These rules govern how API contracts are created, consumed, and changed.
> All five team members must follow these rules.

---

## Rule 1 — Backend Owns API Implementation

**Member 3 (Backend)** owns the implementation of all API endpoints.

- Endpoints live in `backend/app/main.py` (current inline) and `backend/app/routers/`.
- No frontend member should duplicate backend validation, authorization, or business-decision logic in frontend code.
- Member 4 and Member 5 may implement service functions that endpoints call, but the **endpoint wiring** remains Member 3's responsibility.

---

## Rule 2 — Frontend Owns API Consumption and Presentation

**Members 1 and 2 (Frontend)** own how API data is consumed and displayed.

- Use the typed adapters in `src/lib/api/` instead of calling `fetch()` directly in page components.
- New API endpoints need a matching adapter file in `src/lib/api/` (owned by Member 3, but frontend members may propose adapters via PR).
- Never scatter raw JSON assumptions across page components.

---

## Rule 3 — AI Services Own Their Internal Calculations

**Member 4 (AI / Data)** owns the internal implementation of:

- `calculate_flood_risk()` in `risk_service.py`
- `calculate_demographic_demand()` in `demand_service.py`
- `calculate_response_priority()` in `priority_service.py`

Other members consume these functions but do not re-implement or override their logic.

---

## Rule 4 — Optimization Services Own Optimization Logic

**Member 5 (Optimization)** owns the internal implementation of:

- `rank_rescue_sites()` in `site_ranking_service.py`
- Any future allocation, clustering, or simulation services.

Other members consume the results (via API endpoints) but do not re-implement optimization logic in other files.

---

## Rule 5 — No Frontend Duplication of Backend Decision-Making

Frontend components must **not** re-implement:

- Risk scoring formulas
- Priority calculation logic
- Rescue site ranking formulas
- Demand forecasting formulas

Frontend displays results returned by the backend API. If an algorithm needs to run client-side for offline support, coordinate with Member 3 and the relevant service owner.

---

## Rule 6 — Document API Contracts Before Integration

Before a new API endpoint is connected between a backend service and a frontend page:

1. The **backend owner (Member 3)** defines the endpoint contract (method, path, request, response).
2. The **consuming frontend member** agrees to the contract.
3. The contract is documented in `docs/API_CONTRACTS.md`.
4. Only then does implementation begin on both sides.

This prevents "API shape surprises" that cause frontend breakage.

---

## Rule 7 — Never Silently Change an API Response Shape

If an existing API endpoint's response changes:

- The **backend owner** must announce the change in the team channel.
- All **frontend members consuming that endpoint** must update their adapters and type definitions.
- The change must be documented in `docs/API_CONTRACTS.md` with a version note.

Silently changing a response shape is the most common cause of cross-member bugs.

---

## Rule 8 — Breaking API Changes Must Be Announced

A **breaking API change** is any change that:

- Removes or renames a JSON field
- Changes a field's data type
- Changes HTTP status codes
- Changes authentication requirements
- Removes an endpoint

Breaking changes must be:

1. Announced in the team channel **before** the PR is opened.
2. Documented in `docs/API_CONTRACTS.md`.
3. Coordinated with all consuming frontend members.
4. Merged only after all consumers have updated their code.

---

## Rule 9 — Backend Owns Validation and Authorization

All input validation (field presence, type, range) and authorization (role checks, ownership) must live in the **backend**.

Frontend may show friendly validation messages for user experience, but must never trust frontend-only validation as the security boundary.

Authentication tokens are validated by the backend on every protected request.

---

## Rule 10 — Frontend Uses Typed API Adapters

All API calls from frontend code must go through `src/lib/api/` adapter functions.

**Correct pattern:**
```typescript
import { getIncidents } from '@/lib/api/incidents';
const incidents = await getIncidents();
```

**Incorrect pattern:**
```typescript
// Do NOT scatter raw fetch calls inside page components
const resp = await fetch('http://localhost:8000/incidents');
```

**Ownership of adapters:**
- `src/lib/api/client.ts` — **Member 3** owns the base client
- `src/lib/api/incidents.ts` — **Member 3** owns; Member 1 may propose incident adapter changes via PR
- New endpoint adapters — proposed by the consuming member, reviewed by Member 3

---

## API Ownership Summary Matrix

| API Area | Backend Implementation Owner | Frontend Consumer | Frontend Adapter Owner |
|---|---|---|---|
| Auth (`/auth/*`) | Member 3 | Member 3 (Login page) | Member 3 |
| Incidents (`/incidents`) | Member 3 | Members 1 + 2 | Member 3 |
| Risk Zones (`/risk/*`) | Member 3 (router) + Member 4 (service) | Member 2 | Member 3 |
| Zone Demand (`/zones/*/demand`) | Member 3 (router) + Member 4 (service) | Member 2 | Member 3 |
| Rescue Sites (`/rescue-sites/*`) | Member 3 (router) + Member 5 (service) | Member 2 | Member 3 |
| Resources (`/resources`) | Member 3 | Members 2 + 1 | Member 3 |
| Dispatches (`/dispatches`) | Member 3 | Members 2 + 1 | Member 3 |
| Alerts (`/alerts`) | Member 3 | Members 1 + 2 | Member 3 |
| WebSocket (`/ws/dashboard`) | Member 3 | Member 2 | Member 3 |
| Demo (`/demo/*`) | Member 5 (router + seeding) | Member 2 (demo UI) | Member 5 / Member 3 |
| Simulate (`/simulate`) | Member 5 | Member 2 | Member 5 / Member 3 |
| Optimization (`/optimize/*`) | Member 5 | Member 2 | Member 5 / Member 3 |
