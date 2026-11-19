import logging
import time
import uuid
from typing import Dict, Any, List
from datetime import datetime

from backend.database import db
from backend.services.session_service import session_service
from backend.services.detection_orchestrator import orchestrator
from backend.services.risk_engine import risk_engine
from backend.services.prevention_service import prevention_service
from backend.config import settings

logger = logging.getLogger("botpulse.services.tracking")

class TrackingService:
    """
    Ingestion coordinator.
    Ingests telemetry batches, updates session states, executes 3-layer detection,
    and returns signed decision tokens.
    """

    def __init__(self):
        self._session_resemble_verdicts: Dict[str, Dict[str, Any]] = {}

    def process_telemetry_batch(self, batch_data: Dict[str, Any], client_ip: str = "127.0.0.1") -> Dict[str, Any]:
        site_key = batch_data.get("site_key", settings.DEFAULT_SITE_KEY)
        session_id = batch_data.get("session_id", f"sess_{uuid.uuid4().hex[:10]}")
        visitor_id = batch_data.get("visitor_id")
        user_agent = batch_data.get("user_agent", "Unknown Browser")
        resemble_token = batch_data.get("resemble_token")
        raw_events = batch_data.get("events", [])
        session_metadata = batch_data.get("session_metadata") or {}
        if batch_data.get("gemini_api_key"):
            session_metadata["gemini_api_key"] = batch_data.get("gemini_api_key")
        if batch_data.get("api_key"):
            session_metadata["api_key"] = batch_data.get("api_key")

        # Persist and apply latest Resemble.AI verdict for this session (supports mid-visit handovers)
        incoming_resemble = batch_data.get("resemble_verdict") or session_metadata.get("resemble_verdict")
        if not incoming_resemble:
            for ev in reversed(raw_events):
                if ev.get("event_type") == "resemble_verdict" and isinstance(ev.get("payload"), dict):
                    incoming_resemble = ev["payload"]
                    break
        if isinstance(incoming_resemble, dict) and incoming_resemble.get("verdict"):
            self._session_resemble_verdicts[session_id] = incoming_resemble
            session_metadata["resemble_verdict"] = incoming_resemble
        elif session_id in self._session_resemble_verdicts:
            session_metadata["resemble_verdict"] = self._session_resemble_verdicts[session_id]

        # 1. Update In-memory Event Buffer for Session
        buffered_events = session_service.buffer_events(session_id, raw_events)

        # 2. Extract trajectory coordinates for 2D visualizer
        coords = []
        for e in buffered_events:
            if e.get("event_type") in ("mouse_move", "mousemove") and "payload" in e:
                p = e["payload"]
                if "x" in p and "y" in p:
                    coords.append({"x": p["x"], "y": p["y"], "t": e.get("timestamp", 0)})

        # 3. Execute Three-Layer Orchestration (XGBoost -> LSTM -> RAD-S1)
        orchestration_result = orchestrator.orchestrate(
            session_id=session_id,
            events=buffered_events,
            user_agent=user_agent,
            resemble_token=resemble_token,
            session_metadata=session_metadata
        )

        # 4. Evaluate Unified Risk Engine
        risk_result = risk_engine.evaluate(orchestration_result)

        # 5. Determine site_id
        site_record = db.get_website_by_key(site_key)
        site_id = site_record.get("site_id", settings.DEFAULT_SITE_ID) if site_record else settings.DEFAULT_SITE_ID

        # 6. Generate Prevention Decision & Signed Token
        prevention_result = prevention_service.generate_prevention_decision(
            session_id=session_id,
            site_id=site_id,
            risk_result=risk_result,
            client_ip=client_ip
        )

        # 7. Persist Session & Events to Database
        now = datetime.utcnow().isoformat()
        session_doc = {
            "session_id": session_id,
            "site_key": site_key,
            "visitor_id": visitor_id or f"vis_{session_id[-8:]}",
            "ip": client_ip,
            "user_agent": user_agent,
            "category": risk_result["visitor_category"],
            "risk_score": risk_result["risk_score"],
            "risk_level": risk_result["risk_level"],
            "enforcement": prevention_result["action"],
            "first_seen": now,
            "last_seen": now,
            "event_count": len(buffered_events),
            "reasons": risk_result["reason_codes"],
            "metrics": orchestration_result.get("extracted_features", {}),
            "coordinates": coords[-40:] # store up to 40 recent points for 2D replay
        }
        db.save_session(session_doc)

        # Normalize and store event records (clamp any future/invalid client clocks to server UTC time)
        now_ms = int(time.time() * 1000)
        db_events = []
        for idx, ev in enumerate(raw_events):
            raw_ts = ev.get("timestamp")
            try:
                ev_ts = int(raw_ts)
            except (TypeError, ValueError):
                ev_ts = now_ms
            if ev_ts <= 0 or ev_ts > now_ms + 60000:
                ev_ts = now_ms
            db_events.append({
                "id": f"evt_{uuid.uuid4().hex[:12]}",
                "session_id": session_id,
                "site_key": site_key,
                "event_type": ev.get("event_type", "telemetry"),
                "url": ev.get("url", ""),
                "timestamp": ev_ts,
                "sequence_num": ev.get("sequence_num", idx + 1),
                "payload": ev.get("payload", {})
            })
        db.insert_events_batch(db_events)

        # 8. Record Threat if Critical
        if risk_result["risk_level"] in ("critical", "high") and risk_result["visitor_category"] != "human":
            db.create_threat({
                "id": f"thr_{uuid.uuid4().hex[:10]}",
                "session_id": session_id,
                "site_key": site_key,
                "title": f"Detected {risk_result['visitor_category'].replace('_', ' ').title()}",
                "category": "Automated Anomaly" if risk_result["visitor_category"] != "ai_agent" else "Autonomous Agent Scan",
                "severity": risk_result["risk_level"],
                "status": "new",
                "detected_at": now,
                "details": f"Triggered on reasons: {', '.join(risk_result['reason_codes'])}"
            })

        # Return response expected by botpulse.js
        return {
            "action": prevention_result["action"],
            "risk_score": prevention_result["risk_score"],
            "risk_level": prevention_result["risk_level"],
            "predicted_label": "AI Agent" if risk_result["visitor_category"] == "ai_agent" else risk_result["visitor_category"].replace('_', ' ').title(),
            "confidence": prevention_result["confidence"],
            "decision_token": prevention_result["decision_token"],
            "reasons": risk_result["reason_codes"],
            "pow_challenge": prevention_result.get("pow_challenge")
        }

tracking_service = TrackingService()
