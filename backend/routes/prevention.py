from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any, Optional
from backend.config import settings
from backend.schemas.prevention import EnforcementFeedbackPayload, PreventionPolicy
from backend.services.prevention_service import prevention_service
from backend.services.resemble_client import resemble_client
from backend.core.crypto import generate_pow_challenge, validate_pow_difficulty
from backend.database import db

router = APIRouter(tags=["Prevention & Enforcement"])

@router.post("/enforce/feedback")
@router.post("/risk/enforcement-feedback")
async def receive_enforcement_feedback(payload: EnforcementFeedbackPayload):
    """
    Receives server-to-server confirmation when a decision token is verified and enforced
    by the protected application (e.g., Elvara checkout, cart, or search).
    """
    result = prevention_service.process_enforcement_feedback(payload.dict())
    return result

@router.get("/prevention/policies")
def get_prevention_policies(site_id: str = "site_elvara_001"):
    policy = db.get_policy(site_id)
    if not policy and site_id in ("site_elvara_001", "site_alvera_001"):
        alt_id = "site_alvera_001" if site_id == "site_elvara_001" else "site_elvara_001"
        policy = db.get_policy(alt_id)
    if not policy:
        default_policy = PreventionPolicy(site_id=site_id)
        return default_policy.dict()
    defaults = PreventionPolicy(site_id=site_id).dict()
    for k, v in defaults.items():
        if k not in policy or policy[k] is None:
            policy[k] = v
    return policy

@router.put("/prevention/policies")
@router.post("/prevention/policies")
def update_prevention_policies(payload: Dict[str, Any] = Body(...)):
    site_id = payload.get("site_id", "site_elvara_001")
    if "pow_difficulty" in payload and payload["pow_difficulty"] is not None:
        try:
            payload["pow_difficulty"] = validate_pow_difficulty(payload["pow_difficulty"], strict=True)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    updated = db.save_policy(site_id, payload)
    
    # Keep aliases synchronized
    alias_id = "site_alvera_001" if site_id == "site_elvara_001" else ("site_elvara_001" if site_id == "site_alvera_001" else None)
    if alias_id:
        alias_payload = dict(payload)
        alias_payload["site_id"] = alias_id
        db.save_policy(alias_id, alias_payload)

    return {
        "status": "success",
        "message": f"Bot regulation policies synchronized to edge for {site_id}",
        "policy": updated
    }

@router.post("/prevention/pow/challenge")
def request_pow_challenge(difficulty: Optional[int] = None, site_id: str = "site_elvara_001"):
    """
    Issues an HMAC-signed Cryptographic Proof-of-Work challenge to client browser.
    Uses saved site policy difficulty unless a valid difficulty (2-5) is explicitly specified.
    """
    if difficulty is None or difficulty <= 0:
        validated_difficulty = prevention_service.get_site_pow_difficulty(site_id)
    else:
        try:
            validated_difficulty = validate_pow_difficulty(difficulty, strict=True)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    return generate_pow_challenge(difficulty=validated_difficulty)

@router.post("/prevention/pow/verify")
def verify_pow_challenge(payload: Dict[str, Any] = Body(...)):
    """
    Verifies client's Proof-of-Work solution (finding the nonce satisfying SHA-256 zeros).
    On success, upgrades session decision to ALLOW with an elevated cryptographic token.
    """
    return prevention_service.verify_pow_submission(payload)

@router.get("/prevention/pow/stats")
def get_pow_statistics(site_id: str = "site_elvara_001"):
    """
    Returns aggregated metrics on Proof-of-Work challenges solved by verified devices.
    """
    stats = db.get_pow_stats(site_id=site_id)
    if (not stats or stats.get("total_solved", 0) == 0) and site_id in ("site_elvara_001", "site_alvera_001"):
        alt_id = "site_alvera_001" if site_id == "site_elvara_001" else "site_elvara_001"
        alt_stats = db.get_pow_stats(site_id=alt_id)
        if alt_stats and alt_stats.get("total_solved", 0) > 0:
            return alt_stats
    return stats
    """
    Returns aggregated metrics on Proof-of-Work challenges solved by verified devices.
    """
    return db.get_pow_stats(site_id=site_id)

@router.get("/resemble/status")
def get_resemble_status():
    """Checks server-side Resemble.AI RAD-S1 API connectivity."""
    return {
        "resemble_status": resemble_client.check_status(),
        "site_id": settings.RESEMBLE_SITE_ID,
        "configured": resemble_client.is_configured
    }

@router.get("/resemble/session/{resemble_sid}")
def lookup_resemble_session(resemble_sid: str):
    """Server-side lookup of a Resemble.AI session verdict (keeps API token secret)."""
    if not resemble_client.is_configured:
        raise HTTPException(status_code=503, detail="RESEMBLE_API_TOKEN is not configured on backend.")
    item = resemble_client.fetch_session(resemble_sid)
    if not item:
        raise HTTPException(status_code=404, detail="Session not found in Resemble.AI.")
    return {
        "session_id": resemble_sid,
        "settled": item.get("settled"),
        "visitor_class": item.get("visitor_class"),
        "p_person": item.get("p_person"),
        "action": item.get("action"),
        "duration_s": item.get("duration_s"),
        "settled_at": item.get("settled_at"),
        "raw": item
    }

@router.post("/resemble/sync")
def sync_resemble_sessions():
    """Syncs recent settled Human / AI Agent sessions from Resemble.AI API into BotPulse."""
    if not resemble_client.is_configured:
        raise HTTPException(status_code=503, detail="RESEMBLE_API_TOKEN is not configured on backend.")
    items = resemble_client.fetch_recent_sessions(limit=50)
    synced = 0
    for item in items:
        sid = item.get("sid")
        settled = str(item.get("settled") or "").strip().lower()
        if not sid or settled not in ("human", "agent"):
            continue
        is_agent = settled == "agent"
        db.save_session({
            "session_id": f"resemble_{sid}",
            "site_key": settings.DEFAULT_SITE_KEY,
            "visitor_id": f"res_{sid[:8]}",
            "ip": "Resemble-Edge",
            "user_agent": item.get("visitor_class") or "Resemble.AI Verified Session",
            "category": "ai_agent" if is_agent else "human",
            "risk_score": 42.0 if is_agent else 5.0,
            "risk_level": "moderate" if is_agent else "low",
            "enforcement": "verify" if is_agent else "allow",
            "event_count": 1,
            "reasons": [
                "RESEMBLE_SERVER_VERIFIED",
                "RESEMBLE_AI_AGENT_VERDICT" if is_agent else "RESEMBLE_AI_HUMAN_VERDICT"
            ],
            "metrics": {"p_person": item.get("p_person"), "duration_s": item.get("duration_s")}
        })
        synced += 1
    return {"success": True, "fetched": len(items), "synced": synced}
