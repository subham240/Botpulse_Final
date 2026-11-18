import hmac
import hashlib
import base64
import json
import time
import uuid
from typing import Dict, Any, Optional

from backend.config import settings

MIN_POW_DIFFICULTY = 2
MAX_POW_DIFFICULTY = 5
DEFAULT_POW_DIFFICULTY = 3


def validate_pow_difficulty(difficulty: Any, strict: bool = False) -> int:
    """
    Validates PoW difficulty within safe server-enforced bounds [MIN_POW_DIFFICULTY, MAX_POW_DIFFICULTY].
    """
    try:
        if isinstance(difficulty, bool):
            raise ValueError("Difficulty cannot be boolean")
        val = int(difficulty)
    except (TypeError, ValueError):
        if strict:
            raise ValueError(f"Invalid PoW difficulty: must be an integer between {MIN_POW_DIFFICULTY} and {MAX_POW_DIFFICULTY}")
        return DEFAULT_POW_DIFFICULTY

    if val < MIN_POW_DIFFICULTY or val > MAX_POW_DIFFICULTY:
        if strict:
            raise ValueError(f"Invalid PoW difficulty {val}: must be between {MIN_POW_DIFFICULTY} and {MAX_POW_DIFFICULTY}")
        return max(MIN_POW_DIFFICULTY, min(MAX_POW_DIFFICULTY, val))
    return val


def _base64url_encode(data: bytes) -> str:
    """Encodes bytes to unpadded base64url string."""
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def issue_decision_token(
    session_id: str,
    site_id: str,
    action: str,
    risk_score: float,
    visitor_type: str,
    permitted_scope: Optional[list] = None,
    pow_verified: bool = False
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
    if pow_verified:
        payload["pow_verified"] = True

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


def generate_pow_challenge(
    difficulty: int = DEFAULT_POW_DIFFICULTY,
    expires_in_seconds: int = 90,
    session_id: Optional[str] = None,
    site_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a client-side Proof-of-Work cryptographic challenge.
    Requires client browser to find a nonce such that SHA-256(seed:nonce) begins with `difficulty` zeros.
    When `session_id` is supplied, the challenge HMAC binds to that session and site.
    """
    validated_difficulty = validate_pow_difficulty(difficulty, strict=False)
    ttl = max(15, min(300, int(expires_in_seconds)))
    challenge_id = f"pow_{uuid.uuid4().hex[:12]}"
    seed = uuid.uuid4().hex
    now = int(time.time())
    expires_at = now + ttl

    # Sign challenge parameters to prevent difficulty, seed, expiry, or session tampering
    if session_id:
        bound_site = site_id or ""
        sign_payload = f"{challenge_id}:{seed}:{validated_difficulty}:{expires_at}:{session_id}:{bound_site}".encode('utf-8')
    else:
        sign_payload = f"{challenge_id}:{seed}:{validated_difficulty}:{expires_at}".encode('utf-8')
    sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), sign_payload, hashlib.sha256).hexdigest()

    challenge = {
        "challenge_id": challenge_id,
        "seed": seed,
        "difficulty": validated_difficulty,
        "expires_at": expires_at,
        "signature": sig
    }
    if session_id:
        challenge["bound_session_id"] = session_id
        if site_id:
            challenge["site_id"] = site_id

    return challenge


def verify_pow_solution(
    challenge_id: str,
    seed: str,
    difficulty: int,
    expires_at: int,
    signature: str,
    nonce: int,
    bound_session_id: Optional[str] = None,
    submitted_session_id: Optional[str] = None,
    bound_site_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Cryptographically verifies a client's submitted Proof-of-Work solution.
    Validates bounds, expiration, optional session binding, HMAC signature (constant-time), and SHA-256 hash.
    """
    # 0. Structural & server-side parameter validation
    if not isinstance(challenge_id, str) or not challenge_id.strip():
        return {"valid": False, "reason": "INVALID_CHALLENGE_ID"}
    if not isinstance(seed, str) or not seed.strip():
        return {"valid": False, "reason": "INVALID_SEED"}
    if not isinstance(signature, str) or not signature.strip():
        return {"valid": False, "reason": "INVALID_SIGNATURE"}

    try:
        validated_difficulty = validate_pow_difficulty(difficulty, strict=True)
    except ValueError:
        return {"valid": False, "reason": "INVALID_DIFFICULTY"}

    if isinstance(nonce, bool) or not isinstance(nonce, int) or nonce < 0:
        return {"valid": False, "reason": "INVALID_NONCE"}

    if isinstance(expires_at, bool) or not isinstance(expires_at, int) or expires_at <= 0:
        return {"valid": False, "reason": "INVALID_EXPIRY"}

    # 1. Check expiration
    if int(time.time()) > expires_at:
        return {"valid": False, "reason": "CHALLENGE_EXPIRED"}

    # 2. Check session binding if present
    if bound_session_id:
        if not submitted_session_id or not hmac.compare_digest(str(bound_session_id), str(submitted_session_id)):
            return {"valid": False, "reason": "SESSION_MISMATCH"}
        site_part = bound_site_id or ""
        expected_payload = f"{challenge_id}:{seed}:{validated_difficulty}:{expires_at}:{bound_session_id}:{site_part}".encode('utf-8')
    else:
        expected_payload = f"{challenge_id}:{seed}:{validated_difficulty}:{expires_at}".encode('utf-8')

    # 3. Check signature integrity (constant-time comparison)
    expected_sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), expected_payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_sig, signature):
        return {"valid": False, "reason": "INVALID_SIGNATURE"}

    # 4. Check hash solution
    hash_input = f"{seed}:{nonce}".encode('utf-8')
    computed_hash = hashlib.sha256(hash_input).hexdigest()
    target_prefix = "0" * validated_difficulty

    if not computed_hash.startswith(target_prefix):
        return {"valid": False, "reason": "INCORRECT_HASH"}

    return {
        "valid": True,
        "computed_hash": computed_hash,
        "difficulty": validated_difficulty
    }

