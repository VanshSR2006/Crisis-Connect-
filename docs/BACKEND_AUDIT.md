# Crisis Connect — Backend Audit Report

**Owner:** Member 3 (Backend + Database + Security + Realtime)  
**Date:** August 20, 2026

This document presents the detailed audit of the Crisis Connect backend codebase.

---

## 1. What Already Exists
- **FastAPI Core App:** Inside [backend/app/main.py](file:///c:/SIH/backend/app/main.py), setting up FastAPI, mounting CORS, a raw string WebSocket ConnectionManager, and defining several endpoints.
- **SQLAlchemy DB Setup:** A basic connection engine inside [backend/app/database.py](file:///c:/SIH/backend/app/database.py).
- **ORM Models:** SQLAlchemy model definitions inside [backend/app/models.py](file:///c:/SIH/backend/app/models.py) for the following tables:
  - `User`, `Zone`, `WeatherReading`, `RiskScore`, `Incident`, `Shelter`, `RescueSite`, `Resource`, `Dispatch`, `Alert`, `PopulationProfile`, `DemandForecast`.
- **Demo Router:** A router at [backend/app/routers/demo.py](file:///c:/SIH/backend/app/routers/demo.py) containing `/demo/reset-scenario` to seed Assam Cachar flood data.
- **AI/Intelligence Services (Member 4):**
  - [risk_service.py](file:///c:/SIH/backend/app/services/risk_service.py) (Logistic regression for flood risk).
  - [demand_service.py](file:///c:/SIH/backend/app/services/demand_service.py) (Demographic demand calculator).
  - [priority_service.py](file:///c:/SIH/backend/app/services/priority_service.py) (Response priority scoring).
- **Optimization Services (Member 5):**
  - [site_ranking_service.py](file:///c:/SIH/backend/app/services/site_ranking_service.py) (Haversine distance + multi-factor site ranking).

---

## 2. What Currently Works
- **FastAPI Server Launch:** The app is runnable and serves basic routes.
- **Simple REST Endpoints:**
  - `GET /` (Health check JSON).
  - `GET /incidents` & `POST /incidents` (Fetch and create incidents).
  - `GET /zones` (Fetch zones list).
  - `GET /risk/zones` (Fetch RiskScore records).
  - `POST /risk/calculate` (Calculates live risk via the Logistic Regression model).
  - `GET /resources` (Fetch resources).
  - `GET /dispatches` & `POST /dispatches` (Fetch and basic create dispatch).
  - `GET /zones/{zone_id}/demand` (Calculate demographic demand).
  - `POST /rescue-sites/rank` (Rank rescue sites using coordinates and flood margins).
- **WS Dashboard Connection:** Basic WebSocket connection handler at `WS /ws/dashboard` which returns client text prepended with `"ACK:"`.
- **Demo Reset:** Seeding of 3 zones, 2 incidents, 2 rescue sites, 3 resources, and 3 users.

---

## 3. What is Incomplete
- **Authentication/Authorization:** The `/auth/login` endpoint is marked `NOT IMPLEMENTED` in the contract and doesn't exist in the routers. No JWT verification logic, password storage, or security decorators are built.
- **Centralized Settings/Config:** Secrets and database connection configurations are done using direct `os.getenv` fallbacks with no unified settings loader.
- **Structured Logging:** No logging configurations or logging outputs exist, making production debugging and tracking of requests/errors difficult.
- **Health / Readiness split:** A simple `/` endpoint exists but does not verify database connectivity or Redis status separately (`/ready`).
- **Playbook Endpoints:**
  - `POST /incidents/{id}/verify` (Verification/credibility update).
  - `GET /zones/{id}/population` (Demographic profile retrieval).
  - `POST /optimize/rescue-plan` (Rescue plan generation).
  - `GET /resource-forecasts` (Shortage forecasting).
  - `POST /alerts` (Alert creation and translation).
  - `POST /simulate` (What-if scenario runs).
  - `GET /recommendations/{id}/explanation` (AI Explainability details).
- **Redis Integration:** There is no Redis initialization or client abstraction.
- **Deployment files & Tests:** No deployment descriptors or testing configurations exist.

---

## 4. What is Incorrectly implemented
- **Demo Seeding Bug (RiskScore):** The [demo.py](file:///c:/SIH/backend/app/routers/demo.py) router tries to seed `RiskScore` with `rainfall_mm` and `river_level_m` keyword arguments:
  ```python
  r1 = RiskScore(zone_id=z1.id, risk_level="critical", score=0.88, rainfall_mm=140.0, river_level_m=4.8)
  ```
  However, `RiskScore` in [models.py](file:///c:/SIH/backend/app/models.py) does not contain columns for `rainfall_mm` or `river_level_m`. This causes a runtime database insertion crash when using any database that strictly checks schema fields.
- **Permissive CORS Settings:** In [main.py](file:///c:/SIH/backend/app/main.py), CORS uses `allow_origins=["*"]`, which is insecure for production and must be locked down using environment variables.
- **SQLite Database Fallback:** The default fallback in [database.py](file:///c:/SIH/backend/app/database.py) uses SQLite `sqlite:///./crisis_connect.db` even when running in production if `DATABASE_URL` is omitted.
- **Dynamic Table Initialization:** Engine creation uses `Base.metadata.create_all(bind=engine)` inside the main application runtime, which will cause lock/schema race conditions in multi-threaded container deployments (e.g. Render) and makes schema versioning impossible. Proper database migrations (Alembic) are missing.
- **Non-Atomic Dispatch Allocation:** When a resource is dispatched, the database check for resource availability and the subsequent update of resource status are performed separately and without a transaction row lock:
  ```python
  res = db.query(Resource).filter(Resource.id == d.resource_id).first()
  if res and res.status == "dispatched":
      raise HTTPException(status_code=400, detail="Resource already committed/dispatched")
  if res:
      res.status = "dispatched"
  ```
  This is highly vulnerable to race conditions (double allocation of boats/kits by multiple concurrent officer requests).

---

## 5. What is Tightly Coupled
- **`main.py` Bloat:** The file [main.py](file:///c:/SIH/backend/app/main.py) directly manages:
  - Database table creation.
  - CORS middleware config.
  - WebSocket connection manager state (`ConnectionManager` class).
  - All router endpoints (except `/demo`).
  - Hard-coded default values for incident scoring parameters.
- **API Models and Schemas:** Pydantic schemas (e.g., `IncidentCreate`, `RiskCalcInput`, `DispatchCreate`) are defined inside [main.py](file:///c:/SIH/backend/app/main.py) instead of a dedicated `schemas/` package.

---

## 6. What is Missing for Member 3's Responsibilities
- **Centralized Security Layer:** JWT token creation, token expiration, password/phone authentication helper functions, and `get_current_user` dependency injection filters.
- **Centralized Config System:** central config helper (`core/config.py`) that handles `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, CORS `FRONTEND_ORIGIN`, and environment validation.
- **Alembic Migrations:** Configuration files and initial migration scripts to replace `Base.metadata.create_all()`.
- **Database Row Locking:** Logic to acquire row-level locks (e.g. SQLAlchemy `with_for_update()`) on critical resources during dispatch allocation.
- **Standardized WebSocket Event Payload:** Standards and formatting tools to emit JSON payloads (e.g. `{"type": "incident.created", "payload": {...}, "timestamp": "..."}`) rather than colon-separated raw strings.
- **Redis Client Helper:** Centralized cache/short-lived state wrapper (e.g. `core/redis.py`) mapping to `REDIS_URL`.
- **Automated Tests:** Verification suite ensuring health checking, authentication flow, role restriction, incident creation, and transactional dispatch consistency.
- **Render Deployment Config:** A structured `render.yaml` defining the FastAPI Web Service environment, build/start commands, and cron triggers.

---

## 7. Frontend Files Depending on Backend Endpoints
The frontend consumes the backend API via the following client helper files:
- [src/lib/api/client.ts](file:///c:/SIH/src/lib/api/client.ts): Base fetch client adding auth header (Bearer token in `localStorage`) and fallback alerts.
- [src/lib/api/incidents.ts](file:///c:/SIH/src/lib/api/incidents.ts): Fetches incidents list (`GET /incidents`) and creates incidents (`POST /incidents`).

No other frontend component calls the backend directly; they consume mock files inside `src/mocks/` (e.g., `resources.ts`, `alerts.ts`, `shelters.ts`).

---

## 8. Immediate P0 Blockers
1. **Permissive CORS (`*`):** Security risk for production deployments.
2. **Demo Seeding Model Crash:** The seeding script fails on strict SQL engines due to the incorrect columns mapped to the `RiskScore` table initialization.
3. **Dispatch Transaction / Double Commit Risk:** Multiple officers can simultaneously authorize and allocate the same rescue resource because there are no locking/atomic validation operations.
4. **No Authentication Boundary:** Users can call sensitive endpoints (`/dispatches`, `/incidents`, `/rescue-sites/rank`) with arbitrary IDs, bypassing role controls.
5. **Base Metadata Creation in App Startup:** Prevents zero-downtime rolling upgrades on Render/Supabase.
