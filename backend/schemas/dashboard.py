from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DashboardStats(BaseModel):
    total_requests: int
    total_sessions: int
    human_count: int
    traditional_bot_count: int
    advanced_bot_count: int
    ai_agent_count: int
    threat_count: int
    prevention_actions: int
    avg_risk_score: float
    mitigation_rate: str
    traffic_trend: List[Dict[str, Any]] = Field(default_factory=list)
    top_pages: List[Dict[str, Any]] = Field(default_factory=list)
    behavioral_metrics: Dict[str, Any] = Field(default_factory=dict)

class LayerHealthStatus(BaseModel):
    layer: str
    name: str
    status: str       # "READY", "RUNNING", "LOADING", "UNAVAILABLE", "INSUFFICIENT_DATA"
    version: str
    latency_ms: float
    invocations: int
    anomalies_detected: int
    description: str

class DashboardLayersOverview(BaseModel):
    xgboost: LayerHealthStatus
    lstm: LayerHealthStatus
    rad_s1: LayerHealthStatus
