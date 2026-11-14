from fastapi import APIRouter, Body
from typing import Dict, Any
from backend.schemas.prevention import EnforcementFeedbackPayload, PreventionPolicy
from backend.services.prevention_service import prevention_service
from backend.core.crypto import generate_pow_challenge
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
def get_prevention_policies(site_id: str = "site_alvera_001"):
    return {
        "site_id": site_id,
        "high_risk_action": "block",
        "ai_agent_action": "verify",
        "traditional_bot_action": "block",
        "rate_limit_rpm": 60,
        "enforcement_layers": ["Ed25519 Token Verification", "HS256 Fallback", "Cryptographic Proof-of-Work (PoW)"]
    }

@router.post("/prevention/pow/challenge")
def request_pow_challenge(difficulty: int = 3):
    """
    Issues an HMAC-signed Cryptographic Proof-of-Work challenge to client browser.
    """
    return generate_pow_challenge(difficulty=difficulty)

@router.post("/prevention/pow/verify")
def verify_pow_challenge(payload: Dict[str, Any] = Body(...)):
    """
    Verifies client's Proof-of-Work solution (finding the nonce satisfying SHA-256 zeros).
    On success, upgrades session decision to ALLOW with an elevated cryptographic token.
    """
    return prevention_service.verify_pow_submission(payload)

@router.get("/prevention/pow/stats")
def get_pow_statistics():
    """
    Returns aggregated metrics on Proof-of-Work challenges solved by verified devices.
    """
    return db.get_pow_stats()
