from pydantic import BaseModel
from typing import Dict, Any, Optional

class EnforcementFeedbackPayload(BaseModel):
    decision_id: Optional[str] = None
    site_id: str
    session_id: Optional[str] = None
    visitor_type: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    action: str
    endpoint: Optional[str] = None
    enforcement_result: Optional[str] = None
    http_status_code: Optional[int] = 200
    failure_reason: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class PreventionPolicy(BaseModel):
    site_id: str
    high_risk_action: str = "block"        # "block", "verify", "allow"
    ai_agent_action: str = "verify"        # "allow", "verify", "block"
    traditional_bot_action: str = "block"  # "block", "rate_limit"
    rate_limit_rpm: int = 60
