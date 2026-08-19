# Crisis Connect — Team File Ownership

> **This is the single source of truth for file ownership.**
> Every team member must read this before editing any file.
> If you need to touch a file that belongs to another member, **coordinate first**.

---

## Quick Reference Table

| Member | Role | Primary Area |
|--------|------|--------------|
| **Member 1** | Citizen PWA + Volunteer Workflow | `src/pages/citizen/`, `src/pages/volunteer/` |
| **Member 2** | Officer Dashboard + GIS | `src/pages/officer/`, `src/app/`, `src/layouts/OfficerLayout.tsx` |
| **Member 3** | Backend + Database + Security + Realtime | `backend/app/` (core infra), `src/types/`, `src/lib/api/` |
| **Member 4** | AI / Data / Intelligence | `backend/app/services/risk_service.py`, `demand_service.py`, `priority_service.py` |
| **Member 5** | Optimization + Response Plan + Demo | `backend/app/services/site_ranking_service.py`, `backend/app/routers/demo.py` |

---

## Member 1 — Citizen PWA + Volunteer Workflow

### Role
Citizen-facing Progressive Web App and Volunteer task management portal.

### Responsibilities
- Citizen SOS reporting and emergency form submission
- Offline / low-bandwidth behavior (offline SOS queue, retry on reconnect)
- Photo compression before upload
- Citizen status tracking (incident lifecycle from citizen perspective)
- Volunteer portal and task workflow (arrived / resolved actions)
- Citizen-facing multilingual UI
- Volunteer-facing multilingual UI

### Owned Folders
```
src/pages/citizen/
src/pages/volunteer/
src/layouts/CitizenLayout.tsx
src/layouts/VolunteerLayout.tsx
```

### Owned Files

#### Pages
| File | Purpose |
|------|---------|
| `src/pages/citizen/Home.tsx` | Citizen home / dashboard |
| `src/pages/citizen/SosReport.tsx` | Emergency SOS reporting form |
| `src/pages/citizen/Shelters.tsx` | Find nearby shelters |
| `src/pages/citizen/Alerts.tsx` | Citizen alerts view |
| `src/pages/citizen/Profile.tsx` | Citizen profile / language settings |
| `src/pages/volunteer/Tasks.tsx` | Volunteer task list |
| `src/pages/volunteer/Resources.tsx` | Volunteer resource overview |

#### Layouts
| File | Purpose |
|------|---------|
| `src/layouts/CitizenLayout.tsx` | Bottom-nav layout + CitizenProvider |
| `src/layouts/VolunteerLayout.tsx` | Volunteer layout + VolunteerProvider |

#### State / Context / Utilities
| File | Purpose |
|------|---------|
| `src/lib/citizenContext.tsx` | Citizen global state (incidents, shelters, user) |
| `src/lib/volunteerContext.tsx` | Volunteer global state (tasks, markArrived, markResolved) |
| `src/lib/offlineQueue.ts` | Offline SOS queue management |

#### Shared Components (owned by Member 1)
| File | Purpose |
|------|---------|
| `src/components/shared/EmergencySOSButton.tsx` | Guest panic SOS button |
| `src/components/shared/StatusStepper.tsx` | Incident lifecycle status steps |
| `src/components/shared/LanguageToggle.tsx` | Language switcher component |

#### Internationalisation
| File | Purpose |
|------|---------|
| `src/i18n/index.ts` | i18next initialisation |
| `src/i18n/locales/en.json` | English translations |
| `src/i18n/locales/hi.json` | Hindi translations |
| `src/i18n/locales/ka.json` | Kannada translations |
| `src/lib/languageContext.tsx` | Global language context provider |
| `src/lib/i18n.ts` | i18n backward-compat helper (`t()`) |

#### Mock Data (owned by Member 1)
| File | Purpose |
|------|---------|
| `src/mocks/volunteerTasks.ts` | Volunteer-specific mock data |

