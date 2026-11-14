from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class EventItem(BaseModel):
    event_type: str
    url: Optional[str] = None
    timestamp: int
    sequence_num: Optional[int] = 1
    payload: Dict[str, Any] = Field(default_factory=dict)

class TelemetryBatch(BaseModel):
    site_key: str
    session_id: str
    visitor_id: Optional[str] = None
    user_agent: Optional[str] = None
    resemble_token: Optional[str] = None
    events: List[EventItem] = Field(default_factory=list)

class DecisionResponse(BaseModel):
    action: str                # "allow", "verify", "rate_limit", "block"
    risk_score: float          # 0.0 to 1.0 or 0 to 100
    risk_level: str            # "low", "moderate", "high", "critical"
    predicted_label: str       # "Human", "Traditional Bot", "Advanced Bot", "AI Agent"
    confidence: float          # 0.0 to 1.0
    decision_token: str        # Signed cryptographic token
    reasons: List[str] = Field(default_factory=list)
    pow_challenge: Optional[Dict[str, Any]] = None
