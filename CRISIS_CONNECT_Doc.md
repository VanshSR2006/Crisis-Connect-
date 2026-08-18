# Crisis Connect — Master Build Playbook
### SIH 2026 · PS3: Disaster Response Intelligence Platform

> **Merge note:** This file combines two source documents you had:
> 1. **Original PRD/TRD** ("Reality Check Before You Build") — the early planning doc with the 5-module MVP scope, SQL schema, FastAPI starter code, sponsor-tool rationale, and dated roadmap.
> 2. **Crisis Connect Master Final Build Playbook** (.docx) — the evolved, judge-facing spec that already explicitly says it consolidates the submitted PPT + the original PRD/TRD + a new "wow-factor" strategy (24 features, explainability, what-if simulation, crisis mode).
>
> Doc 2 is the newer and more authoritative source — treat it as the backbone. But it **dropped several concrete build artifacts** that doc 1 had (exact dates, SQL DDL, starter code, UI prompts). Those are restored below as appendices, updated to match the newer 18-entity data model. Every place the two sources actually disagree is flagged inline with a ⚠️ **Merge note**.

**Status check (as of Aug 19, 2026):** per the dated roadmap in the original doc, you're currently inside **Phase 3, Days 7–13 (19–25 Aug)** — risk model + dashboard map + WebSocket updates, first mentor session window. Mid-review and the "have a rough 5-module MVP demoable" checkpoint are coming up before 3 Sept; finale is 5 Sept.

---

## 0. Reality Check — Ground Rules Before You Build

- **Don't build all the modules you brainstormed.** The original 12-module wishlist (Citizen SOS, Shelter Locator, Safe Route Planner, Volunteer Management, Resource Allocation, Drone Image Analysis, Damage Assessment, Emergency Alerts, Govt Dashboard, Analytics, Predictive Forecasting, AI Copilot, Offline Mode) was a brainstorm, not a spec. Judges reward a **working, coherent slice**, not feature count.
- If you use Cursor/Antigravity to move fast, **every team member must be able to explain and modify any part of the code live**. Don't paste in code nobody on the team understands.
- Your timeline is front-loaded: idea-quality mattered most for Round 1; **working code matters most now**, for mid-review and the finale.
- Team size: 5 members (confirmed).

---

## 1. What This Document Is Based On

The submitted finalist PPT defines Crisis Connect around one coordinated operational workflow: citizen SOS, predictive flood-risk intelligence, AI-assisted report verification, prioritization, demand-driven resource allocation, officer authorization, volunteer response, multilingual information, and live monitoring. It additionally specifies population/demographic intelligence, needs-based resource provisioning, building/floor-plan-aware rescue-site selection, multi-region rescue optimization, and shortage forecasting — all treated here as core requirements, not stretch goals.

The original PRD/TRD supplies the technical foundation: React/Vite/Tailwind, FastAPI, PostgreSQL/PostGIS, WebSockets, scikit-learn, GIS, multilingual alerts, low-bandwidth behavior, and a deliberately limited hackathon scope — explicitly warning against building many disconnected modules.

| Source | What we preserve |
|---|---|
| Submitted PPT | SOS, risk, verification, population/demographics, resource demand, smart rescue sites, optimization, shortage prediction, multilingual + low bandwidth |
| Original PRD/TRD | Citizen/Volunteer/Officer roles, FastAPI, PostGIS, WebSockets, ML risk model, fake-report signals, shortage projection, n8n, sponsor integrations |
| Current prototype | `https://crisisconnect-blue.vercel.app/` is the baseline — new capabilities get integrated into it, not built as a separate product |
| New strategy | Explainable response plan, crisis mode, what-if simulation, resource-pressure view, response priority score, officer copilot, demo scenario mode |

---

## 2. Product Vision

**One sentence:** Make the right disaster-response decision for the right people, at the right place, with the right resources, at the right time.

**The core intelligence loop:**

```
WEATHER / RIVER / TERRAIN → FLOOD RISK → POPULATION IMPACT → RESOURCE DEMAND
   → SOS + VERIFY → PRIORITY SCORING → SAFE-SITE RANKING → OPTIMIZATION
   → RESOURCE ALLOCATION → OFFICER AUTHORIZATION → DISPATCH
   → updated inventory / incident / demand state ↺
```

**What makes it different:**
- Connects hazard intelligence with ground-level SOS reports rather than treating warnings and response as separate systems.
- Reasons about people and their likely needs, not only geography.
- Doesn't pick a rescue site just because it's nearest — considers elevation/flood safety, capacity, occupancy, access, and building data where available.
- Optimizes response across nearby regions instead of treating every small incident as isolated.
- Forecasts resource shortages before they become operational failures.
- Keeps a human officer in the authorization loop for consequential dispatches.
- Designed for low-bandwidth and multilingual last-mile use.

---

## 3. Complete Final Feature Set

Every feature must contribute to the response decision — don't implement anything just because it sounds impressive.

