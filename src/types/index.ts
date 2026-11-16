export type VisitorCategory = 'human' | 'traditional_bot' | 'advanced_bot' | 'ai_agent';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type EnforcementDecision = 'allow' | 'verify' | 'rate_limit' | 'block';

export type ThreatStatus = 'new' | 'investigating' | 'confirmed' | 'resolved' | 'false_positive';

export type UserRole = 'owner' | 'admin' | 'security_analyst' | 'viewer';

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  sessionId: string;
  domain: string;
  ip: string;
  country: string;
  countryCode: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  userAgent: string;
  category: VisitorCategory;
  agentName?: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  enforcement: EnforcementDecision;
  stageTriggered: 'XGBoost' | 'LSTM' | 'RAD-S1' | 'RuleEngine';
  behaviourAnomaly: string;
}

export interface SessionRecord {
  id: string;
  domain: string;
  ip: string;
  asn: string;
  country: string;
  category: VisitorCategory;
  agentIdentified?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  firstSeen: string;
  lastSeen: string;
  durationSeconds: number;
  pageVisits: number;
  totalRequests: number;
  enforcement: EnforcementDecision;
  reasons: string[];
  telemetryMetrics: {
    mouseMovementEntropy: number; // 0 (robotic) to 1 (human random)
    scrollJitter: number;
    typingRhythmVariance: number;
    headMovementConfidence?: number;
    straightLineMovesRatio: number;
    clickPrecisionVariance: number;
  };
  eventLog: {
    time: string;
    action: string;
    path: string;
    verdict: string;
  }[];
}

export interface AIAgentRecord {
  id: string;
  name: string;
  family: string;
  publisher: string;
  declaredCategory: 'Search Bot' | 'Coding Agent' | 'AI Researcher' | 'Rogue Scraper' | 'Autonomous Agent';
  intent: 'Legitimate' | 'Suspicious' | 'Malicious';
  detectionModel: 'RAD-S1 Signature' | 'Prompt Injection Fingerprint' | 'Header Correlation' | 'Behavioural Pattern' | 'RAD-S1 API Credential Attribution' | 'RAD-S1 Multi-Factor Fingerprint';
  confidence: number; // percentage
  activeSessions: number;
  requestsLast24h: number;
  enforcementPolicy: EnforcementDecision;
  lastActive: string;
  description: string;
}

export interface ThreatRecord {
  id: string;
  title: string;
  category: 'Distributed Scraping' | 'Credential Stuffing' | 'Inventory Hoarding' | 'Autonomous Recon' | 'DDoS Probe';
  severity: RiskLevel;
  status: ThreatStatus;
  affectedDomain: string;
  firstDetected: string;
  lastEvent: string;
  incidentCount: number;
  threatActor: string;
  mitigationEnacted: EnforcementDecision;
  details: string;
}

export interface IntegrationSite {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'pending' | 'disconnected';
  sdkVersion: string;
  lastPing: string;
  requests24h: number;
  threatsBlocked24h: number;
  health: 'healthy' | 'degraded' | 'offline';
  apiKeyPreview: string;
  isDemo?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'invited' | 'suspended';
  lastActive: string;
  avatarUrl?: string;
}

export interface PreventionPolicy {
  site_id: string;
  block_threshold: number;
  verify_threshold: number;
  auto_mitigation: boolean;
  high_risk_action: EnforcementDecision;
  ai_agent_action: EnforcementDecision;
  traditional_bot_action: EnforcementDecision;
  verified_bot_action: 'allow' | 'rate_limit';
  rate_limit_rpm: number;
  burst_allowance: number;
  rate_limit_action: 'throttle' | 'pow_challenge' | 'drop';
  pow_difficulty: number;
  lstm_kinematic_sensitivity: 'relaxed' | 'standard' | 'aggressive';
  block_headless_browsers: boolean;
  block_known_scrapers: boolean;
  block_data_centers: boolean;
  rapid_scan_protection: boolean;
  enforcement_layers?: string[];
  block_list?: string[];
  updated_at?: string;
}
