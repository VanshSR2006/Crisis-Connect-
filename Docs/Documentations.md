0. Reality Check Before You Build

A few things worth saying upfront so you don't burn week 1 on the wrong things:

Don't build all 12 "Potential Modules." That list (Citizen SOS, Shelter Locator, Safe Route Planner, Volunteer Management, Resource Allocation, Drone Image Analysis, Damage Assessment, Emergency Alerts, Govt Dashboard, Analytics, Predictive Forecasting, AI Copilot, Offline Mode) is a brainstorm, not a spec. Judges do not reward feature count — they reward a working, coherent slice that solves a real decision-making problem end-to-end. Pick 4-5 modules that form one clean story and make them actually work.

Building/coding-tools like Cursor and Antigravity are fine, but you must be able to explain and modify every part of your code live in front of judges — so don't paste in things nobody on the team understands.

Your timeline is tight and front-loaded: only ~10 days before the idea deadline, then ~3 weeks to actually build after shortlisting. That changes the plan below significantly from a typical 5-6 week hackathon — idea-quality and a believable technical plan matter more than working code for Round 1; working code matters most for the mid-review and finale.

Your Event Timeline (confirmed)

Team size: 5 members (confirmed).

Sponsor tools — use these deliberately, not decoratively

This event has named sponsors for a reason — judges and mentors will likely be looking for genuine use of at least some of them, and sponsor tracks often carry their own prizes. Don't bolt them on artificially; use where they naturally fit:

Render (Deployment Partner) — deploy your backend + frontend here. This is a direct fit with the stack recommended below, no extra work.

Tavily (AI Search Partner) — perfect fit for the "AI Copilot" stretch module: let officers ask natural-language questions ("what's the situation in Sector 4") where Tavily-powered retrieval pulls in live weather/news/advisory context alongside your own incident data.

n8n (workflow automation) — great fit for your background loop (weather ingestion → risk recompute → alert trigger → translation → broadcast). Building this visually in n8n instead of hand-rolled cron code is easy to demo live and judges can literally see the automation graph.

Swytchcode (AI Integration Partner) — an AI-assisted API integration tool (turns OpenAPI specs into working integration code, has an MCP server for AI agents to call APIs). Useful if you're integrating external APIs (weather data, translation, maps) and want to move fast during the 3-week build window without hand-writing every client.





1. Product Requirements Document (PRD)

1.1 Problem Statement (PS3, as given)

Build a Disaster Response Intelligence Platform for flood prediction, emergency planning, and resource allocation.