### Files Member 1 Must NOT Directly Modify
- `src/app/router.tsx` — **Member 2** (global routing) — request route additions via PR
- `src/app/App.tsx` — **Member 2** — request provider additions via PR
- `src/main.tsx` — **Member 2**
- `src/layouts/OfficerLayout.tsx` — **Member 2**
- `src/pages/auth/Login.tsx` — **Member 3**
- `src/layouts/AuthLayout.tsx` — **Member 3**
- `backend/app/main.py` — **Member 3**
- `backend/app/models.py` — **Member 3**
- `backend/app/database.py` — **Member 3**
- `src/types/index.ts` — **Member 3** (shared API types)
- `src/lib/api/client.ts` — **Member 3**
- `backend/app/services/risk_service.py` — **Member 4**
- `backend/app/services/demand_service.py` — **Member 4**
- `backend/app/services/priority_service.py` — **Member 4**
- `backend/app/services/site_ranking_service.py` — **Member 5**
- `backend/app/routers/demo.py` — **Member 5**

---

## Member 2 — Officer Dashboard + GIS

### Role
Officer command center, live GIS map, risk visualization, and all officer-facing decision interfaces.

### Responsibilities
- Officer command dashboard
- Live interactive map (Leaflet / GIS)
- Risk heatmap presentation layer
- Incident, rescue-site, and resource visualization on map
- Resource pressure map
- Crisis Mode UI toggle and indicators
- Officer-facing decision UI (site-ranking results, explain-decision panel, what-if panel)
- Officer interaction flow (dispatch actions, incident acknowledgement from UI)
- Global frontend routing and app shell

### Owned Folders
```
src/pages/officer/
src/layouts/OfficerLayout.tsx
src/app/App.tsx
src/app/router.tsx
src/main.tsx
src/index.css
src/theme/
```

### Owned Files

#### Pages
| File | Purpose |
|------|---------|
| `src/pages/officer/Dashboard.tsx` | Officer command dashboard |
| `src/pages/officer/LiveMap.tsx` | Interactive live GIS map |
| `src/pages/officer/Incidents.tsx` | Incident management table |
| `src/pages/officer/Dispatch.tsx` | Dispatch management and authorization |
| `src/pages/officer/RiskHeatmap.tsx` | Risk heatmap visualization |
| `src/pages/officer/Statistics.tsx` | Analytics / statistics panel |

#### App Shell & Routing
| File | Purpose |
|------|---------|
| `src/layouts/OfficerLayout.tsx` | Officer sidebar layout + OfficerProvider |
| `src/app/App.tsx` | Root app component, global providers |
| `src/app/router.tsx` | All frontend routes |
| `src/main.tsx` | React DOM entry point |
| `src/index.css` | Global CSS |

#### Design System
| File | Purpose |
|------|---------|
| `src/theme/tokens.ts` | Design tokens (colors, spacing, typography) |

#### Shared Components (owned by Member 2)
| File | Purpose |
|------|---------|
| `src/components/shared/MapPlaceholder.tsx` | Map container component |
| `src/components/shared/ResourceInventoryTable.tsx` | Resource table (officer + volunteer) |
| `src/components/shared/SeverityBadge.tsx` | Severity label badge |
| `src/components/ui/Badge.tsx` | UI primitive |
| `src/components/ui/Button.tsx` | UI primitive |
| `src/components/ui/Card.tsx` | UI primitive |
| `src/components/ui/Input.tsx` | UI primitive |
| `src/components/ui/Modal.tsx` | UI primitive |
| `src/components/ui/Select.tsx` | UI primitive |

#### State / Context
| File | Purpose |
|------|---------|
| `src/lib/officerContext.tsx` | Officer global state (incidents, dispatches, resources, risk scores) |

#### Build Config
| File | Purpose |
|------|---------|
| `package.json` | Frontend dependencies |
| `vite.config.ts` | Vite build configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `tsconfig.app.json` | TypeScript config |
| `tsconfig.json` | TypeScript root config |
| `tsconfig.node.json` | TypeScript node config |
| `postcss.config.js` | PostCSS config |
| `index.html` | HTML entry point |