| Feature | Priority | What to build | Why it matters |
|---|---|---|---|
| F01 — Citizen SOS Reporting | MUST | Auto-location, category, severity, text, optional voice/photo | Creates the ground-truth operational signal |
| F02 — Low-Bandwidth SOS | MUST | Lightweight payloads, compressed media, lazy map loading, retry/queue, graceful fallback | Credible for rural/flood-hit areas |
| F03 — Flood Risk Engine | MUST | Zone-level probability from rainfall, river level, elevation/terrain, soil/historical data, population density | Reactive → predictive |
| F04 — Live Risk Heatmap | MUST | Map zones by risk with toggles for incidents/population/resources/sites | Turns model output into an operational view |
| F05 — SOS Verification | HIGH | Credibility/fake-probability from image metadata, GPS consistency, duplicates, text similarity; flag, never silently reject | Protects scarce capacity without dangerous auto-rejection |
| F06 — Response Priority Score | MUST | Combine risk, severity, credibility, affected population/vulnerability, resource gap | Answers "what should happen first?" |
| F07 — Population Intelligence | MUST | Aggregate zone-level population/household/vulnerability indicators | Connects response to actual people affected |
| F08 — Demographic Demand Engine | MUST | Estimate quantities: food, water, medical, sanitation, other essentials | Need-based, not generic, provisioning |
| F09 — Smart Rescue-Site Selection | MUST | Rank by elevation, predicted flood margin, capacity, occupancy, access, surrounding risk, distance | Prevents "nearest" from being the only criterion |
| F10 — Building/Floor-Plan Intelligence | HIGH | Footprints, floor count, usable area — no structural-safety certification claims | Makes site selection physically contextual |
| F11 — Regional Rescue Clustering | HIGH | Group nearby compatible low-density regions for one coordinated operation | Reduces redundant trips |
| F12 — Resource Allocation Optimizer | MUST | Assign boats/kits/volunteers using priority, demand, capacity, distance/ETA, availability | Turns intelligence into action |
| F13 — Resource Shortage Forecast | HIGH | Stock + consumption + committed dispatches → days remaining + reorder qty | Proactive resource planning |
| F14 — Officer Command Dashboard | MUST | Live map + incidents + risk + population + resource pressure + safe sites + shortages + dispatch actions | Main operational interface |
| F15 — Authorized Dispatch | MUST | AI recommends, officer authorizes, then dispatch is created | Keeps human accountability |
| F16 — Volunteer Portal | MUST | Assigned task, destination, resource, ETA, arrived/resolved | Closes the response loop |
| F17 — Multilingual Alerts | HIGH | Officer creates alert → translated into selected Indian languages for zone delivery | Last-mile accessibility |
| F18 — Crisis Mode | WOW | Dashboard switches to control-room view at critical threshold | Operational clarity during escalation |
| F19 — Explain Decision | WOW | Every recommendation shows "Why?" with score factors | Explainable, judge-friendly AI |
| F20 — What-If Simulation | WOW | Simulate +1m flood level or losing 2 boats → recalculated plan | Predictive planning, not static response |
| F21 — AI Response Plan | WOW | Full structured plan: site + resources + volunteers + priority + ETA + reasons | Converges all engines into one recommendation |
| F22 — Resource Pressure Map | STRONG | Demand minus supply by zone, Low→Critical | Shows where shortages will emerge |
| F23 — Officer Copilot | STRETCH | NL assistant that summarizes a zone, explains recommendations, retrieves live context | Memorable AI interface, no autonomous authority |
| F24 — Demo Scenario Mode | MUST FOR FINALE | One button starts a controlled crisis scenario | Live demo doesn't depend on random data |

---

## 4. Feature Specifications — Intelligence Layer

### 4.1 Flood Risk Engine
Produce a probability/risk score, not a magical "prediction." Start with an explainable model (Logistic Regression or Random Forest); upgrade only if data and evaluation justify it.

| Input | Role |
|---|---|
| Rainfall | Recent intensity/accumulation |
| River level | Current level and trend |
| Elevation/terrain | Exposure and relative flood vulnerability |
| Soil moisture | Ground saturation context where available |
| Historical flood data | Past occurrence patterns |
| Population density | Impact prioritization, not physical flood causation |

> ⚠️ **Do not overclaim.** If the model is trained on historical/controlled data, call it a **flood-risk estimation model**. Don't claim it can perfectly predict real floods — this exact overclaim is called out explicitly in §18 as a mark-losing mistake.

### 4.2 Population Intelligence
Aggregate planning level only — never expose personal demographic info to officers who don't need it.
- Population estimate and density by zone
- Household/family estimate where available
- Aggregate age/vulnerability indicators where authorized
- Aggregate gender distribution where relevant to demand planning
- Historical/current consumption patterns
- Incident severity and flood-risk context

### 4.3 Demographic Resource Allocation
Produce resource-specific quantities, not "send relief kits":

| Scenario | System recommendation |
|---|---|
| Large affected population | Increase food/water and shelter capacity |
| Higher medical vulnerability | Prioritize medical supplies and volunteers |
| Higher sanitation/personal-care demand | Increase sanitation/personal-care kits |
| Low stock + high predicted demand | Protect stock, trigger replenishment |
| Several nearby low-density zones | Consider one consolidated operation |

### 4.4 Smart Rescue-Site Selection
Distance is only one factor:

| Factor | Question |
|---|---|
| Elevation / height above sea level | Sufficiently above predicted flood level? |
| Flood margin | Safety margin under predicted scenario? |
| Capacity | Can it hold the estimated affected population? |
| Occupancy | How much usable capacity remains right now? |
| Floor-plan / usable area | Practically usable for evacuation? |
| Access | Can rescue teams reach it? |
| Surrounding risk | Is the site itself exposed or isolated? |
| Distance | How far from affected population clusters? |

