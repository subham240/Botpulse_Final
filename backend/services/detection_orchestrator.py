import logging
from typing import Dict, Any, List, Optional

from backend.ml.model_registry import model_registry
from backend.ml.feature_extractor import extract_features_from_events

logger = logging.getLogger("botpulse.services.orchestrator")

class DetectionOrchestrator:
    """
    Three-Layer Orchestration Engine.
    Executes conditional, staged inference:
    Layer 1: XGBoost tabular screening
    Layer 2: Bidirectional LSTM sequential behavioral analysis
    Layer 3: RAD-S1 autonomous AI-agent fingerprinting & credential attribution
    """

    def __init__(self):
        self.registry = model_registry

    def orchestrate(
        self,
        session_id: str,
        events: List[Dict[str, Any]],
        user_agent: Optional[str] = None,
        resemble_token: Optional[str] = None,
        session_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        session_metadata = session_metadata or {}
        if user_agent and "user_agent" not in session_metadata:
            session_metadata["user_agent"] = user_agent
        audit_trail = {
            "executed_layers": [],
            "skipped_layers": [],
            "reasons": []
        }

        # Step 1: Extract 27 common features
        features = extract_features_from_events(events, session_metadata)

        # ----------------------------------------------------------------------
        # LAYER 1: XGBoost Base Detection
        # ----------------------------------------------------------------------
        l1_result = self.registry.xgboost.predict(features)
        audit_trail["executed_layers"].append("xgboost")
        self.registry.record_run("xgboost", l1_result.get("latency_ms", 1.8), l1_result.get("predicted_class") != "human")

        # ----------------------------------------------------------------------
        # LAYER 2: LSTM Sequential Analysis
        # Triggered when XGBoost indicates automation, ambiguous probability,
        # or when sufficient interaction sequence exists.
        # ----------------------------------------------------------------------
        requires_l2 = l1_result.get("requires_advanced_analysis", False) or len(events) >= 5
        l2_result = None

        if requires_l2:
            l2_result = self.registry.lstm.evaluate_sequence(events)
            audit_trail["executed_layers"].append("lstm")
            is_l2_anomaly = (l2_result.get("advanced_bot_score") or 0.0) >= 0.65
            self.registry.record_run("lstm", l2_result.get("latency_ms", 3.5), is_l2_anomaly)
        else:
            audit_trail["skipped_layers"].append({
                "layer": "lstm",
                "reason": "L1_CONFIDENT_HUMAN_TRAFFIC"
            })

        # ----------------------------------------------------------------------
        # LAYER 3: RAD-S1 AI-Agent Attribution & Credential Validation
        # Evaluated when user agent hints AI crawler, API keys / resemble token present,
        # or automated traffic is detected.
        # ----------------------------------------------------------------------
        ua_str = (user_agent or "").lower()
        has_ai_indicator = any(k in ua_str for k in (
            "gemini", "google-genai", "google-generativeai", "googleagent", "google-extended",
            "claude", "gpt", "perplexity", "bot", "crawler", "agent", "langchain"
        ))
        headers_lower = {str(k).lower(): str(v) for k, v in session_metadata.get("headers", {}).items()}
        has_agent_key = (
            bool(resemble_token)
            or bool(session_metadata.get("resemble_verdict"))
            or bool(session_metadata.get("gemini_api_key"))
            or bool(session_metadata.get("api_key"))
            or "x-goog-api-key" in headers_lower
            or "x-gemini-api-key" in headers_lower
        )
        requires_l3 = has_ai_indicator or has_agent_key or (l1_result.get("predicted_class") == "automated_bot")

        l3_result = None
        if requires_l3:
            l3_result = self.registry.rad_s1.evaluate(events, user_agent, resemble_token, session_metadata)
            audit_trail["executed_layers"].append("rad_s1")
            self.registry.record_run("rad_s1", l3_result.get("latency_ms", 2.2), bool(l3_result.get("agent_detected")))
        else:
            audit_trail["skipped_layers"].append({
                "layer": "rad_s1",
                "reason": "NO_AI_AGENT_INDICATORS"
            })

        return {
            "session_id": session_id,
            "layer_1_xgboost": l1_result,
            "layer_2_lstm": l2_result,
            "layer_3_rad_s1": l3_result,
            "audit_trail": audit_trail,
            "extracted_features": features
        }

orchestrator = DetectionOrchestrator()
