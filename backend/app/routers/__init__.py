# backend/app/routers package
from . import auth, incidents, resources, dispatch, zones, risk, sites, shelters, alerts, demo, users, ai

__all__ = [
    "auth",
    "incidents",
    "resources",
    "dispatch",
    "zones",
    "risk",
    "sites",
    "shelters",
    "alerts",
    "demo",
    "users",
    "ai",
]