Example output: *Government School A · Suitability 91/100 · +2.7 m flood margin · 650 capacity / 120 occupied · 1.4 km away · access available.* Always show the factors behind the score.

### 4.5 Rescue Optimization
Transparent weighted assignment is enough for the MVP.

| Optimization factor | Effect |
|---|---|
| Priority | Critical incidents rise to the top |
| Demand | More affected/vulnerable people → more resource need |
| Capacity fit | Avoid assigning insufficient sites/resources |
| Distance / ETA | Prefer feasible, faster assignments |
| Site safety | Exclude/penalize unsafe sites |
| Availability | Prevent double-dispatch |
| Regional consolidation | Reward coordinated response |

---

## 5. UX Blueprint

### 5.1 Citizen Journey
Open → location detected → one dominant "Report Emergency" action → select type (Rescue / Medical / Food / Shelter / Water / Other) → optional voice/photo + description → submit → status **Reported → Acknowledged → Dispatched → Resolved** → nearest suitable safe-site info + multilingual alerts. On weak connectivity, the SOS payload is prioritized and non-critical content is queued.

### 5.2 Officer Journey
Dashboard opens with risk heatmap, critical incidents, resource pressure, active dispatches → select incident/cluster → system shows credibility, priority, affected population, demand → ranks rescue sites → proposes allocation + regional consolidation → officer clicks Explain Decision or simulates a scenario → edits if needed → **Authorize Response** → dispatch reaches volunteer, dashboard updates live.

### 5.3 Volunteer Journey
Receive assignment → view destination/task/resources/ETA → navigate → mark Arrived → mark Resolved / report exception → citizen and officer status auto-update.

> ⚠️ **Merge note:** the original PRD/TRD's simpler "Admin Control Panel" flow (informational-only, no dispatch) and the "platform oversight" flow with a moderation queue are both **superseded** by the officer journey above, which does include authorized dispatch. Don't build the older no-dispatch version — it directly contradicts F15/F21.

---

## 6. Officer Dashboard — Layout

| Area | What should appear |
|---|---|
| Top KPI strip | Critical zones · People at risk · Active SOS · Resource shortages · Active dispatches |
| Main map | Risk heatmap + SOS + resources + rescue sites + optional population/pressure layers |
| Priority queue | Highest-priority incidents, score, status |
| Response plan panel | Recommended site + resources + volunteers + ETA + reasons |
| Resource panel | Available / committed / shortage forecast |
| Site panel | Safe-site ranking: elevation, capacity, occupancy, flood margin |
| Action bar | Explain Decision · Simulate · Authorize Response |

**Crisis Mode:** at a critical threshold, switch to a control-room view where Critical Zones, People at Risk, Unverified SOS, Resource Shortages, and Active Dispatches dominate.

**Design system carried over from the original UI brief:** severity color coding everywhere — green (low) → yellow (medium) → orange (high) → red (critical); citizen app = calm/reassuring/big touch targets; officer dashboard = dense, dark, control-room aesthetic; every screen should work convincingly with seeded data, no empty states in the demo.

---

## 7. Creative Features for the Finale

| Idea | How it works | Priority |
|---|---|---|
| What-If Crisis Simulation | Change river/flood level or disable resources; recalculate population/sites/shortages/plan | WOW |
| Explain Decision | Every recommendation has a human-readable reason breakdown | WOW |
| Response Plan Generator | One selected crisis → full recommended operation | WOW |
| Resource Pressure Map | Demand-vs-supply by zone | STRONG |
| Crisis Mode | Escalation-focused control-room UI | STRONG |
| Demo Scenario Mode | Scripted but realistic flood event, live UI updates | MUST |
| Priority Score | One transparent score ranks what happens first | MUST |
| Regional Cluster View | Shows why nearby low-density regions are consolidated | STRONG |
| Decision Timeline | Reported → verified → prioritized → site selected → allocated → dispatched → resolved | STRONG |
| Counterfactual Comparison | "Nearest site" vs "optimized safe site," and why optimized wins | WOW |

---

## 8. Final Technical Architecture

```
Citizen PWA      Volunteer Portal      Officer Command Dashboard
     │                  │                       │
     └──────────── REST + WebSocket ────────────┘
                         │
                    FastAPI Backend
                         │
      ┌──────────────────┼──────────────────┐
      ↓                  ↓                  ↓
 PostgreSQL +         Intelligence       External APIs
 PostGIS              Services           Weather / i18n
      │                  │
      │        ┌─────────┼─────────────────────────────┐
      │        ↓         ↓          ↓         ↓        ↓
      │      Risk     Verify     Population  Site    Resource
      │      Engine    Engine     + Demand   Rank    Optimizer
      │                                             │
      └──────────────────────────────→ RESPONSE PLAN
                                               │
                                         Human Approval
                                               │
                                            Dispatch
```