1.2 Who this is for (3 personas — don't add more)

1.3 MVP Scope (what you demo on stage — 5 modules)

Citizen SOS Reporting — report location + situation (text/voice, works with poor connectivity), auto-tagged on a map.

Flood Risk Prediction — a model (can start simple: rainfall + river level + elevation threshold logic, upgrade to ML if time permits) that outputs a risk score per zone, shown as a heatmap.

Resource Allocation Engine — matches available resources (boats, medical kits, food, shelters) to incident clusters using a simple optimization (nearest-available + capacity constraint is enough — you don't need real operations-research complexity for a demo).

Command Dashboard — live map of SOS reports + risk heatmap + resource status + one-click "dispatch" action.

Multilingual Alerts — push/SMS-style alert broadcast to a zone, in 2-3 Indian languages (use a translation API, don't hand-roll NLP for this).

1.4 Stretch Scope (only if MVP is solid by week 3)

Safe route planner (avoid flooded roads using OSM + simple graph search)

Damage assessment from uploaded images (basic CV classifier: flooded/not-flooded)

Offline-first PWA mode for citizen app

AI Copilot chat for officers ("summarize situation in Sector 4")

1.5 Explicitly Out of Scope (say this out loud to judges — it shows maturity)

Real drone integration/hardware

Actual govt system integration (IMD, NDMA APIs) — simulate with mock/historical data instead, but say clearly that's what you did

Training a custom deep learning flood model from scratch — use an established approach (regression/threshold model or a pretrained CV model), don't overclaim "our AI predicts floods" if it's a heuristic

1.6 Success Metrics (for your pitch, not your code)

Time from SOS report to dispatch decision (simulate and show improvement vs manual process)

% of zones with predictive risk score before an incident occurs

Resource utilization rate in the allocation demo





2. Technical Requirements Document (TRD)

2.1 Recommended Stack (optimized for 5 people, ~5 weeks, Cursor/Antigravity friendly)

2.2 High-Level Architecture

┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐

│  Citizen App     │     │  Volunteer Portal │     │  Command Dashboard │

│  (React PWA)     │     │  (React)          │     │  (React)           │

└────────┬─────────┘     └─────────┬─────────┘     └──────────┬─────────┘

         │  REST + WebSocket        │                          │

         └───────────────┬──────────┴──────────────────────────┘

                          │

                 ┌────────▼─────────┐

                 │   FastAPI Backend │

                 │  - Auth           │

                 │  - SOS/Incidents  │

                 │  - Risk Engine    │

                 │  - Allocation     │

                 │  - Alerts/i18n    │

                 └────────┬─────────┘

                          │

        ┌─────────────────┼───────────────────┐

        │                 │                   │

┌───────▼──────┐  ┌───────▼───────┐   ┌───────▼────────┐

│ PostgreSQL +  │  │ ML Model      │   │ External APIs  │

│ PostGIS       │  │ (risk scoring)│   │ (weather, i18n)│

└───────────────┘  └───────────────┘   └────────────────┘

2.3 Non-Functional Requirements (say these in your PPT — judges like to hear it)

Works on low bandwidth (compress payloads, lazy-load map tiles)

Data privacy: citizen phone numbers not exposed on public dashboard views

Graceful degradation: if ML risk service is down, dashboard still shows raw sensor/report data





3. Backend Schema (PostgreSQL + PostGIS)

sql

-- Users (citizens, volunteers, officers)

CREATE TABLE users (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    phone TEXT UNIQUE,

    role TEXT CHECK (role IN ('citizen','volunteer','officer','admin')) NOT NULL,

    language_pref TEXT DEFAULT 'en',

    created_at TIMESTAMPTZ DEFAULT now()

);



-- Zones (admin boundaries you're monitoring - ward/village level)

CREATE TABLE zones (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    district TEXT,

    boundary GEOMETRY(POLYGON, 4326),   -- PostGIS

    population_est INT

);



-- Sensor / weather readings feeding the risk model

CREATE TABLE weather_readings (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    zone_id UUID REFERENCES zones(id),

    rainfall_mm FLOAT,

    river_level_m FLOAT,

    recorded_at TIMESTAMPTZ DEFAULT now()

);



-- Model output per zone

CREATE TABLE risk_scores (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    zone_id UUID REFERENCES zones(id),

    risk_level TEXT CHECK (risk_level IN ('low','medium','high','critical')),

    score FLOAT,             -- 0.0 - 1.0

    computed_at TIMESTAMPTZ DEFAULT now()

);



-- SOS / incident reports from citizens

CREATE TABLE incidents (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reporter_id UUID REFERENCES users(id),

    zone_id UUID REFERENCES zones(id),

    location GEOMETRY(POINT, 4326) NOT NULL,

    description TEXT,

    category TEXT CHECK (category IN ('rescue','medical','food','shelter','other')),

    severity TEXT CHECK (severity IN ('low','medium','high','critical')),

    status TEXT CHECK (status IN ('reported','acknowledged','dispatched','resolved')) DEFAULT 'reported',

    created_at TIMESTAMPTZ DEFAULT now()

);



-- Shelters

CREATE TABLE shelters (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT,

    location GEOMETRY(POINT, 4326),

    capacity INT,

    current_occupancy INT DEFAULT 0,

    zone_id UUID REFERENCES zones(id)

);



-- Resources (boats, medical kits, food packets, vehicles)

CREATE TABLE resources (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    type TEXT CHECK (type IN ('boat','medical_kit','food_packet','vehicle','personnel')),

    quantity_available INT,

    zone_id UUID REFERENCES zones(id),

    status TEXT CHECK (status IN ('available','dispatched','depleted')) DEFAULT 'available'

);



-- Dispatch actions (links incident -> resource -> volunteer)

CREATE TABLE dispatches (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    incident_id UUID REFERENCES incidents(id),

    resource_id UUID REFERENCES resources(id),

    volunteer_id UUID REFERENCES users(id),

    dispatched_by UUID REFERENCES users(id),   -- officer

    dispatched_at TIMESTAMPTZ DEFAULT now(),

    eta_minutes INT

);



-- Alerts broadcast to zones

CREATE TABLE alerts (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    zone_id UUID REFERENCES zones(id),

    message_en TEXT,

    message_translated JSONB,   -- {"hi": "...", "ta": "...", "bn": "..."}

    severity TEXT,

    issued_by UUID REFERENCES users(id),

    issued_at TIMESTAMPTZ DEFAULT now()

);



-- Indexes you'll actually need for demo-speed

CREATE INDEX idx_incidents_location ON incidents USING GIST (location);

CREATE INDEX idx_shelters_location ON shelters USING GIST (location);

CREATE INDEX idx_zones_boundary ON zones USING GIST (boundary);





4. App Flow (core user journeys)

Citizen — report an SOS Open app → allow location → tap "Report Emergency" → pick category (rescue/medical/food/shelter) → optional voice note/photo → submit → sees confirmation + nearest shelter + live status ("Reported → Reviewed → Verified")

Admin — Admin Control Panel Login → dashboard loads map (risk heatmap layer + live incident pins) → click incident → see full report details → mark "Reviewed" or "Flag as False Report" → status updates live for citizen (no dispatch — platform is informational only)

Admin — platform oversight Login → Overview shows active users, pending moderation count, and data feed health → click Incident Reports → review a citizen-submitted report → Approve/Reject/Edit → click Alerts & Broadcast → review auto-suggested alert → Approve → alert is broadcast (translated) to citizens in zone → action logged to Audit Log in real time

System — background loop Weather data ingested (cron/mock feed) → risk model recomputes zone scores every N minutes → if score crosses threshold → auto-suggest alert appears in Admin's Alerts & Broadcast queue → Admin approves → alert broadcast (translated) to citizens in zone





5. UI/UX Brief (for Google Stitch prompts)

Use one Stitch prompt per screen — keep each prompt scoped to a single screen for clean output. Suggested prompts:

"Mobile app home screen for a disaster emergency reporting app. Large red 'Report Emergency' button, current location shown on a small map card, list of nearby shelters below, clean minimal Material Design, calm blue/white color scheme with red as accent only for emergency actions."

"Mobile screen: emergency report form with category selection (rescue, medical, food, shelter) as large tappable icon cards, optional photo/voice attach button, big submit button, progress indicator showing 'Reported → Acknowledged → Dispatched'."

"Desktop command dashboard for disaster response officers. Left sidebar with incident list (color-coded by severity), center full-screen map with heatmap overlay and pins, right panel showing selected incident details and a 'Dispatch Resource' button, dark theme for control-room feel."

"Desktop dashboard widget: resource inventory table showing boats, medical kits, food packets per zone with availability status badges (available/dispatched/low)."

"Mobile volunteer app: task list screen with cards showing incident location, distance, severity badge, and 'Navigate' + 'Mark Arrived' buttons."

Design principles to keep consistent across all screens:

Severity color coding everywhere: green (low) → yellow (medium) → orange (high) → red (critical). Judges notice consistent systems.

Citizen app = calm, reassuring, big touch targets (people using this may be stressed/on bad networks).

Officer dashboard = dense, data-rich, dark mode (control-room aesthetic reads as "serious infrastructure" to judges).

Every screen should work convincingly with fake/seeded data — don't leave empty states in your demo.





6. Implementation Roadmap (mapped to your actual dates)

Team split (5 members)

Phase 1 — Now → 11 Aug (Idea Submission): ~10 days

This round is judged on the idea + written/visual proposal, not working code — so prioritize clarity over building:

Lock the 5-module MVP scope (Section 1.3) as a team — write it down.

Pick one real Indian district to ground the idea in (e.g. a flood-prone Assam district), and find real rainfall/river-level data sources for it — a proposal grounded in real data beats a generic one.

Draft the idea submission: problem understanding, proposed solution, tech stack, architecture diagram (Section 2.2), and what makes it different from existing systems (IMD alerts, NDMA apps, etc.).

Get Stitch UI mockups done for the 3-4 core screens (Section 5) — visuals materially strengthen an idea submission.

Optional but strong: a clickable low-fi prototype or a 1-min concept video, if time allows before the 11th.

Submit before 11 Aug, registration itself closes 9 Aug — don't leave registration to the last day.

Phase 2 — 12 Aug (Top 60 announced) → set up immediately

The moment you're shortlisted, don't wait for the first mentorship session to start building:

Set up repo, Cursor/Antigravity workspace, Postgres+PostGIS, FastAPI skeleton, React skeleton (same day if possible).

Finalize DB schema (Section 3) and get the backend skeleton (Section 8) running.

Phase 3 — 13 Aug → 3 Sept (Mentorship + Mid Review): ~3 weeks — this is your real build window

Days 1-6 (13-18 Aug): Incident + resource CRUD APIs, seed zones/data for your chosen district, citizen SOS flow working end-to-end against the real backend.

Days 7-13 (19-25 Aug): Risk model trained on historical data, dashboard map with live incident pins + WebSocket updates. Use your first mentor session here — get feedback on architecture before you're deep into building the rest.

Days 14-18 (26-30 Aug): Resource allocation logic, dispatch flow end-to-end, alert broadcast with translation. Wire in n8n for the weather→risk→alert automation loop if time allows.

Around the mid review: have the 5-module MVP demoable, even if rough — mid review is where mentors catch scope problems early, so don't hide gaps, ask about them.

Days 19-22 (31 Aug-3 Sept): Fix the demo path first, polish UI, load realistic seed data, deploy to Render, rehearse the live demo as a team at least 5 times.

Phase 4 — 5 Sept (Grand Finale, offline — Delhi NCR / Bengaluru)

Have a recorded backup demo video ready in case venue wifi fails — this saves teams every year.

Every member should be able to answer questions about any part of the system — judges specifically probe for "one person built it" teams.

Prepare answers for: "how is this different from existing govt systems," "how does your model actually work," "what happens if internet is down," "what's real vs simulated data."



7. What to definitely include to become a finalist

Based on how SIH judging is generally described by mentors/past winners and internal-hackathon evaluation rubrics, judges weigh:

Innovation & originality — not "we used AI" but a specific, well-reasoned mechanism (e.g., how exactly your risk model combines rainfall + river level + terrain).

Relevance to the problem statement — stay tightly anchored to flood prediction / emergency planning / resource allocation; don't let scope creep dilute the story.

Technical feasibility & depth — a working prototype beats a polished slide deck with no backend. Judges will ask to see it run and will probe the ML/architecture.

Implementation strategy & clarity of plan — you should be able to explain what's real vs simulated, and why you made each tech choice.

Impact & scalability — quantify it: "X villages," "reduces SOS-to-dispatch time by Y%," "works for districts with poor connectivity."

Presentation & team command of the material — every member should be able to answer questions about any part of the system; judges specifically probe this to catch "one person built it, rest just presented" teams.

Concretely, to stand out:

Ground your demo in a real, named district with real rainfall/river data, not generic dummy numbers — this alone separates serious teams from idea-only teams.

Have a clear "what's real vs simulated" slide — judges respect honesty about scope far more than vague overclaiming.

Show the multilingual + low-bandwidth angle explicitly — it directly answers "why does this matter for India specifically."

Rehearse a tight 3-minute live demo of the 5 MVP modules, not a feature tour of everything you wish you'd built.



8. Starter Backend Skeleton (FastAPI)

python

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

    category: str  # rescue | medical | food | shelter | other

    severity: str  # low | medium | high | critical



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

python

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

    if prob < 0.25: level = "low"

    elif prob < 0.5: level = "medium"

    elif prob < 0.75: level = "high"

    else: level = "critical"

    return {"score": float(prob), "risk_level": level}