### Files Member 2 Must NOT Directly Modify
- `src/pages/citizen/*` — **Member 1**
- `src/pages/volunteer/*` — **Member 1**
- `src/layouts/CitizenLayout.tsx` — **Member 1**
- `src/layouts/VolunteerLayout.tsx` — **Member 1**
- `src/pages/auth/Login.tsx` — **Member 3**
- `backend/app/*` — **Member 3** (all backend files)
- `src/types/index.ts` — **Member 3** (request type changes)
- `backend/app/services/risk_service.py` — **Member 4**
- `backend/app/services/site_ranking_service.py` — **Member 5**

---

## Member 3 — Backend + Database + Security + Realtime

### Role
FastAPI backend infrastructure, database layer, authentication, authorization, WebSocket realtime pipeline, and API contracts.

### Responsibilities
- FastAPI application setup and middleware (CORS, auth)
- All API routers (endpoints in `main.py` + `routers/` folder)
- Authentication and authorization (login, token validation, role guards)
- Database setup (SQLAlchemy, PostgreSQL/PostGIS configuration)
- SQLAlchemy ORM models
- WebSocket connection manager and realtime event broadcast
- Dispatch transactions and resource availability locking
- Backend deployment configuration
- Shared API type contracts
- Frontend shared types (`src/types/index.ts`)

### Owned Folders
```
backend/app/main.py
backend/app/database.py
backend/app/models.py
backend/app/__init__.py
backend/app/routers/__init__.py
backend/requirements.txt
src/pages/auth/
src/layouts/AuthLayout.tsx
src/types/
src/lib/api/
```

### Owned Files

#### Backend Core
| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app, all inline endpoints, WebSocket manager, CORS |
| `backend/app/database.py` | SQLAlchemy engine, session factory, Base |
| `backend/app/models.py` | All SQLAlchemy ORM models (User, Zone, Incident, Resource, Dispatch, Alert, PopulationProfile, DemandForecast, RiskScore, RescueSite, Shelter, WeatherReading) |
| `backend/app/__init__.py` | Package marker |
| `backend/app/routers/__init__.py` | Routers package marker |
| `backend/app/services/__init__.py` | Services package marker |
| `backend/requirements.txt` | Python dependency list |

#### Auth Frontend
| File | Purpose |
|------|---------|
| `src/pages/auth/Login.tsx` | Login page (role selection, token handling) |
| `src/layouts/AuthLayout.tsx` | Auth route wrapper |

#### API Adapters / Types
| File | Purpose |
|------|---------|
| `src/types/index.ts` | Shared TypeScript entity types (mirrors DB models) |
| `src/lib/api/client.ts` | Base `apiFetch` wrapper |
| `src/lib/api/incidents.ts` | Typed incident API adapter |
| `src/lib/guards.ts` | Role-based route access guard stubs |
| `src/lib/constants.ts` | Platform-wide constants |
| `src/lib/generateReferenceId.ts` | Reference ID generator |
| `src/lib/utils.ts` | General utility functions |

#### Mock Data (owned by Member 3)
| File | Purpose |
|------|---------|
| `src/mocks/index.ts` | Mock barrel export |
| `src/mocks/incidents.ts` | Incident mock data |
| `src/mocks/alerts.ts` | Alerts mock data |
| `src/mocks/users.ts` | User mock data |
| `src/mocks/dispatches.ts` | Dispatch mock data |

### Files Member 3 Must NOT Directly Modify
- `src/pages/citizen/*` — **Member 1**
- `src/pages/volunteer/*` — **Member 1**
- `src/pages/officer/*` — **Member 2**
- `src/app/router.tsx` — **Member 2** (request route changes)
- `backend/app/services/risk_service.py` — **Member 4**
- `backend/app/services/demand_service.py` — **Member 4**
- `backend/app/services/priority_service.py` — **Member 4**
- `backend/app/services/site_ranking_service.py` — **Member 5**
- `backend/app/routers/demo.py` — **Member 5**

