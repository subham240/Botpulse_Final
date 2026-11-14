import hmac
import hashlib
import base64
import json
import time
import uuid
from typing import Dict, Any, Optional

from backend.config import settings

def _base64url_encode(data: bytes) -> str:
    """Encodes bytes to unpadded base64url string."""
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def issue_decision_token(
    session_id: str,
    site_id: str,
    action: str,
    risk_score: float,
    visitor_type: str,
    permitted_scope: Optional[list] = None
) -> str:
    """
    Issues an HMAC-SHA256 cryptographically signed Decision Token
    fully compatible with Elvara's server/enforcement_service.js.
    
    Structure: <headerB64>.<payloadB64>.<sigB64>
    """
    if permitted_scope is None:
        permitted_scope = ["checkout", "cart", "search", "auth"]

    header = {
        "alg": "HS256",
        "typ": "JWT"
    }

    now = int(time.time())
    decision_id = f"dec_{uuid.uuid4().hex[:12]}_{now}"

    # Normalize risk level
    risk_pct = risk_score * 100.0 if risk_score <= 1.0 else risk_score
    if risk_pct > 80:
        risk_level = "CRITICAL"
    elif risk_pct > 60:
        risk_level = "HIGH"
    elif risk_pct > 30:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    payload = {
        "sub": session_id,
        "site_id": site_id,
        "action": action.upper(),  # "ALLOW", "VERIFY", "RATE_LIMIT", "BLOCK"
        "risk_score": round(risk_score, 4),
        "risk_level": risk_level,
        "visitor_type": visitor_type.upper(),
        "decision_id": decision_id,
        "iat": now,
        "exp": now + settings.DECISION_TOKEN_EXPIRE_SECONDS,
        "permitted_scope": permitted_scope
    }

    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    data_to_sign = f"{header_b64}.{payload_b64}".encode('utf-8')

    signature = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        data_to_sign,
        hashlib.sha256
    ).digest()

    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def generate_pow_challenge(difficulty: int = 3, expires_in_seconds: int = 90) -> Dict[str, Any]:
    """
    Generates a client-side Proof-of-Work cryptographic challenge.
    Requires client browser to find a nonce such that SHA-256(seed:nonce) begins with `difficulty` zeros.
    """
    challenge_id = f"pow_{uuid.uuid4().hex[:12]}"
    seed = uuid.uuid4().hex
    now = int(time.time())
    expires_at = now + expires_in_seconds

    # Sign challenge parameters to prevent difficulty or seed tampering
    sign_payload = f"{challenge_id}:{seed}:{difficulty}:{expires_at}".encode('utf-8')
    sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), sign_payload, hashlib.sha256).hexdigest()

    return {
        "challenge_id": challenge_id,
        "seed": seed,
        "difficulty": difficulty,
        "expires_at": expires_at,
        "signature": sig
    }


def verify_pow_solution(
    challenge_id: str,
    seed: str,
    difficulty: int,
    expires_at: int,
    signature: str,
    nonce: int
) -> Dict[str, Any]:
    """
    Cryptographically verifies a client's submitted Proof-of-Work solution.
    """
    # 1. Check expiration
    if int(time.time()) > expires_at:
        return {"valid": False, "reason": "CHALLENGE_EXPIRED"}

    # 2. Check signature integrity
    expected_payload = f"{challenge_id}:{seed}:{difficulty}:{expires_at}".encode('utf-8')
    expected_sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), expected_payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_sig, signature):
        return {"valid": False, "reason": "INVALID_SIGNATURE"}

    # 3. Check hash solution
    hash_input = f"{seed}:{nonce}".encode('utf-8')
    computed_hash = hashlib.sha256(hash_input).hexdigest()
    target_prefix = "0" * difficulty

    if not computed_hash.startswith(target_prefix):
        return {"valid": False, "reason": "INCORRECT_HASH"}

    return {
        "valid": True,
        "computed_hash": computed_hash,
        "difficulty": difficulty
    }