| Layer | Choice | Role |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS | Citizen, officer, volunteer experiences |
| Routing/Data fetching | React Router + TanStack Query | Navigation and API state |
| Maps | Leaflet.js + OpenStreetMap | Heatmap, incidents, sites, routes |
| Charts | Recharts | Risk/resource/forecast visualization |
| Backend | FastAPI | APIs, orchestration, decision services |
| Database | PostgreSQL + PostGIS | Transactional + geospatial data |
| Realtime | FastAPI WebSockets / Socket.IO | Live dashboard updates |
| ML | scikit-learn — Logistic Regression / Random Forest initially | Risk model, lightweight intelligence |
| Verification | Pillow/exifread + geopy + similarity | SOS credibility signals |
| Optimization | Transparent weighted scoring/assignment | Site + resource + cluster decisions |
| Automation | n8n | Weather → risk → alert → translation workflow |
| AI Search | Tavily | Officer copilot / live contextual retrieval, if implemented |
| Translation | Bhashini / Google Translate API | Multilingual alerts |
| Integration | Swytchcode | Accelerate external API integration |
| Deployment | Vercel (frontend) + Render (backend) + managed Postgres | Production-like demo |

> ⚠️ **Merge note — deployment:** the original PRD/TRD suggested deploying **both** frontend and backend on Render (since Render is the named deployment sponsor). The newer spec splits it — **Vercel for frontend, Render for backend** — which also matches your actual live prototype URL (`crisisconnect-blue.vercel.app`). Go with the Vercel+Render split since it's what's already deployed; you're still using Render as the sponsor tool for the backend, so the sponsor-track fit is intact.

**Why each sponsor tool, concretely** (carried over from the original doc, since it explains fit better than the table alone):
- **Render** — direct fit for backend deployment, no extra work.
- **Tavily** — fits the Officer Copilot (F23): natural-language questions like "what's the situation in Sector 4," where Tavily-powered retrieval pulls in live weather/news/advisory context alongside your own incident data.
- **n8n** — fits the background loop (weather ingestion → risk recompute → alert trigger → translation → broadcast). Building it visually in n8n instead of hand-rolled cron code is easy to demo live — judges can literally see the automation graph.
- **Swytchcode** — useful if you're integrating external APIs (weather, translation, maps) and want to move fast without hand-writing every client.

---

## 9. Final Data Model

| Entity | Purpose / key data |
|---|---|
| `users` | Citizen/volunteer/officer identity and role |
| `zones` | Geography, population estimate, boundary, vulnerability |
| `weather_readings` | Rainfall, river level, timestamp |
| `risk_scores` | Probability, label, model version, computed time |
| `incidents` | Location, category, severity, status, credibility, review state |
| `population_profiles` | Aggregate population, households, authorized demographic indicators |
| `demand_forecasts` | Zone + resource type + quantity + confidence |
| `rescue_sites` | Location, capacity, occupancy, elevation, flood margin, access |
| `buildings` | Footprint, elevation, structure metadata, access |
| `floor_plans` | Building, usable area, floor metadata |
| `resources` | Type, quantity, location, status |
| `consumption_logs` | Resource use over time |
| `resource_forecasts` | Consumption rate, days remaining, reorder suggestion |
| `rescue_clusters` | Grouped regions/incidents and combined demand |
| `site_recommendations` | Site score + reason components |
| `dispatches` | Incident/cluster, resource, volunteer, ETA, authorization |
| `alerts` | Zone, message, language versions, severity |
| `optimization_runs` | Input snapshot, algorithm version, assignments, timestamp |

> ⚠️ **Important correction:** the original PRD/TRD's SQL only implemented 8 of these 18 entities (`users`, `zones`, `weather_readings`, `risk_scores`, `incidents`, `shelters`, `resources`, `dispatches`, `alerts`). The other **10 tables the current spec depends on for F07–F13 and F19–F21 don't exist yet in any schema you have** (`population_profiles`, `demand_forecasts`, `buildings`, `floor_plans`, `rescue_sites`, `rescue_clusters`, `site_recommendations`, `consumption_logs`, `resource_forecasts`, `optimization_runs`). Extended DDL for all of it — old + new, reconciled — is in **Appendix A**. Treat Appendix A as the schema to actually run, not the fragment in either source doc alone.

---

## 10. Core API Contract

| Group | Representative endpoint | Purpose |
|---|---|---|
| Auth | `POST /auth/login` | Role-based access |
| Incidents | `POST /incidents` | Citizen SOS |
| Incidents | `GET /incidents` | Officer queue |
| Verification | `POST /incidents/{id}/verify` | Credibility assessment |
| Risk | `GET /risk/zones` | Heatmap |
| Population | `GET /zones/{id}/population` | Impact context |
| Demand | `GET /zones/{id}/demand` | Resource requirement |
| Sites | `POST /rescue-sites/rank` | Safe-site recommendations |
| Optimization | `POST /optimize/rescue-plan` | Cluster + allocation + site plan |
| Resources | `GET /resources` | Inventory |
| Forecast | `GET /resource-forecasts` | Shortage prediction |
| Dispatch | `POST /dispatches` | Officer-authorized dispatch |
| Alerts | `POST /alerts` | Multilingual broadcast |
| Realtime | `WS /ws/dashboard` | Live updates |
| Simulation | `POST /simulate` | What-if scenario |
| Explainability | `GET /recommendations/{id}/explanation` | Reason breakdown |

---

## 11. Build Prioritization

Use this order. If a lower-priority feature threatens a higher-priority one, drop the lower one.

