# CrisisConnect

> An intelligent, location-aware disaster response and emergency coordination platform.

CrisisConnect is a disaster management platform designed to connect citizens, emergency responders, volunteers, and administrators through a unified system.

The platform combines real-time incident reporting, GIS-based rescue and shelter discovery, emergency alerts, resource coordination, and an AI-powered emergency assistant to make disaster response faster, more accessible, and better coordinated.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Emergency-First AI Assistant](#emergency-first-ai-assistant)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Core Workflows](#core-workflows)
- [GIS and Location Intelligence](#gis-and-location-intelligence)
- [Emergency SOS](#emergency-sos)
- [Security](#security)
- [Offline and Resilience Support](#offline-and-resilience-support)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Overview](#api-overview)
- [Future Scope](#future-scope)
- [Contributors](#contributors)
- [License](#license)

---

## Overview

During disasters, critical information is often fragmented across emergency services, citizens, volunteers, and local authorities.

CrisisConnect provides a centralized platform where:

- Citizens can report incidents and request emergency assistance.
- Users can discover nearby shelters and rescue locations.
- Officers can monitor incidents and coordinate response.
- Volunteers can assist with resource and ground-level operations.
- Administrators can manage the overall disaster response system.
- An AI assistant can provide conversational emergency guidance without requiring authentication.

The goal is to reduce the time between **detecting a crisis and delivering useful assistance**.

---

## Key Features

### 1. Emergency Incident Reporting

Citizens can report emergencies through the platform.

Incident information can include:

- Location
- Disaster type
- Severity
- Description
- Reporter information
- Incident status

Incidents can then be reviewed and managed by authorized response personnel.

---

### 2. Emergency SOS

CrisisConnect provides an SOS mechanism for users facing immediate danger.

The system supports:

- Guest emergency reporting
- Authenticated incident reporting
- SOS reference IDs
- Backend validation
- Rate limiting
- Incident tracking

Emergency access is intentionally kept low-friction while protected operations remain authenticated.

---

### 3. GIS-Based Rescue Sites

Rescue sites are represented geographically and displayed through an interactive map.

The system supports:

- Multiple rescue locations
- Geographic visualization
- Distance-based ranking
- Flood-aware location prioritization
- Rescue site inventory
- Location-based decision support

Rescue-site ranking uses geographic distance and disaster-zone information rather than relying only on static lists.

---

### 4. Shelter Discovery

The citizen interface provides access to available emergency shelters.

Shelter information can include:

- Shelter name
- Location
- Capacity
- Available beds
- Facilities
- Geographic distance

Shelters can be discovered across supported regions rather than being limited to a single demonstration location.

---

### 5. Disaster Alerts

CrisisConnect provides disaster-related alerts to users.

Alerts can contain information such as:

- Disaster type
- Severity
- Affected area
- Alert message
- Timestamp
- Active/inactive status

The AI assistant can also retrieve active alerts conversationally.

---

### 6. Officer Dashboard

Authorized officers can monitor disaster activity through a centralized dashboard.

The dashboard provides access to:

- Active incidents
- Incident locations
- Rescue sites
- Shelters
- Disaster zones
- Response information
- GIS visualization

Role-based access prevents unauthorized users from accessing officer functionality.

---

### 7. Volunteer Coordination

Volunteers can participate in disaster response operations through their dedicated interface.

The platform is designed to support:

- Volunteer participation
- Resource coordination
- Response activities
- Incident assistance

---

### 8. Resource Management

CrisisConnect supports management of emergency resources required during disaster response.

Resources can be associated with response operations and tracked by authorized users.

Examples include:

- Emergency supplies
- Rescue resources
- Medical resources
- Relief resources

---

# Emergency-First AI Assistant

CrisisConnect includes an **emergency-first conversational AI assistant**.

Instead of requiring users to navigate through multiple emergency controls, the assistant acts as a conversational entry point for emergency support.

The assistant can:

- Detect emergency situations from natural language.
- Understand locations mentioned by users.
- Find relevant shelters.
- Retrieve active disaster alerts.
- Provide emergency safety guidance.
- Create SOS reports through conversation.
- Operate without requiring login for emergency assistance.
- Support English, Hindi, and Kannada emergency interactions.

### Example
User:
"I'm trapped in Bangalore, water is rising."

AI:
"You're in an emergency situation. Can I send a rescue
report using Bangalore as your location?"

User:
"Yes."

CrisisConnect:
→ Creates an SOS incident
→ Generates a reference ID
→ Looks up relevant shelter information
→ Provides emergency safety guidance
Confirmation-Based SOS

Emergency detection alone does not automatically create an incident.

The assistant requires explicit confirmation before dispatching an SOS.

User:
"I'm trapped in Bangalore, water is rising."

AI:
"Can I send a rescue report?"

User:
"No, just tell me a shelter."

Result:
→ No SOS is created
→ Shelter lookup is performed

This prevents accidental incident creation while keeping emergency assistance accessible.
System Architecture
                         ┌─────────────────────┐
                         │      Citizens       │
                         │  Web / AI Assistant │
                         └──────────┬──────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│                                                        │
│  Citizen │ Officer │ Volunteer │ Admin │ AI Assistant │
└────────────────────────┬───────────────────────────────┘
                         │ REST / HTTP
                         ▼
┌────────────────────────────────────────────────────────┐
│                    FastAPI Backend                      │
│                                                        │
│ Auth │ Incidents │ Alerts │ Shelters │ Rescue Sites   │
│ AI   │ Resources │ Demo   │ Role Authorization        │
└───────────────┬───────────────────┬────────────────────┘
                │                   │
                ▼                   ▼
       ┌────────────────┐   ┌────────────────┐
       │   PostgreSQL   │   │ Redis / KV     │
       │    Supabase    │   │ Rate Limiting  │
       └────────────────┘   └────────────────┘
                │
                ▼
       ┌────────────────┐
       │ GIS / Location │
       │   Processing   │
       └────────────────┘

                ┌──────────────────────┐
                │ External AI Services │
                │ Sarvam / AI APIs     │
                └──────────────────────┘
User Roles

CrisisConnect uses role-based authorization.

Role	Main Responsibilities
Citizen	Report incidents, request emergency assistance, find shelters and alerts
Volunteer	Assist with response and resource coordination
Officer	Monitor incidents, rescue operations, shelters and disaster activity
Admin	Manage system-level operations and configuration

Protected routes and backend APIs enforce role permissions.

A user cannot gain access to another role's functionality simply by directly entering its URL.

Technology Stack
Frontend
React
TypeScript / JavaScript
Vite
Leaflet
Tailwind CSS / project UI components
Browser Geolocation APIs
Backend
Python
FastAPI
Pydantic
SQLAlchemy
JWT authentication
Redis-compatible key-value storage
Database
PostgreSQL
Supabase
PostGIS-compatible geographic functionality
AI
Sarvam AI
Conversational emergency processing
Speech-to-text
Text-to-speech
Multilingual emergency interaction
Deployment
Vercel — Frontend
Render — Backend
Supabase — Database
Render Key Value / Redis-compatible storage — rate limiting and related backend services
Project Structure
Crisis-Connect/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── redis.py
│   │   │   └── rate_limiter.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── incidents.py
│   │   │   ├── alerts.py
│   │   │   ├── shelters.py
│   │   │   ├── rescue_sites.py
│   │   │   └── ai.py
│   │   │
│   │   ├── services/
│   │   │   └── ai_knowledge.py
│   │   │
│   │   └── main.py
│   │
│   └── tests/
│
├── src/
│   ├── components/
│   │   ├── assistant/
│   │   ├── citizen/
│   │   ├── officer/
│   │   ├── volunteer/
│   │   └── shared/
│   │
│   ├── lib/
│   │   ├── emergencyAssistant.ts
│   │   └── emergencyAssistant.test.ts
│   │
│   ├── pages/
│   └── App.*
│
├── public/
├── package.json
├── vite.config.*
└── README.md
Core Workflows
Citizen Emergency Workflow
Citizen encounters danger
        ↓
Opens CrisisConnect
        ↓
Uses AI Assistant
        ↓
Describes emergency
        ↓
Assistant identifies emergency context
        ↓
Requests confirmation for SOS
        ↓
User confirms
        ↓
SOS incident created
        ↓
Reference ID returned
        ↓
Shelter / alert / safety information provided
Shelter Discovery Workflow
User provides location
        ↓
Frontend / AI assistant requests shelter data
        ↓
Backend retrieves shelter inventory
        ↓
Distance calculated
        ↓
Relevant shelters returned
        ↓
User receives shelter information
Officer Response Workflow
Incident reported
        ↓
Backend validates request
        ↓
Incident stored in PostgreSQL
        ↓
Authorized officer accesses dashboard
        ↓
Incident displayed on GIS map
        ↓
Officer evaluates location/severity
        ↓
Response can be coordinated
GIS and Location Intelligence

CrisisConnect uses geographic information to improve disaster response.

The GIS layer supports:

Incident mapping
Rescue-site mapping
Shelter mapping
Disaster-zone visualization
Distance calculations
Location-aware recommendations
Geographic prioritization

Rescue sites are displayed as inventory on the map, while ranking logic can be used to prioritize relevant locations based on distance and disaster conditions.

Emergency SOS

The SOS system is designed around two principles:

Low friction for genuine emergencies

Users should be able to request emergency assistance without being forced through a normal authentication flow.

High trust for consequential actions

Creating incidents and triggering response workflows must not depend solely on untrusted client input.

The backend therefore:

Does not trust a client-supplied authenticated reporter identity.
Uses the authenticated user's identity when available.
Uses NULL reporter identity for legitimate guest emergency reports.
Applies rate limiting to incident creation.
Prevents protected roles from being impersonated.
Requires explicit confirmation in the conversational AI flow.
Security

Security is enforced at both frontend and backend levels.

Authentication

JWT-based authentication is used for protected operations.

Role-Based Authorization

Protected routes such as:

/officer/*
/volunteer/*
/citizen/*

are guarded according to the authenticated user's role.

Backend APIs independently enforce authorization and do not rely solely on frontend route protection.

Identity Enforcement

Authenticated incident creation uses the server-side authenticated identity rather than trusting:

reporter_id

from the client.

Guest emergency reporting uses no fake guest database user.

Rate Limiting

Rate limits are applied to sensitive endpoints including:

/auth/login
/auth/signup
/incidents
/ai/assistant
/ai/speech-to-text
/ai/text-to-speech

Redis-compatible storage is used when available, with an in-memory fallback for development.

Offline and Resilience Support

Disaster environments can have unstable connectivity.

The application therefore considers unreliable network conditions in its emergency workflows.

The frontend can queue relevant emergency requests when network connectivity is unavailable and attempt synchronization when connectivity is restored.

This is particularly important for emergency reporting, where a temporary network failure should not unnecessarily prevent the user from recording a distress report.

Getting Started
Prerequisites

Install:

Node.js
npm
Python 3.10+
PostgreSQL / Supabase
Redis-compatible storage for production rate limiting
Clone the Repository
git clone <repository-url>
cd Crisis-Connect
Backend Setup

Navigate to the backend:

cd backend

Create and activate a virtual environment if required:

python -m venv venv

Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Configure the backend environment variables.

Start the development server:

uvicorn app.main:app --reload

The API will be available at:

http://localhost:8000

API documentation:

http://localhost:8000/docs
Frontend Setup

From the project root:

npm install

Start the development server:

npm run dev

The frontend will be available at the Vite development URL shown in the terminal.

Environment Variables

The exact variables may vary depending on the deployment configuration.

Typical backend configuration includes:

DATABASE_URL=
SECRET_KEY=
ACCESS_TOKEN_EXPIRE_MINUTES=
REDIS_URL=

SARVAM_API_KEY=

Frontend configuration may include:

VITE_API_URL=

Never commit production credentials, API keys, database passwords, or JWT secrets to the repository.

Use environment variables provided by the deployment platform for production credentials.

Running the Project

Start the backend:

uvicorn app.main:app --reload

Start the frontend:

npm run dev

Then open the frontend in your browser.

Testing

The project contains both backend and frontend tests.

Backend

From the backend directory:

python -m pytest -q
Frontend

Run:

npm test

or the project's configured test command.

Before submitting changes, verify:

Backend tests → PASS
Frontend tests → PASS
Production build → PASS
git diff --check → PASS
Deployment

The current deployment architecture uses:

Frontend
   ↓
Vercel

Backend
   ↓
Render

Database
   ↓
Supabase PostgreSQL

Redis-compatible storage
   ↓
Render Key Value / Redis

Production deployments should use environment variables rather than hard-coded credentials.

After deployment, verify:

Frontend loads successfully.
Backend health/API endpoints respond.
Authentication works.
Role-based routes are protected.
Incident creation works.
Shelter data is available.
Rescue sites are available.
Active alerts load.
AI assistant works.
Guest emergency flow works.
Rate limiting is active.
API Overview

The backend exposes REST APIs for the major CrisisConnect modules.

Representative endpoint groups include:

/auth/*
/incidents/*
/alerts/*
/shelters/*
/rescue-sites/*
/ai/*
/demo/*

FastAPI automatically provides interactive API documentation at:

/docs

when the backend is running.

Demo Scenario

A representative end-to-end demonstration can be performed using the following flow:

1. Open CrisisConnect as a guest.

2. Open the existing AI Assistant.

3. Say:
   "I'm trapped in Bangalore, water is rising."

4. The assistant identifies the emergency.

5. Confirm the SOS request.

6. CrisisConnect creates an incident and returns
   an SOS reference ID.

7. The assistant provides relevant shelter information.

8. The user can also ask:
   "Are there any active alerts?"

9. The assistant retrieves current alert information.

10. An authorized officer can then view the incident
    through the officer dashboard.

This demonstrates the complete path from:

Natural-language emergency → SOS → location intelligence → shelter/alert information → responder visibility

Future Scope

Potential future improvements include:

Real-time WebSocket-based incident updates
Automated responder dispatch integrations
SMS and telecom-based emergency communication
Expanded multilingual support
More advanced disaster prediction models
Automated flood and weather data ingestion
Satellite and drone imagery integration
Advanced route optimization for rescue teams
Real-time volunteer coordination
Push notifications
Improved offline synchronization
Advanced analytics and disaster heatmaps
Project Goals

CrisisConnect is built around four primary goals:

Accessibility

Emergency assistance should remain accessible even when users are not authenticated.

Speed

Critical information should be available with as few steps as possible.

Intelligence

Location, disaster, shelter, alert, and incident information should work together rather than existing as isolated features.

Safety

Emergency automation must include safeguards against accidental, duplicate, or abusive incident creation.

Contributors

Developed as part of Smart India Hackathon 2026.

The project follows a modular architecture with contributions across:

Frontend development
Backend and API development
Database and GIS
AI integration
Security
Real-time and emergency workflows
UI/UX
License

This project is developed for educational and hackathon purposes.

