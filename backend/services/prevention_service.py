import logging
import uuid
from typing import Dict, Any, Optional
from datetime import datetime

from backend.core.crypto import issue_decision_token, generate_pow_challenge, verify_pow_solution
from backend.database import db

logger = logging.getLogger("botpulse.services.prevention")

class PreventionService:
    """
    Prevention Service.
    Issues cryptographically signed decision tokens, manages Proof-of-Work hardware
    challenges, and audits server-side enforcement feedback.
    """

    def generate_prevention_decision(
        self,
        session_id: str,
        site_id: str,
        risk_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Creates an actionable prevention decision and signs an HMAC-SHA256 token
        verifiable by Elvara's server/enforcement_service.js.
        When VERIFY is triggered, attaches a Cryptographic Proof-of-Work challenge.
        """
        decision_action = risk_result.get("decision", "allow").upper()
        risk_score = risk_result.get("risk_score", 0.0)
        visitor_category = risk_result.get("visitor_category", "unknown")

        token = issue_decision_token(
            session_id=session_id,
            site_id=site_id,
            action=decision_action,
            risk_score=risk_score / 100.0, # normalized 0.0 to 1.0 for Elvara
            visitor_type=visitor_category
        )

        res = {
            "action": decision_action.lower(),
            "risk_score": risk_score,
            "risk_level": risk_result.get("risk_level", "low"),
            "visitor_category": visitor_category,
            "confidence": risk_result.get("confidence", 0.95),
            "decision_token": token,
            "status": "decision_issued",
            "issued_at": datetime.utcnow().isoformat()
        }

        # Attach Proof-of-Work challenge for VERIFY / suspicious AI sessions
        if decision_action == "VERIFY":
            difficulty = 3 if risk_score < 60 else 4
            pow_challenge = generate_pow_challenge(difficulty=difficulty)
            res["pow_challenge"] = pow_challenge
            logger.info("Issued Proof-of-Work challenge %s (difficulty=%d) to session %s",
                        pow_challenge["challenge_id"], difficulty, session_id)

        return res

    def verify_pow_submission(self, submission: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates a completed client-side Proof-of-Work hardware integrity submission.
        On success, issues an elevated ALLOW token and stores audit metrics.
        """
        challenge_id = submission.get("challenge_id", "")
        seed = submission.get("seed", "")
        difficulty = int(submission.get("difficulty", 3))
        expires_at = int(submission.get("expires_at", 0))
        signature = submission.get("signature", "")
        nonce = int(submission.get("nonce", -1))
        session_id = submission.get("session_id", "unknown_session")
        site_id = submission.get("site_id", "site_alvera_001")
        time_taken_ms = float(submission.get("time_taken_ms", 0.0))

        verification = verify_pow_solution(
            challenge_id=challenge_id,
            seed=seed,
            difficulty=difficulty,
            expires_at=expires_at,
            signature=signature,
            nonce=nonce
        )

        if not verification.get("valid"):
            logger.warning("PoW verification failed for session %s: %s", session_id, verification.get("reason"))
            return {
                "success": False,
                "verified": False,
                "error": f"Proof-of-Work verification failed: {verification.get('reason')}"
            }

        # Issue elevated decision token with ALLOW verdict
        elevated_token = issue_decision_token(
            session_id=session_id,
            site_id=site_id,
            action="ALLOW",
            risk_score=0.04,
            visitor_type="HUMAN_POW_VERIFIED"
        )

        # Record in database
        db.record_pow_event(
            session_id=session_id,
            challenge_id=challenge_id,
            difficulty=difficulty,
            nonce=nonce,
            time_taken_ms=time_taken_ms,
            status="verified"
        )

        logger.info("Session %s successfully solved PoW challenge in %.2fms (nonce=%d). Upgraded to ALLOW.",
                    session_id, time_taken_ms, nonce)

        return {
            "success": True,
            "verified": True,
            "message": "Cryptographic Proof-of-Work hardware verification succeeded.",
            "elevated_token": elevated_token,
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