> **Member 3 is the API gatekeeper.** If M4 or M5 need a new endpoint or model field, they coordinate with Member 3.

---

## Member 4 — AI / Data / Intelligence

### Role
Flood-risk ML engine, population intelligence, priority scoring, shortage forecasting, and seed datasets.

### Responsibilities
- Flood-risk engine (scikit-learn logistic regression model)
- Risk model maintenance and improvement
- SOS credibility / duplicate detection
- Population intelligence and vulnerability calculations
- Demographic demand estimation
- Priority scoring formula
- Resource shortage forecasting
- ML / data validation scripts
- Seed datasets (training data embedded in services)
- Intelligence-related tests

### Owned Folders
```
backend/app/services/risk_service.py
backend/app/services/demand_service.py
backend/app/services/priority_service.py
```

### Owned Files

| File | Purpose |
|------|---------|
| `backend/app/services/risk_service.py` | Flood risk ML model (`calculate_flood_risk()`) with logistic regression training data |
| `backend/app/services/demand_service.py` | Demographic demand calculator (`calculate_demographic_demand()`) |
| `backend/app/services/priority_service.py` | Response priority scoring (`calculate_response_priority()`) |

#### Mock Data (owned by Member 4)
| File | Purpose |
|------|---------|
| `src/mocks/zones.ts` | Zone / geographic mock data |
| `src/mocks/riskScores.ts` | Risk score mock data |

### Files Member 4 Must NOT Directly Modify
- `backend/app/main.py` — **Member 3** — request new endpoint wiring via Member 3
- `backend/app/models.py` — **Member 3** — request new model fields via Member 3
- `backend/app/database.py` — **Member 3**
- `backend/app/routers/demo.py` — **Member 5**
- `backend/app/services/site_ranking_service.py` — **Member 5**
- `src/pages/officer/*` — **Member 2**
- `src/pages/citizen/*` — **Member 1**
- `src/types/index.ts` — **Member 3** (request schema additions)

> **If Member 4 changes a service function signature** that is already exposed via a Member 3-owned endpoint, this is an API-contract change — coordinate with Member 3 before making it.

---

## Member 5 — Optimization + Response Plan + Demo Integration

### Role
Smart rescue-site ranking, resource allocation optimization, response-plan generation, Explain Decision and What-If backend logic, and Demo Scenario Mode.

### Responsibilities
- Smart rescue-site ranking algorithm
- Site safety scoring and multi-factor suitability formula
- Resource allocation and regional rescue clustering
- Response-plan generation
- Explain Decision backend logic
- What-If simulation backend logic
- Demo Scenario Mode orchestration
- Counterfactual site comparison
- Final end-to-end integration and demo preparation

### Owned Folders
```
backend/app/services/site_ranking_service.py
backend/app/routers/demo.py
```

### Owned Files

| File | Purpose |
|------|---------|
| `backend/app/services/site_ranking_service.py` | Multi-factor rescue site ranking (Haversine distance, suitability formula with elevation/capacity/access/margin) |
| `backend/app/routers/demo.py` | `POST /demo/reset-scenario` — seeds the Assam Cachar flood crisis demo scenario |

#### Mock Data (owned by Member 5)
| File | Purpose |
|------|---------|
| `src/mocks/resources.ts` | Resource mock data (boats, medical kits, food) |
| `src/mocks/shelters.ts` | Shelter / rescue-site mock data |

### Files Member 5 Must NOT Directly Modify
- `backend/app/main.py` — **Member 3** — coordinate to mount new routers or add endpoints
- `backend/app/models.py` — **Member 3** — request model changes via Member 3
- `backend/app/database.py` — **Member 3**
- `backend/app/services/risk_service.py` — **Member 4**
- `backend/app/services/demand_service.py` — **Member 4**
- `backend/app/services/priority_service.py` — **Member 4**
- `src/pages/officer/*` — **Member 2** (UI for Explain Decision / What-If lives here)
- `src/types/index.ts` — **Member 3**