| Tier | Build items | Rule |
|---|---|---|
| P0 — Non-negotiable | Citizen SOS, backend persistence, officer dashboard, risk heatmap, resource allocation, officer authorization, volunteer response, realtime status | Must work end-to-end before polishing |
| P1 — Core differentiators | Population intelligence, demographic demand, smart rescue-site selection, elevation/flood margin, building capacity, optimization/clustering, shortage forecast, low bandwidth, multilingual | Makes the submitted concept real |
| P2 — Finale wow | Explain Decision, Response Plan, Crisis Mode, What-If Simulation, Resource Pressure Map, Demo Scenario | Only after P0/P1 are stable |
| P3 — Stretch | Officer Copilot, safe-route planner, damage image assessment, richer forecasting | Only if core system is reliable |

**Scope rule:** if a feature can't improve the core response story or can't be demonstrated reliably, it's not more important than stabilizing the end-to-end workflow.

---

## 12. Team Game Plan

| Stage | Engineering objective | Deliverable |
|---|---|---|
| 1 — Foundation | Backend + DB + auth + real API contracts | No more frontend-only fake state for critical flows |
| 2 — Vertical slice | Citizen SOS → officer → dispatch → volunteer | One complete working loop |
| 3 — Intelligence | Risk + verification + priority score | Recommendations from actual data |
| 4 — Context | Population + demand + resource pressure | Need-based resource planning |
| 5 — Safety | Building/site dataset + elevation + capacity + ranking | Safe-site decision engine |
| 6 — Optimization | Clusters + allocation + response plan | One-click plan generation |
| 7 — Resilience | Low bandwidth + multilingual + failure fallbacks | Works under constrained conditions |
| 8 — Wow | Explain + simulation + crisis mode + demo scenario | Memorable finale |
| 9 — Hardening | Testing, performance, deployment, backup | No demo-breaking surprises |

**Suggested ownership (5 members):**

| Track | Ownership |
|---|---|
| Frontend / Citizen | SOS, alerts, low-bandwidth, status |
| Officer Dashboard / GIS | Map, incidents, crisis mode, site visualization |
| Backend / Database | FastAPI, PostGIS, auth, WebSockets, APIs |
| AI / Intelligence | Risk, verification, population/demand, shortage |
| Optimization / Integration | Site ranking, resource assignment, clustering, n8n/external APIs |

All five members should still understand the whole system and be able to explain the part they didn't personally code — judges specifically probe for "one person built it" teams.

---

## 13. Data Strategy — Real vs. Simulated

Be honest about data provenance. A real named district with real rainfall/river data (where available) makes the demo stronger. Unavailable live datasets (govt integrations) may be simulated with historical/controlled data — but must be labelled as such.

| Data | Preferred | If unavailable |
|---|---|---|
| Rainfall / river | Real API or real historical dataset | Controlled time-series/mock feed, labelled simulated |
| Population | Authorized aggregate data | Seeded reference dataset, labelled demo data |
| Buildings / elevation | Real geospatial/building reference data | Curated demo buildings with transparent attributes |
| Floor plans | Reference/structured facility data | Seeded floor-plan metadata; never claim structural certification |
| Resources | Realistic seeded inventory | Simulated inventory with visible status |
| Incidents | Live demo submissions + seeded scenario | Demo Scenario Mode |

> ⚠️ **Merge note:** the original doc specifically suggested grounding the whole demo in **one real, named, flood-prone Indian district** (it names Assam as an example) and sourcing real rainfall/river data for it. That's a concrete, judge-differentiating action item that the newer doc only references abstractly ("real, named district"). If you haven't locked a district yet, do it this week — it's called out twice as something that "alone separates serious teams from idea-only teams."

---

## 14. Failure & Edge-Case Design

- Two officers dispatch the same resource → backend must enforce availability/locking.
- ML service fails → dashboard still shows raw incidents and last-known risk.
- Internet is weak → citizen SOS remains the smallest, highest-priority payload.
- Report is suspicious → flag for review, never silently delete.
- Nearest rescue site is unsafe → safe-site ranking overrides distance.
- Recommended site is full → occupancy/capacity constraint forces an alternative.
- Resource already committed → allocation engine can't assign it again.
- Flood scenario changes → site rankings and demand must be recalculable.
- Translation service fails → retain original-language message + predefined emergency phrases.
- External weather API fails → retain last known data, show timestamp clearly.

---

## 15. Metrics to Actually Measure

| Metric | How to measure in demo |
|---|---|
| SOS → dispatch decision time | Controlled manual workflow vs. Crisis Connect |
| Risk coverage | % of demo zones with a current risk score |
| Allocation feasibility | % of recommendations satisfying capacity + availability constraints |
| Site safety filtering | # of unsafe/insufficient sites correctly excluded or penalized |
| Resource utilization | Assigned capacity / available capacity in the scenario |
| Consolidation benefit | Trips/resources before vs. after clustering, same scenario |
| Forecast lead time | Simulated days before stockout that the system raises an alert |
| Connectivity behavior | SOS completion under intentionally degraded network |

---

## 16. Event Timeline & Roadmap

> ⚠️ **Merge note:** the original doc's phase table lost its formatting in extraction, but the actual dates survive in the phase descriptions below — restored here since the newer doc dropped concrete dates entirely.

