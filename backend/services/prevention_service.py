import logging
import threading
import time
import uuid
from typing import Dict, Any, Optional
from datetime import datetime

from backend.config import settings
from backend.core.crypto import (
    DEFAULT_POW_DIFFICULTY,
    issue_decision_token,
    generate_pow_challenge,
    validate_pow_difficulty,
    verify_pow_solution,
)
from backend.database import db

logger = logging.getLogger("botpulse.services.prevention")

POW_SESSION_GRACE_SECONDS = 300


class PreventionService:
    """
    Prevention Service.
    Issues cryptographically signed decision tokens, manages Proof-of-Work hardware
    challenges, and audits server-side enforcement feedback.
    """

    def __init__(self):
        self._pow_lock = threading.Lock()
        self._used_pow_challenges: Dict[str, int] = {}
        self._pow_verified_sessions: Dict[str, float] = {}

    def get_site_pow_difficulty(self, site_id: str) -> int:
        """
        Retrieves the validated PoW difficulty from the saved site security policy.
        Falls back to DEFAULT_POW_DIFFICULTY (3) when no custom policy is configured.
        """
        policy = db.get_policy(site_id)
        if not policy and site_id != settings.DEFAULT_SITE_ID:
            policy = db.get_policy(settings.DEFAULT_SITE_ID)
        if policy and policy.get("pow_difficulty") is not None:
            return validate_pow_difficulty(policy.get("pow_difficulty"), strict=False)
        return DEFAULT_POW_DIFFICULTY

    def resolve_canonical_site_id(self, raw_site_id: Optional[str], raw_site_key: Optional[str] = None) -> str:
        """
        Resolves a site_key or site_id to the canonical site_id expected by protected servers (e.g. site_alvera_001).
        """
        for candidate_key in (raw_site_key, raw_site_id):
            if candidate_key and isinstance(candidate_key, str):
                site_record = db.get_website_by_key(candidate_key)
                if site_record and site_record.get("site_id"):
                    return site_record["site_id"]
        if raw_site_id and isinstance(raw_site_id, str) and not raw_site_id.startswith("bp_pub_"):
            return raw_site_id
        return settings.DEFAULT_SITE_ID

    def is_session_pow_verified(self, session_id: str) -> bool:
        """Checks whether a session recently passed Proof-of-Work within the grace window."""
        if not session_id:
            return False
        now = time.time()
        with self._pow_lock:
            exp = self._pow_verified_sessions.get(session_id)
            if exp is None:
                return False
            if now > exp:
                self._pow_verified_sessions.pop(session_id, None)
                return False
            return True

    def _prune_caches_locked(self, now_ts: int) -> None:
        expired_challenges = [cid for cid, exp in self._used_pow_challenges.items() if exp < now_ts]
        for cid in expired_challenges:
            self._used_pow_challenges.pop(cid, None)

        expired_sessions = [sid for sid, exp in self._pow_verified_sessions.items() if exp < now_ts]
        for sid in expired_sessions:
            self._pow_verified_sessions.pop(sid, None)

    @staticmethod
    def is_ip_in_blocklist(client_ip: str, block_list: list) -> bool:
        """Checks whether a client IP falls within an exact IP or CIDR subnet in the blocklist."""
        if not client_ip or not block_list:
            return False
        import ipaddress
        try:
            cip = ipaddress.ip_address(client_ip.strip())
        except ValueError:
            return False

        for item in block_list:
            if not item:
                continue
            # Strip comments e.g. "45.154.255.89/32 (Known Headless Cluster)" -> "45.154.255.89/32"
            cleaned = str(item).split()[0].strip()
            try:
                if "/" in cleaned:
                    net = ipaddress.ip_network(cleaned, strict=False)
                    if cip in net:
                        return True
                else:
                    if cip == ipaddress.ip_address(cleaned):
                        return True
            except ValueError:
                if client_ip.strip() == cleaned:
                    return True
        return False

    def generate_prevention_decision(
        self,
        session_id: str,
        site_id: str,
        risk_result: Dict[str, Any],
        client_ip: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates an actionable prevention decision and signs an HMAC-SHA256 token
        verifiable by Elvara's server/enforcement_service.js.
        Evaluates active site policy: IP blocklists, custom risk thresholds,
        category overrides, and headless browser blocking.
        When VERIFY is triggered, attaches a Cryptographic Proof-of-Work challenge
        using the site's configured difficulty policy.
        """
        # Load active site regulation policy from database
        policy = db.get_policy(site_id)
        if not policy and site_id != settings.DEFAULT_SITE_ID:
            policy = db.get_policy(settings.DEFAULT_SITE_ID)
        policy = policy or {}

        decision_action = risk_result.get("decision", "allow").upper()
        risk_score = float(risk_result.get("risk_score", 0.0))
        visitor_category = risk_result.get("visitor_category", "unknown")
        reason_codes = risk_result.setdefault("reason_codes", [])

        # 1. Enforce Edge Subnet & IP Blocklist
        block_list = policy.get("block_list")
        if block_list is None:
            block_list = [
                "45.154.255.89/32 (Known Headless Cluster)",
                "91.240.118.0/24 (Credential Stuffing Proxy)",
            ]
        if client_ip and self.is_ip_in_blocklist(client_ip, block_list):
            logger.warning("Session %s IP %s is in blocklist -> Enforcing immediate BLOCK.", session_id, client_ip)
            decision_action = "BLOCK"
            risk_score = 100.0
            risk_result["risk_score"] = 100.0
            risk_result["risk_level"] = "critical"
            risk_result["decision"] = "block"
            if not any("IP_IN_BLOCKLIST" in r for r in reason_codes):
                reason_codes.append(f"IP_IN_BLOCKLIST: {client_ip}")

        # 2. Enforce Headless Browser Policy
        elif policy.get("block_headless_browsers", True) and any("HEADLESS" in r for r in reason_codes):
            logger.info("Session %s exhibits headless browser signature -> Enforcing BLOCK per policy.", session_id)
            decision_action = "BLOCK"
            risk_score = max(risk_score, 85.0)
            risk_result["risk_score"] = risk_score
            risk_result["risk_level"] = "critical"
            risk_result["decision"] = "block"

        # 3. Enforce Configurable Risk Thresholds and Category Overrides
        else:
            block_thresh = policy.get("block_threshold", 80)
            verify_thresh = policy.get("verify_threshold", 60)

            if visitor_category == "ai_agent":
                custom_action = policy.get("ai_agent_action")
                if custom_action:
                    decision_action = custom_action.upper()
            elif visitor_category in ("traditional_bot", "advanced_bot"):
                custom_action = policy.get("traditional_bot_action")
                if custom_action:
                    decision_action = custom_action.upper()
            elif risk_score >= block_thresh:
                high_action = policy.get("high_risk_action", "block")
                decision_action = high_action.upper()
            elif risk_score >= verify_thresh:
                decision_action = "VERIFY"
            elif visitor_category == "human" and risk_score < verify_thresh:
                decision_action = "ALLOW"

        # If a VERIFY session already completed PoW recently, allow continued browsing
        # without falsely relabeling the visitor as human or overriding BLOCK/RATE_LIMIT.
        pow_already_verified = decision_action == "VERIFY" and self.is_session_pow_verified(session_id)
        effective_action = "ALLOW" if pow_already_verified else decision_action

        token = issue_decision_token(
            session_id=session_id,
            site_id=site_id,
            action=effective_action,
            risk_score=risk_score / 100.0,  # normalized 0.0 to 1.0 for Elvara
            visitor_type=visitor_category,
            pow_verified=pow_already_verified
        )

        res = {
            "action": effective_action.lower(),
            "risk_score": risk_score,
            "risk_level": risk_result.get("risk_level", "low"),
            "visitor_category": visitor_category,
            "confidence": risk_result.get("confidence", 0.95),
            "decision_token": token,
            "status": "decision_issued",
            "issued_at": datetime.utcnow().isoformat()
        }

        # Attach Proof-of-Work challenge for VERIFY / suspicious sessions
        if effective_action == "VERIFY":
            difficulty = self.get_site_pow_difficulty(site_id)
            pow_challenge = generate_pow_challenge(
                difficulty=difficulty,
                session_id=session_id,
                site_id=site_id
            )
            res["pow_challenge"] = pow_challenge
            logger.info(
                "Issued Proof-of-Work challenge %s (difficulty=%d) to session %s",
                pow_challenge["challenge_id"], difficulty, session_id
            )

        return res

    def verify_pow_submission(self, submission: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates a completed client-side Proof-of-Work hardware integrity submission.
        Enforces signature, expiry, difficulty bounds, session binding, and replay protection.
        On success, issues an elevated ALLOW token using server-side risk state (never trusting
        client-provided risk scores and never automatically treating PoW completion as proof of humanity).
        """
        challenge_id = submission.get("challenge_id", "")
        seed = submission.get("seed", "")
        signature = submission.get("signature", "")
        session_id = str(submission.get("session_id") or "unknown_session")
        bound_session_id = submission.get("bound_session_id")
        raw_site_id = submission.get("site_id")
        raw_site_key = submission.get("site_key")

        try:
            difficulty = int(submission.get("difficulty")) if not isinstance(submission.get("difficulty"), bool) else -1
            expires_at = int(submission.get("expires_at")) if not isinstance(submission.get("expires_at"), bool) else -1
            nonce = int(submission.get("nonce")) if not isinstance(submission.get("nonce"), bool) else -1
            time_taken_ms = max(0.0, float(submission.get("time_taken_ms", 0.0)))
        except (TypeError, ValueError):
            return {
                "success": False,
                "verified": False,
                "reason": "MALFORMED_SUBMISSION",
                "error": "Proof-of-Work submission contains invalid numeric fields."
            }

        canonical_site_id = self.resolve_canonical_site_id(raw_site_id, raw_site_key)
        bound_site_id = raw_site_id if bound_session_id and raw_site_id else (canonical_site_id if bound_session_id else None)

        verification = verify_pow_solution(
            challenge_id=challenge_id,
            seed=seed,
            difficulty=difficulty,
            expires_at=expires_at,
            signature=signature,
            nonce=nonce,
            bound_session_id=bound_session_id,
            submitted_session_id=session_id,
            bound_site_id=bound_site_id
        )

        if not verification.get("valid"):
            reason = verification.get("reason", "VERIFICATION_FAILED")
            logger.warning("PoW verification failed for session %s: %s", session_id, reason)
            return {
                "success": False,
                "verified": False,
                "reason": reason,
                "error": f"Proof-of-Work verification failed: {reason}"
            }

        now_ts = int(time.time())
        with self._pow_lock:
            self._prune_caches_locked(now_ts)

            # Replay protection: reject any challenge_id already consumed in memory or DB
            if challenge_id in self._used_pow_challenges or db.is_pow_challenge_used(challenge_id):
                logger.warning("PoW replay attempt blocked for challenge %s (session %s)", challenge_id, session_id)
                return {
                    "success": False,
                    "verified": False,
                    "reason": "CHALLENGE_ALREADY_USED",
                    "error": "Proof-of-Work challenge has already been redeemed."
                }

            # Look up authoritative server-side session state; never trust client-supplied risk scores
            existing_session = db.get_session_by_id(session_id)
            if existing_session and str(existing_session.get("enforcement", "")).lower() == "block":
                logger.warning("Blocked session %s attempted to bypass BLOCK via PoW", session_id)
                return {
                    "success": False,
                    "verified": False,
                    "reason": "SESSION_BLOCKED",
                    "error": "Blocked sessions cannot be upgraded via Proof-of-Work."
                }

            if existing_session:
                existing_category = str(existing_session.get("category") or "unknown").upper()
                existing_risk_pct = float(existing_session.get("risk_score") or 40.0)
                # Moderately reduce risk to reflect completed computational cost without claiming human certainty
                elevated_risk_pct = round(max(15.0, min(existing_risk_pct, existing_risk_pct * 0.6)), 1)
                elevated_visitor_type = existing_category if existing_category == "HUMAN" else f"{existing_category}_POW_VERIFIED"
            else:
                elevated_risk_pct = 20.0
                elevated_visitor_type = "POW_VERIFIED"

            # Mark challenge consumed atomically before releasing lock
            self._used_pow_challenges[challenge_id] = expires_at
            if session_id and session_id != "dashboard_benchmark_user":
                self._pow_verified_sessions[session_id] = time.time() + POW_SESSION_GRACE_SECONDS

        # Issue elevated decision token with ALLOW verdict and server-computed risk score
        elevated_token = issue_decision_token(
            session_id=session_id,
            site_id=canonical_site_id,
            action="ALLOW",
            risk_score=elevated_risk_pct / 100.0,
            visitor_type=elevated_visitor_type,
            pow_verified=True
        )

        # Record in database (also persists replay history across restarts)
        db.record_pow_event(
            session_id=session_id,
            challenge_id=challenge_id,
            difficulty=verification["difficulty"],
            nonce=nonce,
            time_taken_ms=time_taken_ms,
            status="verified"
        )

        logger.info(
            "Session %s successfully solved PoW challenge %s in %.2fms (difficulty=%d, nonce=%d). Upgraded to ALLOW (pow_verified=True).",
            session_id, challenge_id, time_taken_ms, verification["difficulty"], nonce
        )

        return {
            "success": True,
            "verified": True,
            "pow_verified": True,
            "message": "Cryptographic Proof-of-Work hardware verification succeeded.",
            "elevated_token": elevated_token,
            "risk_score": elevated_risk_pct,
            "visitor_type": elevated_visitor_type,
            "time_taken_ms": time_taken_ms,
            "new_action": "allow"
        }

    def process_enforcement_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Records verification feedback from protected server integration.
        Distinguishes: Decision Issued -> Enforcement Attempted -> Enforcement Successfully Applied.
        """
        record = {
            "id": f"fb_{uuid.uuid4().hex[:12]}",
            "decision_id": feedback_data.get("decision_id"),
            "site_id": feedback_data.get("site_id"),
            "session_id": feedback_data.get("session_id"),
            "action": feedback_data.get("action"),
            "endpoint": feedback_data.get("endpoint"),
            "result": feedback_data.get("enforcement_result", "applied"),
            "http_status": feedback_data.get("http_status_code", 200),
            "received_at": datetime.utcnow().isoformat(),
            "details": feedback_data.get("details", {})
        }

        db.record_enforcement_feedback(record)
        logger.info(
            "Enforcement feedback recorded for site %s on %s: %s (Status: %s)",
            record["site_id"], record["endpoint"], record["action"], record["result"]
        )

        return {"status": "enforcement_recorded", "record_id": record["id"]}

prevention_service = PreventionService()