> **Member 5 owns the optimization algorithm and demo seeding.** The officer-facing UI panels for Explain Decision and What-If are owned by **Member 2**. Coordinate on the API contract between backend logic and frontend display.

---

## SHARED FILES — Summary Table

| File | Primary Owner | Other Members |
|------|---------------|---------------|
| `src/app/App.tsx` | **Member 2** | M1, M3 request provider additions |
| `src/app/router.tsx` | **Member 2** | M1 requests citizen/volunteer routes; M3 requests auth routes |
| `src/main.tsx` | **Member 2** | Rarely touched |
| `src/index.css` | **Member 2** | M1 requests citizen-specific global styles |
| `src/theme/tokens.ts` | **Member 2** | All read; changes via M2 |
| `src/components/ui/` (all) | **Member 2** | All use; M2 owns primitives |
| `src/types/index.ts` | **Member 3** | All consume; M4/M5 request schema additions |
| `src/lib/api/client.ts` | **Member 3** | All use; M1/M2 request changes |
| `src/lib/constants.ts` | **Member 3** | All read |
| `src/lib/languageContext.tsx` | **Member 1** | M2/M3 request changes |
| `src/i18n/index.ts` | **Member 1** | M2 adds officer translation keys |
| `src/i18n/locales/en.json` | **Member 1** | All members add keys in their area |
| `src/i18n/locales/hi.json` | **Member 1** | Same |
| `src/i18n/locales/ka.json` | **Member 1** | Same |
| `src/mocks/index.ts` | **Member 3** | All add exports from their mock files |
| `src/mocks/incidents.ts` | **Member 3** | M1 may add citizen mock incidents |
| `src/mocks/alerts.ts` | **Member 3** | All roles consume |
| `src/mocks/users.ts` | **Member 3** | Auth-logic driven |
| `src/mocks/zones.ts` | **Member 4** | Zone data driven by M4 |
| `src/mocks/riskScores.ts` | **Member 4** | Risk data |
| `src/mocks/resources.ts` | **Member 5** | Resource/optimization data |
| `src/mocks/shelters.ts` | **Member 5** | Shelter data |
| `src/mocks/dispatches.ts` | **Member 3** | Dispatch transaction data |
| `src/mocks/volunteerTasks.ts` | **Member 1** | Volunteer data |
| `backend/app/main.py` | **Member 3** | M4/M5 request endpoint wiring |
| `backend/app/models.py` | **Member 3** | M4/M5 request model field additions |
| `backend/app/database.py` | **Member 3** | No others should need to touch |
| `backend/requirements.txt` | **Member 3** | M4 adds ML deps; M5 adds opt deps — announce first |
| `package.json` | **Member 2** | All announce new deps; M2 reviews |
| `vite.config.ts` | **Member 2** | M3 requests backend proxy |
| `tailwind.config.ts` | **Member 2** | M1/M2 add theme extensions |
| `tsconfig.app.json` | **Member 2** | Path aliases |
| `index.html` | **Member 2** | Rarely changed |
| `README.md` | **Member 3** | All contribute sections |
| `doc/MASTER_BUILD_PLAYBOOK.md` | **Member 3** | All update their sections |
| `.gitignore` | **Member 3** | Add entries as needed |
| `vercel.json` | **Member 2** | Deployment config |

---

## Golden Rules

1. **Your files are yours** — work freely within your owned files.
2. **Other members' files** — open a PR and request review from the owner before merging.
3. **Shared files** — inform the primary owner before editing.
4. **API contract changes** — announce in the team channel **before** implementing. Member 3 is the gatekeeper.
5. **Translation keys** — add your own keys to locale files; Member 1 resolves merge conflicts in locale files.
6. **Model changes** — always go through Member 3.
7. **New dependencies** — announce in team channel before adding to `package.json` or `requirements.txt`.
8. **"If two members need the same file, stop and coordinate before editing it."**
