import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from backend.database import db

logger = logging.getLogger("botpulse.services.session")

class SessionService:
    def __init__(self):
        # In-memory buffer of recent event trajectories per session for fast sequential evaluation
        self._trajectory_buffers: Dict[str, List[Dict[str, Any]]] = {}

    def buffer_events(self, session_id: str, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Appends events to session buffer (keeping up to 100 recent events)."""
        if session_id not in self._trajectory_buffers:
            self._trajectory_buffers[session_id] = []
        
        self._trajectory_buffers[session_id].extend(events)
        # Retain last 100 events
        if len(self._trajectory_buffers[session_id]) > 100:
            self._trajectory_buffers[session_id] = self._trajectory_buffers[session_id][-100:]
        
        return self._trajectory_buffers[session_id]

    def get_buffered_events(self, session_id: str) -> List[Dict[str, Any]]:
        return self._trajectory_buffers.get(session_id, [])

    def get_or_create_session(
        self,
        session_id: str,
        site_key: str,
        visitor_id: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fetches existing session from DB or initializes a fresh record."""
        existing = db.get_session(session_id)
        if existing:
            return existing

        now = datetime.utcnow().isoformat()
        session_record = {
            "session_id": session_id,
            "site_key": site_key,
            "visitor_id": visitor_id or f"vis_{session_id[-8:]}",
            "ip": ip or "127.0.0.1",
            "user_agent": user_agent or "Unknown Browser",
            "category": "unknown",
            "risk_score": 0.0,
            "risk_level": "unknown",
            "enforcement": "allow",
            "first_seen": now,
            "last_seen": now,
            "event_count": 0,
            "reasons": [],
            "metrics": {},
            "coordinates": []
        }
        db.save_session(session_record)
        return session_record

session_service = SessionService()
