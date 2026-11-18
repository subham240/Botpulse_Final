import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("botpulse.services.risk")

class RiskEngine:
    """
    Unified Risk Engine.
    Synthesizes outputs across Layer 1 (XGBoost), Layer 2 (LSTM), and Layer 3 (RAD-S1).
    Calculates explainable risk scores, visitor classifications, and enforcement recommendations.
    """

    def evaluate(self, orchestrated_data: Dict[str, Any]) -> Dict[str, Any]:
        l1 = orchestrated_data.get("layer_1_xgboost") or {}
        l2 = orchestrated_data.get("layer_2_lstm") or {}
        l3 = orchestrated_data.get("layer_3_rad_s1") or {}

        reasons: List[str] = []
        raw_risk = 0.0
        visitor_category = "unknown"
        confidence = None

        # ----------------------------------------------------------------------
        # 1. Resemble.AI & Layer 3 (RAD-S1): AI Agent Detection
        # ----------------------------------------------------------------------
        resemble_verdict = l3.get("resemble_verdict")
        resemble_human_verified = bool(l3.get("resemble_human_verified"))

        if l3.get("agent_detected"):
            visitor_category = "ai_agent"
            confidence = l3.get("confidence") or 0.96
            # Authenticated AI agents (e.g. Gemini with API key) are recognized as legitimate AI agents
            if "VALID_GEMINI_API_KEY" in l3.get("reason_codes", []):
                raw_risk = 18.0
            elif "RESEMBLE_AI_AGENT_VERDICT" in l3.get("reason_codes", []):
                raw_risk = 42.0
            elif "DECLARED_AI_SIGNATURE" in l3.get("reason_codes", []):
                raw_risk = 26.0
            else:
                raw_risk = 35.0
            reasons.extend(l3.get("reason_codes", []))
            reasons.append(f"AI_AGENT_DETECTED: {l3.get('agent_family') or 'Autonomous Web Agent'}")

        # ----------------------------------------------------------------------
        # 2. Existing ML Layer 2 (Bi-LSTM): Advanced Bot Detection
        # ----------------------------------------------------------------------
        elif l2.get("status") == "completed" and l2.get("advanced_bot_score") is not None and l2.get("advanced_bot_score") >= 0.65:
            visitor_category = "advanced_bot"
            adv_score = l2.get("advanced_bot_score", 0.7)
            raw_risk = 70.0 + (adv_score * 25.0)  # 70 - 95
            confidence = l2.get("confidence") or 0.90
            reasons.extend(l2.get("reason_codes", []))
            reasons.append("ADVANCED_BOT_SEQUENTIAL_ANOMALY")

        # ----------------------------------------------------------------------
        # 3. Existing ML Layer 1 (XGBoost) for Bot Detection + Resemble.AI for Human Detection
        # ----------------------------------------------------------------------
        elif l1.get("status") == "completed":
            l1_reasons = l1.get("reason_codes", [])
            has_strong_headless_bot_sig = (
                "HEADLESS_AUTOMATION_SIGNATURE" in l1_reasons
                or float(l1.get("prob_bot") or 0.0) >= 0.85
            )
            extracted = orchestrated_data.get("extracted_features") or {}
            num_requests = float(extracted.get("NUMBER_OF_REQUESTS") or 0.0)
            has_explicit_automation_signal = any(
                code in l1_reasons
                for code in (
                    "HEADLESS_AUTOMATION_SIGNATURE",
                    "HIGH_FREQUENCY_BURST",
                    "UNNATURAL_FIXED_CADENCE",
                    "ZERO_CURVATURE_TRAJECTORY",
                )
            )

            if l1.get("predicted_class") == "automated_bot":
                # If Layer 2 LSTM completed and verified natural human trajectory kinematics, override tabular false positive
                l2_bot_score = l2.get("advanced_bot_score")
                if l2.get("status") == "completed" and l2_bot_score is not None and l2_bot_score < 0.25:
                    visitor_category = "human"
                    confidence = l2.get("confidence") or 0.95
                    raw_risk = 8.0
                    reasons.append("LSTM_VERIFIED_HUMAN_KINEMATICS")
                    if resemble_human_verified:
                        reasons.append("RESEMBLE_AI_HUMAN_VERDICT")
                elif resemble_human_verified and not has_strong_headless_bot_sig:
                    # Resemble.AI explicitly verified human interaction and ML found no strong headless/script bot signal
                    visitor_category = "human"
                    confidence = l3.get("confidence") or 0.97
                    raw_risk = 6.0
                    reasons.extend(l3.get("reason_codes", []))
                elif num_requests <= 3 and not has_explicit_automation_signal and l2.get("status") != "completed":
                    # Avoid prematurely flagging cold-start normal browser page_view sessions (before mouse kinematics arrive) as bots
                    visitor_category = "human"
                    confidence = 0.78
                    raw_risk = 12.0
                    reasons.append("PROVISIONAL_BROWSER_SESSION")
                else:
                    visitor_category = "traditional_bot"
                    prob_bot = l1.get("prob_bot", 0.8)
                    raw_risk = 60.0 + (prob_bot * 25.0)  # 60 - 85
                    confidence = l1.get("confidence") or 0.88
                    reasons.extend(l1_reasons)
                    reasons.append("TRADITIONAL_AUTOMATION_SIGNATURE")
            else:
                if resemble_verdict == "review":
                    # Resemble.AI marked session undetermined -> step-up PoW verification
                    visitor_category = "unknown"
                    confidence = 0.70
                    raw_risk = 38.0
                    reasons.extend(l3.get("reason_codes", []))
                elif resemble_human_verified:
                    visitor_category = "human"
                    confidence = l3.get("confidence") or 0.97
                    raw_risk = 5.0
                    reasons.extend(l3.get("reason_codes", []))
                else:
                    visitor_category = "human"
                    prob_human = l1.get("prob_human", 0.9)
                    raw_risk = max(2.0, (1.0 - prob_human) * 20.0)  # 2 - 15
                    confidence = prob_human
                    reasons.append("VERIFIED_NATURAL_HUMAN_KINEMATICS")

        elif resemble_human_verified:
            visitor_category = "human"
            confidence = l3.get("confidence") or 0.97
            raw_risk = 6.0
            reasons.extend(l3.get("reason_codes", []))

        else:
            visitor_category = "unknown"
            raw_risk = 50.0
            reasons.append("INSUFFICIENT_MODEL_EVIDENCE")

        # Normalize score between 0 and 100
        risk_score = round(min(100.0, max(0.0, raw_risk)), 1)

        # Determine Risk Level Tier
        if visitor_category == "unknown":
            risk_level = "unknown"
        elif risk_score >= 80.0:
            risk_level = "critical"
        elif risk_score >= 60.0:
            risk_level = "high"
        elif risk_score >= 30.0:
            risk_level = "moderate"
        else:
            risk_level = "low"

        # Map to Decision Policy
        # - low risk human: ALLOW
        # - AI-agent or moderate risk: VERIFY (Challenge)
        # - traditional high-frequency bot: RATE LIMIT or BLOCK
        # - advanced bot / critical threat: BLOCK
        if visitor_category == "human" and risk_score < 30.0:
            decision = "allow"
        elif visitor_category == "ai_agent":
            decision = "allow" if risk_score < 30.0 else "verify"
        elif risk_score >= 80.0:
            decision = "block"
        elif risk_score >= 55.0:
            decision = "rate_limit"
        else:
            decision = "verify"

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "visitor_category": visitor_category,
            "confidence": round(confidence, 4) if confidence else None,
            "decision": decision,
            "reason_codes": list(set(reasons)),
            "layer_results": {
                "xgboost": l1,
                "lstm": l2,
                "rad_s1": l3
            }
        }

risk_engine = RiskEngine()