**Phase 1 — Idea Submission (through 11 Aug):** ~10 days, judged on the idea and proposal, not working code.
- Lock the MVP scope as a team, in writing.
- Ground the idea in one real Indian district with real rainfall/river data sources.
- Draft: problem understanding, proposed solution, tech stack, architecture diagram, differentiation from IMD/NDMA-style systems.
- Get UI mockups done for the 3–4 core screens.
- Optional but strong: a clickable low-fi prototype or 1-minute concept video.
- Registration closed 9 Aug; submission closed 11 Aug.

**Phase 2 — Shortlist (12 Aug) → set up immediately.**
- Repo, Cursor/Antigravity workspace, Postgres+PostGIS, FastAPI skeleton, React skeleton — same day if possible.
- Finalize schema (§9 / Appendix A) and get the backend skeleton running.

**Phase 3 — Mentorship + Mid Review (13 Aug → 3 Sept): ~3 weeks, the real build window.**
- Days 1–6 (13–18 Aug): Incident + resource CRUD APIs, seed zones/data for your district, citizen SOS flow working end-to-end.
- **Days 7–13 (19–25 Aug) — you are here:** Risk model trained on historical data, dashboard map with live incident pins + WebSocket updates. Use your first mentor session in this window — get architecture feedback before going deeper.
- Days 14–18 (26–30 Aug): Resource allocation logic, dispatch flow end-to-end, alert broadcast with translation. Wire in n8n for the weather→risk→alert loop if time allows.
- Around mid-review: have the MVP demoable, even rough — don't hide gaps from mentors, ask about them.
- Days 19–22 (31 Aug–3 Sept): Fix the demo path first, polish UI, load realistic seed data, deploy, rehearse the live demo as a team at least 5 times.

**Phase 4 — Grand Finale (5 Sept, offline — Delhi NCR / Bengaluru).**
- Have a recorded backup demo video ready in case venue wifi fails.
- Every member should be able to answer questions about any part of the system.
- Prepare answers for: how this differs from existing govt systems, how the model actually works, what happens if internet is down, what's real vs. simulated.

---

## 17. The Winning 3–5 Minute Demo

**Don't start by explaining the homepage. Start with a crisis.**

1. Open Officer Command Dashboard in Crisis Mode.
2. "A river level has risen and three zones are now at high/critical risk."
3. Show the risk heatmap, click the highest-priority zone.
4. Show affected population + vulnerability + predicted demand.
5. Submit a citizen SOS from that zone, watch it appear live.
6. Open verification: one normal report, one suspicious report flagged for review.
7. Open Smart Rescue Sites: compare two buildings — show why the higher-elevation/capacity site beats the nearer but unsafe/occupied one.
8. Show nearby low-density regions, generate a consolidated rescue cluster.
9. Generate the AI Response Plan: site + resources + volunteers + ETA + reasons.
10. Click Explain Decision.
11. Click What-If: simulate +1m flood level or losing two boats, show the plan change.
12. Show a resource shortage forecast and reorder recommendation.
13. Officer clicks Authorize Response.
14. Volunteer receives the task, marks Arrived/Resolved.
15. Citizen status updates, multilingual alert shown.
16. Close: "Crisis Connect turns warnings and fragmented reports into an explainable, optimized, authorized response."

---

## 18. Questions Judges Are Likely to Ask

| Judge question | Answer direction |
|---|---|
| How is this different from existing warning systems? | Warnings inform; Crisis Connect operationalizes the response by connecting SOS, risk, people, safe sites, and resources. |
| Why demographics? | Different populations have different relief needs; aggregate demographic/demand indicators improve resource planning. |
| Why elevation? | The nearest building may be flooded or lack safety margin; elevation relative to predicted flood level is a site-selection factor. |
| How do you know a building is safe? | We don't certify structural safety. We rank candidate sites using available elevation, flood, capacity, access, and facility data; authorities make the final decision. |
| Is your flood model really AI? | An ML-based risk estimation pipeline trained/evaluated on the available dataset; we show the inputs and limitations. |
| What if AI is wrong? | Recommendations are explainable and officer-authorized; raw data stays available; AI failure degrades gracefully. |
| What if someone sends fake SOS? | Reports get credibility signals; suspicious cases are flagged for human review, not silently rejected. |
| Why not just send the nearest resource? | Nearest isn't always optimal — capacity, demand, urgency, availability, and regional consolidation matter. |
| Where does your data come from? | Clearly label live, historical, and seeded data. Never claim an integration that isn't implemented. |
| Can this work in rural areas? | Low-bandwidth-first design, multilingual alerts, lightweight citizen workflows are explicit requirements. |
| Can this scale? | Zone-based architecture, PostGIS geospatial queries, stateless APIs, realtime channels give a practical path to district-level scaling. |

---

## 19. Things That Can Make You Lose Marks

- A beautiful frontend with no real backend state.
- Hardcoded "AI" results the team can't explain.
- Generic dummy data such as "Incident 1 / Resource 2."
- Claiming live government integration when it isn't actually connected.
- Calling a heuristic a scientifically validated flood prediction model.
- Claiming a building is structurally safe because its elevation is high.
- Adding blockchain, drones, IoT, or unrelated tech just to sound advanced.
- Making AI autonomous in high-consequence decisions.
- Showing 20 features, none working end-to-end.
- Allowing two dispatches to consume the same resource.
- Ignoring low-bandwidth behavior despite making it a core claim.
- Not knowing the code/architecture during judge Q&A.

