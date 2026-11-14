from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any

from backend.database import db
from backend.ml.model_registry import model_registry
from backend.schemas.dashboard import DashboardStats, DashboardLayersOverview
from backend.config import settings

router = APIRouter(prefix="/dashboard", tags=["SOC Dashboard Analytics"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_statistics(
    site_key: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    range: Optional[str] = Query("24h")
):
    """
    Returns aggregated metrics strictly from database records.
    Guarantees true Zero-State (0 requests, 0 bots) when no traffic has arrived.
    """
    key = site_key or domain
    return db.get_dashboard_stats(key, time_range=range)

@router.get("/live")
def get_live_telemetry_stream(site_key: Optional[str] = Query(None), limit: int = 50):
    """Returns recent real telemetry events received from client SDK."""
    return db.get_recent_events(site_key, limit)

@router.get("/sessions")
def get_visitor_sessions(site_key: Optional[str] = Query(None), limit: int = 50):
    """Returns visitor sessions including mouse trajectories and multi-model scores."""
    return db.get_sessions_list(site_key, limit)

@router.get("/threats")
def get_threat_incidents(site_key: Optional[str] = Query(None), limit: int = 50):
    """Returns malicious bot incidents and anomalies."""
    return db.get_threats_list(site_key, limit)

@router.patch("/threats/{threat_id}")
def update_threat_incident(threat_id: str, payload: dict):
    """Updates a threat incident status (e.g. investigating, confirmed, resolved, false_positive)."""
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="status is required")
    success = db.update_threat_status(threat_id, new_status)
    return {"success": success, "threat_id": threat_id, "status": new_status}

@router.get("/layers", response_model=DashboardLayersOverview)
def get_layer_monitoring():
    """Returns operational status for each of the 3 detection layers separately."""
    health = model_registry.get_health_overview()
    return health

@router.get("/model-health")
def get_model_health():
    """Health check for ML inference pipelines."""
    return {
        "status": "healthy",
        "layers": model_registry.get_health_overview()
    }

@router.get("/agents")
def get_ai_agent_activity():
    """Returns detected autonomous AI agents."""
    sessions = db.get_sessions_list(limit=100)
    agents = [s for s in sessions if s.get("category") == "ai_agent"]
    return {
        "total_ai_agents": len(agents),
        "agents": agents
    }

@router.get("/prevention")
def get_prevention_summary(site_key: Optional[str] = Query(None)):
    """Returns statistics of allowed, verified, rate limited, and blocked requests."""
    stats = db.get_dashboard_stats(site_key)
    return {
        "total_decisions": stats["total_sessions"],
        "blocked": stats["prevention_actions"],
        "allowed": stats["human_count"],
        "rate_limited": stats["traditional_bot_count"],
        "mitigation_rate": stats["mitigation_rate"]
    }

@router.get("/integrations")
def get_integrations_status():
    """Returns status of external integrated sites (e.g. ÉLVARA Fashion)."""
    return {
        "testing_site": {
            "name": settings.DEFAULT_SITE_NAME,
            "domain": settings.DEFAULT_SITE_DOMAIN,
            "site_key": settings.DEFAULT_SITE_KEY,
            "site_id": settings.DEFAULT_SITE_ID,
            "github_repo": "https://github.com/subham240/elvara-fashion",
            "live_deployment": "https://elvara-fashion.vercel.app/",
            "sdk_installed": True,
            "sdk_url": "http://localhost:8000/botpulse.js",
            "enforcement_layer": "Ed25519 & HS256 Verified Tokens"
        }
    }
