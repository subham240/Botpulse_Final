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
    site_id: str = "site_alvera_001"
    block_threshold: int = 80             # 0-100 score cutoff for blocking
    verify_threshold: int = 60            # 0-100 score cutoff for PoW challenge
    auto_mitigation: bool = True          # Enable autonomous edge drops
    
    # Category Actions
    high_risk_action: str = "block"       # "block", "verify", "allow"
    ai_agent_action: str = "verify"       # "allow", "verify", "rate_limit", "block"
    traditional_bot_action: str = "block" # "block", "rate_limit", "verify"
    verified_bot_action: str = "allow"    # "allow", "rate_limit" (Googlebot, Bingbot)
    
    # Rate Limiting & Traffic Regulation
    rate_limit_rpm: int = 60              # Requests per minute limit (10 - 300)
    burst_allowance: int = 15             # Max burst requests before throttling (5 - 50)
    rate_limit_action: str = "throttle"   # "throttle" (429), "pow_challenge", "drop" (403)
    
    # Behavioral & Kinematic Bot Characteristics
    pow_difficulty: int = 3               # 2 (Fast), 3 (Standard), 4 (Heavy), 5 (Severe)
    lstm_kinematic_sensitivity: str = "standard" # "relaxed", "standard", "aggressive"
    block_headless_browsers: bool = True  # Puppeteer, Playwright, Selenium, Headless Chrome
    block_known_scrapers: bool = True     # Scraping clusters & crawlers
    block_data_centers: bool = False      # AWS, DigitalOcean, Hetzner, GCP datacenters
    rapid_scan_protection: bool = True    # Directory enumeration / 404 scanning defense
    
    # Enforcements & Blocklists
    enforcement_layers: Optional[list] = [
        "Ed25519 Token Verification", 
        "HS256 Fallback", 
        "Cryptographic Proof-of-Work (PoW)"
    ]
    block_list: Optional[list] = [
        "45.154.255.89/32 (Known Headless Cluster)",
        "91.240.118.0/24 (Credential Stuffing Proxy)",
        "AS209854 (ServerHub Malicious AS)"
    ]