---

## 20. Final Engineering Checklist

| Area | Must pass |
|---|---|
| Authentication | Citizen, volunteer, officer roles can't access unauthorized actions |
| SOS | Every submission persists and reaches the dashboard |
| Realtime | New incidents/dispatch status appear without manual refresh |
| Geospatial | Coordinates, zones, sites, resources correctly mapped |
| Risk | Model input/output is visible and reproducible |
| Verification | Suspicious report can be flagged and reviewed |
| Population | Aggregate data drives demand, not decorative |
| Allocation | Unavailable/committed resources can't be assigned twice |
| Site ranking | Capacity + occupancy + elevation/flood margin + access enforced |
| Optimization | Clustered operation is visibly different from independent dispatch |
| Forecast | Stockout alert has a traceable calculation |
| Low bandwidth | Critical citizen path survives constrained connectivity |
| Multilingual | At least 2–3 languages work for the demo scenario |
| Explainability | Every major recommendation has a reason breakdown |
| Simulation | What-if scenario changes the response plan consistently |
| Demo | Complete scripted scenario runs repeatedly from a clean state |
| Deployment | Frontend/backend/database stable and monitored |
| Backup | Recorded backup demo + local fallback before finale |

---

## 21. Final Scope Lock

- **P0 — Must work:** Citizen SOS → live officer dashboard → flood risk → priority → resource allocation → officer authorization → volunteer dispatch → citizen resolution.
- **P1 — Must differentiate:** Population intelligence + demographic demand + smart rescue-site selection (elevation/flood margin/capacity) + regional rescue optimization + shortage forecasting + low-bandwidth + multilingual.
- **P2 — Make judges remember:** Explain Decision + AI Response Plan + What-If Crisis Simulation + Crisis Mode + Resource Pressure Map + Demo Scenario Mode.
- **P3 — Only if time remains:** Officer Copilot + safe-route planner + image-based damage assessment + richer forecasting.

---

## 22. Final Product Statement

**CRISIS CONNECT — FROM SOS TO INTELLIGENT RESPONSE.**
Predict the risk. Understand the people. Choose the safe place. Allocate the right resources. Optimize the response. Keep a human in control.

---

## Appendix A — Backend Schema (Reconciled, Extended)

> ⚠️ Base tables are from the original PRD/TRD; extension tables are new, added to match §9's 18-entity data model. `incidents.category` is extended to include `water` per the citizen journey in §5.1, which the old CHECK constraint didn't allow.

```sql
-- ===== BASE SCHEMA (original PRD/TRD) =====

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  role TEXT CHECK (role IN ('citizen','volunteer','officer','admin')) NOT NULL,
  language_pref TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT,
  boundary GEOMETRY(POLYGON, 4326),
  population_est INT
);

CREATE TABLE weather_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id),
  rainfall_mm FLOAT,
  river_level_m FLOAT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id),
  risk_level TEXT CHECK (risk_level IN ('low','medium','high','critical')),
  score FLOAT,
  computed_at TIMESTAMPTZ DEFAULT now()
);

-- category extended with 'water' to match the citizen journey (§5.1)
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  zone_id UUID REFERENCES zones(id),
  location GEOMETRY(POINT, 4326) NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('rescue','medical','food','shelter','water','other')),
  severity TEXT CHECK (severity IN ('low','medium','high','critical')),
  status TEXT CHECK (status IN ('reported','acknowledged','dispatched','resolved')) DEFAULT 'reported',
  credibility_score FLOAT,
  review_state TEXT CHECK (review_state IN ('unverified','flagged','verified')) DEFAULT 'unverified',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  location GEOMETRY(POINT, 4326),
  capacity INT,
  current_occupancy INT DEFAULT 0,
  zone_id UUID REFERENCES zones(id)
);

CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('boat','medical_kit','food_packet','vehicle','personnel')),
  quantity_available INT,
  zone_id UUID REFERENCES zones(id),
  status TEXT CHECK (status IN ('available','dispatched','depleted')) DEFAULT 'available'
);

CREATE TABLE dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id),
  resource_id UUID REFERENCES resources(id),
  volunteer_id UUID REFERENCES users(id),
  dispatched_by UUID REFERENCES users(id),
  dispatched_at TIMESTAMPTZ DEFAULT now(),
  eta_minutes INT
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id),
  message_en TEXT,
  message_translated JSONB,
  severity TEXT,
  issued_by UUID REFERENCES users(id),
  issued_at TIMESTAMPTZ DEFAULT now()
);

-- ===== EXTENSION SCHEMA (new, to support §9's full data model) =====

CREATE TABLE population_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id),
  population_est INT,
  households_est INT,
  vulnerability_index FLOAT,        -- aggregate indicator, 0.0-1.0
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id),
  resource_type TEXT CHECK (resource_type IN ('food','water','medical_kit','sanitation_kit','shelter','other')),
  quantity_needed INT,
  confidence FLOAT,
  computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  location GEOMETRY(POINT, 4326),
  footprint GEOMETRY(POLYGON, 4326),
  elevation_m FLOAT,
  floor_count INT,
  zone_id UUID REFERENCES zones(id)
);

CREATE TABLE floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id),
  floor_number INT,
  usable_area_sqm FLOAT,
  notes TEXT
);

-- rescue_sites layers flood-safety attributes on top of a building and/or shelter
CREATE TABLE rescue_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id),
  shelter_id UUID REFERENCES shelters(id),
  elevation_m FLOAT,
  predicted_flood_margin_m FLOAT,
  capacity INT,
  current_occupancy INT DEFAULT 0,
  access_status TEXT CHECK (access_status IN ('accessible','limited','blocked')) DEFAULT 'accessible',
  zone_id UUID REFERENCES zones(id)
);

CREATE TABLE site_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id),
  rescue_site_id UUID REFERENCES rescue_sites(id),
  suitability_score FLOAT,
  reason_breakdown JSONB,           -- e.g. {"elevation": 0.9, "capacity": 0.8, "distance": 0.7}
  computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rescue_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_ids UUID[],
  combined_demand JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE consumption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id),
  quantity_used INT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE resource_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id),
  consumption_rate_per_day FLOAT,
  days_remaining FLOAT,
  reorder_suggestion INT,
  computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE optimization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_snapshot JSONB,
  algorithm_version TEXT,
  assignments JSONB,
  run_at TIMESTAMPTZ DEFAULT now()
);

-- ===== INDEXES =====
CREATE INDEX idx_incidents_location ON incidents USING GIST (location);
CREATE INDEX idx_shelters_location ON shelters USING GIST (location);
CREATE INDEX idx_zones_boundary ON zones USING GIST (boundary);
CREATE INDEX idx_buildings_location ON buildings USING GIST (location);
CREATE INDEX idx_rescue_sites_zone ON rescue_sites (zone_id);
```

---

## Appendix B — Starter Backend Code (FastAPI)

> ⚠️ This is the original in-memory starter, kept as-is for reference. It's a skeleton only — swap `incidents_db = []` for real SQLAlchemy/asyncpg calls against the schema in Appendix A before Phase 3 Days 1–6 CRUD work, and update the `category` field to include `water`.

```python
# main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid

app = FastAPI(title="Disaster Response Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before final demo
    allow_methods=["*"],
    allow_headers=["*"],
)

class IncidentCreate(BaseModel):
    reporter_id: Optional[str] = None
    zone_id: str
    lat: float
    lon: float
    description: str
    category: str   # rescue | medical | food | shelter | water | other
    severity: str    # low | medium | high | critical

incidents_db = []  # replace with real Postgres calls via SQLAlchemy/asyncpg

@app.post("/incidents")
def create_incident(incident: IncidentCreate):
    record = incident.dict()
    record["id"] = str(uuid.uuid4())
    record["status"] = "reported"
    incidents_db.append(record)
    return record

@app.get("/incidents")
def list_incidents():
    return incidents_db

@app.websocket("/ws/dashboard")
async def dashboard_feed(websocket: WebSocket):
    await websocket.accept()
    # push new incidents/dispatches to connected officers in real time
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"echo: {data}")
```

```python
# risk_model.py — starting point for the flood risk scorer
import numpy as np
from sklearn.linear_model import LogisticRegression

# Train once on historical rainfall/river-level -> flood(0/1) data
# X columns: [rainfall_mm_24h, river_level_m, elevation_m, soil_saturation]

def train_risk_model(X, y):
    model = LogisticRegression()
    model.fit(X, y)
    return model

def score_zone(model, rainfall_mm, river_level_m, elevation_m, soil_saturation):
    prob = model.predict_proba([[rainfall_mm, river_level_m, elevation_m, soil_saturation]])[0][1]
    if prob < 0.25:
        level = "low"
    elif prob < 0.5:
        level = "medium"
    elif prob < 0.75:
        level = "high"
    else:
        level = "critical"
    return {"score": float(prob), "risk_level": level}
```

---

## Appendix C — UI Mockup Prompts (for Google Stitch or similar)

Use one prompt per screen — keep each scoped to a single screen for clean output.

1. *"Mobile app home screen for a disaster emergency reporting app. Large red 'Report Emergency' button, current location shown on a small map card, list of nearby shelters below, clean minimal Material Design, calm blue/white color scheme with red as accent only for emergency actions."*
2. *"Mobile screen: emergency report form with category selection (rescue, medical, food, shelter, water) as large tappable icon cards, optional photo/voice attach button, big submit button, progress indicator showing 'Reported → Acknowledged → Dispatched'."*
3. *"Desktop command dashboard for disaster response officers. Left sidebar with incident list (color-coded by severity), center full-screen map with heatmap overlay and pins, right panel showing selected incident details and a 'Dispatch Resource' button, dark theme for control-room feel."*
4. *"Desktop dashboard widget: resource inventory table showing boats, medical kits, food packets per zone with availability status badges (available/dispatched/low)."*
5. *"Mobile volunteer app: task list screen with cards showing incident location, distance, severity badge, and 'Navigate' + 'Mark Arrived' buttons."*

> ⚠️ Prompt #2 updated to add "water" as a category option, matching the §5.1 citizen journey and the extended `incidents.category` field in Appendix A — the original prompt only listed rescue/medical/food/shelter.
