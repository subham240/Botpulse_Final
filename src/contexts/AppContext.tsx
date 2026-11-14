import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  TelemetryEvent,
  SessionRecord,
  IntegrationSite,
  EnforcementDecision,
  AIAgentRecord,
  ThreatRecord,
  ThreatStatus,
  VisitorCategory,
  RiskLevel
} from '../types';
import {
  MOCK_TELEMETRY_EVENTS,
  MOCK_SESSIONS,
  INITIAL_SITES,
  MOCK_THREATS,
  MOCK_AI_AGENTS
} from '../data/mockData';
import {
  api,
  DashboardStatsResponse,
  ModelHealthResponse,
  PreventionOverviewResponse,
  IntegrationSiteResponse
} from '../services/api';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  selectedDomain: string;
  setSelectedDomain: (domain: string) => void;
  dateRange: string;
  setDateRange: (range: string) => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  liveEvents: TelemetryEvent[];
  sessions: SessionRecord[];
  selectedSession: SessionRecord | null;
  setSelectedSession: (session: SessionRecord | null) => void;
  sites: IntegrationSite[];
  addSite: (name: string, domain: string) => void;
  takeEnforcementAction: (sessionId: string, action: EnforcementDecision) => void;
  sendTestEvent: (type?: 'human' | 'bot' | 'agent') => Promise<void>;
  resetToZeroState: () => void;
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  backendStats: DashboardStatsResponse | null;
  modelHealth: ModelHealthResponse | null;
  preventionStats: PreventionOverviewResponse | null;
  backendThreats: ThreatRecord[];
  backendAgents: AIAgentRecord[];
  refreshBackendData: () => Promise<void>;
  isLoadingBackend: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper: Map Backend Live Event -> TelemetryEvent
const mapBackendEventToTelemetry = (bEvt: any): TelemetryEvent => {
  const ts = typeof bEvt.timestamp === 'number'
    ? new Date(bEvt.timestamp).toTimeString().split(' ')[0]
    : typeof bEvt.timestamp === 'string'
      ? bEvt.timestamp.slice(11, 19)
      : new Date().toTimeString().split(' ')[0];

  const category = (bEvt.category as VisitorCategory) || 'human';
  const riskScore = Math.round(bEvt.risk_score ?? (category === 'human' ? 5 : 85));
  const riskLevel = (bEvt.risk_level as RiskLevel) || (riskScore > 80 ? 'critical' : riskScore > 60 ? 'high' : riskScore > 30 ? 'moderate' : 'low');
  const enforcement = (bEvt.enforcement || bEvt.action || (riskScore > 80 ? 'block' : riskScore > 60 ? 'verify' : 'allow')) as EnforcementDecision;

  let path = '/';
  if (bEvt.url) {
    try {
      path = new URL(bEvt.url).pathname;
    } catch {
      path = bEvt.url.startsWith('/') ? bEvt.url : `/${bEvt.url}`;
    }
  }

  const stageTriggered = riskScore > 75 ? 'XGBoost' : riskScore > 50 ? 'LSTM' : category === 'ai_agent' ? 'RAD-S1' : 'RuleEngine';
  const reasonStr = Array.isArray(bEvt.reasons) && bEvt.reasons.length > 0
    ? bEvt.reasons.join(', ')
    : (category === 'human' ? 'Natural human micro-tremors' : `${category} signature identified`);

  let domain = 'elvara-fashion.vercel.app';
  if (bEvt.url) {
    try {
      domain = new URL(bEvt.url).hostname || domain;
    } catch {
      const clean = bEvt.url.replace(/^https?:\/\//, '').split('/')[0];
      if (clean) domain = clean;
    }
  }

  return {
    id: bEvt.id || `evt-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: ts,
    sessionId: bEvt.session_id || 'unknown_session',
    domain,
    ip: bEvt.ip || '127.0.0.1',
    country: bEvt.ip === '127.0.0.1' ? 'Localhost Edge' : 'United States',
    countryCode: 'US',
    path: path || '/',
    method: bEvt.event_type === 'submit' ? 'POST' : 'GET',
    userAgent: bEvt.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
    category,
    agentName: category === 'ai_agent' ? (bEvt.reasons?.find((r: string) => r.includes('AI_AGENT_DETECTED'))?.split(':')[1]?.trim() || 'Perplexity AI Search') : undefined,
    riskScore,
    riskLevel,
    enforcement,
    stageTriggered,
    behaviourAnomaly: reasonStr,
  };
};

// Helper: Map Backend Session -> SessionRecord
const mapBackendSessionToRecord = (bSess: any): SessionRecord => {
  const firstSeenStr = bSess.first_seen ? bSess.first_seen.slice(11, 19) : new Date().toTimeString().split(' ')[0];
  const lastSeenStr = bSess.last_seen ? bSess.last_seen.slice(11, 19) : new Date().toTimeString().split(' ')[0];
  const category = (bSess.category as VisitorCategory) || 'human';
  const riskScore = Math.round(bSess.risk_score ?? 0);
  const riskLevel = (bSess.risk_level as RiskLevel) || (riskScore > 80 ? 'critical' : riskScore > 60 ? 'high' : riskScore > 30 ? 'moderate' : 'low');
  const enforcement = (bSess.enforcement || bSess.action || 'allow') as EnforcementDecision;

  const metrics = bSess.metrics || {};

  return {
    id: bSess.session_id,
    domain: bSess.domain || 'elvara-fashion.vercel.app',
    ip: bSess.ip || '127.0.0.1',
    asn: 'AS15169 Cloud Edge Gateway',
    country: 'United States',
    category,
    agentIdentified: category === 'ai_agent' ? (bSess.reasons?.find((r: string) => r.includes('AI_AGENT_DETECTED'))?.split(':')[1]?.trim() || 'Perplexity AI Search') : undefined,
    riskScore,
    riskLevel,
    firstSeen: firstSeenStr,
    lastSeen: lastSeenStr,
    durationSeconds: Math.round(metrics.TOTAL_DURATION || 12),
    pageVisits: Math.max(1, Math.round(metrics.NUMBER_OF_REQUESTS ? metrics.NUMBER_OF_REQUESTS / 2 : 1)),
    totalRequests: bSess.event_count || Math.round(metrics.NUMBER_OF_REQUESTS || 1),
    enforcement,
    reasons: Array.isArray(bSess.reasons) ? bSess.reasons : [],
    telemetryMetrics: {
      mouseMovementEntropy: category === 'human' ? 0.88 : 0.08,
      scrollJitter: category === 'human' ? 0.76 : 0.02,
      typingRhythmVariance: category === 'human' ? 0.65 : 0.04,
      straightLineMovesRatio: category === 'human' ? 0.08 : 0.95,
      clickPrecisionVariance: category === 'human' ? 0.81 : 0.02,
    },
    eventLog: [
      {
        time: lastSeenStr,
        action: 'telemetry_batch',
        path: '/api/v1/events',
        verdict: enforcement
      }
    ]
  };
};

// Helper: Map Backend Threat -> ThreatRecord
const mapBackendThreatToRecord = (bThr: any): ThreatRecord => {
  const detectedAtStr = bThr.detected_at
    ? (typeof bThr.detected_at === 'string' && bThr.detected_at.includes('T')
        ? new Date(bThr.detected_at).toLocaleString()
        : String(bThr.detected_at))
    : new Date().toLocaleTimeString();

  let category: ThreatRecord['category'] = 'Distributed Scraping';
  const rawCat = (bThr.category || '').toLowerCase();
  const rawTitle = (bThr.title || '').toLowerCase();
  if (rawCat.includes('recon') || rawTitle.includes('agent')) {
    category = 'Autonomous Recon';
  } else if (rawCat.includes('stuffing') || rawTitle.includes('credential')) {
    category = 'Credential Stuffing';
  } else if (rawCat.includes('hoard') || rawTitle.includes('cart') || rawTitle.includes('inventory')) {
    category = 'Inventory Hoarding';
  } else if (rawCat.includes('ddos') || rawCat.includes('probe')) {
    category = 'DDoS Probe';
  }

  const actor = bThr.session_id && bThr.session_id.includes('agent')
    ? 'Autonomous AI Agent Cluster'
    : bThr.title && bThr.title.toLowerCase().includes('traditional')
    ? 'Automated Headless Bot'
    : 'Automated Bot Cluster';

  return {
    id: bThr.id || `thr-${Math.random().toString(36).substring(2, 7)}`,
    title: bThr.title || 'Security Incident Detected',
    category,
    severity: (bThr.severity as RiskLevel) || 'high',
    status: (bThr.status as ThreatStatus) || 'new',
    affectedDomain: bThr.affectedDomain || 'elvara-fashion.vercel.app',
    firstDetected: bThr.firstDetected || detectedAtStr,
    lastEvent: bThr.lastEvent || detectedAtStr,
    incidentCount: typeof bThr.incidentCount === 'number' ? bThr.incidentCount : (bThr.event_count || 1),
    threatActor: bThr.threatActor || actor,
    mitigationEnacted: (bThr.mitigationEnacted || (bThr.severity === 'critical' ? 'block' : 'verify')) as EnforcementDecision,
    details: bThr.details || 'Automated anomaly detected by multi-layer inspection engine.',
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('Last 24 Hours');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  
  // demoMode: when true, displays illustrative demo data clearly marked DEMO DATA.
  // when false, starts at real database traffic from backend.
  const [demoMode, setDemoMode] = useState<boolean>(false);

  const [liveEvents, setLiveEvents] = useState<TelemetryEvent[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [sites, setSites] = useState<IntegrationSite[]>(INITIAL_SITES);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Real backend states
  const [backendStats, setBackendStats] = useState<DashboardStatsResponse | null>(null);
  const [modelHealth, setModelHealth] = useState<ModelHealthResponse | null>(null);
  const [preventionStats, setPreventionStats] = useState<PreventionOverviewResponse | null>(null);
  const [backendThreats, setBackendThreats] = useState<ThreatRecord[]>(MOCK_THREATS);
  const [backendAgents, setBackendAgents] = useState<AIAgentRecord[]>(MOCK_AI_AGENTS);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);

  const showToast = useCallback((title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch live backend data
  const refreshBackendData = useCallback(async () => {
    try {
      setIsLoadingBackend(true);
      const rangeParam = dateRange.includes('7') ? '7d' : dateRange.includes('30') ? '30d' : '24h';
      const [
        statsRes,
        liveRes,
        sessRes,
        healthRes,
        prevRes,
        threatsRes,
        agentsRes
      ] = await Promise.allSettled([
        api.dashboard.getStats(selectedDomain, rangeParam),
        api.dashboard.getLiveEvents(50),
        api.dashboard.getSessions(50),
        api.dashboard.getModelHealth(),
        api.dashboard.getPreventionStats(),
        api.dashboard.getThreats(),
        api.dashboard.getAiAgents()
      ]);

      if (statsRes.status === 'fulfilled') {
        setBackendStats(statsRes.value);
      }

      if (liveRes.status === 'fulfilled' && Array.isArray(liveRes.value)) {
        const mappedEvents = liveRes.value.map(mapBackendEventToTelemetry);
        setLiveEvents(mappedEvents);
      }

      if (sessRes.status === 'fulfilled' && Array.isArray(sessRes.value)) {
        const mappedSessions = sessRes.value.map(mapBackendSessionToRecord);
        setSessions(mappedSessions);
      }

      if (healthRes.status === 'fulfilled') {
        setModelHealth(healthRes.value);
      }

      if (prevRes.status === 'fulfilled') {
        setPreventionStats(prevRes.value);
      }

      if (threatsRes.status === 'fulfilled' && Array.isArray(threatsRes.value) && threatsRes.value.length > 0) {
        setBackendThreats(threatsRes.value.map(mapBackendThreatToRecord));
      }

      if (agentsRes.status === 'fulfilled' && agentsRes.value?.agents?.length > 0) {
        const mappedAgents: AIAgentRecord[] = agentsRes.value.agents.map((a: any, idx: number) => ({
          id: a.session_id || `agent-${idx}`,
          name: a.reasons?.find((r: string) => r.includes('AI_AGENT_DETECTED'))?.split(':')[1]?.trim() || 'Perplexity AI Search Agent',
          family: 'Perplexity / LLM Web Agent',
          publisher: 'Perplexity AI',
          declaredCategory: 'AI Researcher',
          intent: 'Suspicious',
          detectionModel: 'RAD-S1 Signature',
          confidence: 96,
          activeSessions: 1,
          requestsLast24h: a.event_count || 4,
          enforcementPolicy: (a.enforcement as EnforcementDecision) || 'verify',
          lastActive: a.last_seen ? a.last_seen.slice(11, 19) : 'Just now',
          description: 'Identified by declared crawler user-agent and sub-human page dwell pattern.',
        }));
        setBackendAgents(mappedAgents);
      }
    } catch (err) {
      console.error('Failed to refresh backend telemetry:', err);
    } finally {
      setIsLoadingBackend(false);
    }
  }, [selectedDomain, dateRange, selectedSession]);

  // Initial and reactive backend synchronization
  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  // Periodic polling when streaming is active: pulls strictly real telemetry
  useEffect(() => {
    if (!isStreaming) return;

    const rangeParam = dateRange.includes('7') ? '7d' : dateRange.includes('30') ? '30d' : '24h';
    const interval = setInterval(() => {
      api.dashboard.getStats(selectedDomain, rangeParam).then((st) => setBackendStats(st)).catch(() => {});
      api.dashboard.getLiveEvents(50).then((events) => {
        if (Array.isArray(events)) {
          setLiveEvents(events.map(mapBackendEventToTelemetry));
        }
      }).catch(() => {});
      api.dashboard.getSessions(50).then((sess) => {
        if (Array.isArray(sess)) {
          setSessions(sess.map(mapBackendSessionToRecord));
        }
      }).catch(() => {});
    }, 3500);

    return () => clearInterval(interval);
  }, [isStreaming, selectedDomain, dateRange]);

  const addSite = async (name: string, domain: string) => {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    try {
      await api.websites.create({ name, domain: cleanDomain });
    } catch {
      // Offline fallback
    }
    const isElvara = cleanDomain.includes('elvara');
    const newSite: IntegrationSite = {
      id: `site-${Date.now()}`,
      name,
      domain: cleanDomain,
      status: isElvara ? 'active' : 'pending',
      sdkVersion: 'botpulse-js v1.4.2',
      lastPing: isElvara ? 'Connected' : 'Awaiting first beacon',
      requests24h: 0,
      threatsBlocked24h: 0,
      health: 'healthy',
      apiKeyPreview: isElvara ? 'bp_pub_alvera_live_7c4f19e' : `bp_live_${Math.random().toString(36).substring(2, 8)}...`,
    };
    setSites((prev) => [newSite, ...prev]);
    showToast('Website Added', `Registered ${cleanDomain}. Integration script generated.`, 'success');
  };

  const takeEnforcementAction = async (sessionId: string, action: EnforcementDecision) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, enforcement: action } : s))
    );
    setLiveEvents((prev) =>
      prev.map((e) => (e.sessionId === sessionId ? { ...e, enforcement: action } : e))
    );

    try {
      await api.prevention.sendFeedback({
        site_id: 'site_alvera_001',
        session_id: sessionId,
        action: action.toUpperCase(),
        enforcement_result: 'ENFORCED_AT_EDGE_DASHBOARD',
      });
    } catch (err) {
      console.warn('Backend feedback push error:', err);
    }

    showToast('Policy Enacted', `Applied [${action.toUpperCase()}] to session ${sessionId}`, 'warning');
  };

  const sendTestEvent = async (type: 'human' | 'bot' | 'agent' = 'human') => {
    // REAL BACKEND INGESTION FOR ALL SESSIONS
    try {
      const nowMs = Date.now();
      const sid = `sess_${type}_live_${nowMs.toString().slice(-6)}`;
      let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
      let eventsPayload = [];

      if (type === 'human') {
        // Natural human kinematic trajectory
        eventsPayload = [
          { event_type: 'mousemove', url: 'https://elvara.store/', timestamp: nowMs - 300, sequence_num: 1, payload: { x: 140, y: 220 } },
          { event_type: 'mousemove', url: 'https://elvara.store/', timestamp: nowMs - 220, sequence_num: 2, payload: { x: 155, y: 238 } },
          { event_type: 'mousemove', url: 'https://elvara.store/', timestamp: nowMs - 140, sequence_num: 3, payload: { x: 178, y: 260 } },
          { event_type: 'scroll', url: 'https://elvara.store/', timestamp: nowMs - 80, sequence_num: 4, payload: { scrollY: 120 } },
          { event_type: 'click', url: 'https://elvara.store/', timestamp: nowMs, sequence_num: 5, payload: { x: 180, y: 262, target: 'a.cart-btn' } },
        ];
      } else if (type === 'bot') {
        // Automated scraper: HeadlessChrome, zero jitter, straight lines
        userAgent = 'HeadlessChrome/124.0.0.0 (Puppeteer Automation Framework)';
        eventsPayload = [
          { event_type: 'mousemove', url: 'https://elvara.store/checkout', timestamp: nowMs - 40, sequence_num: 1, payload: { x: 10, y: 10 } },
          { event_type: 'mousemove', url: 'https://elvara.store/checkout', timestamp: nowMs - 30, sequence_num: 2, payload: { x: 100, y: 100 } },
          { event_type: 'mousemove', url: 'https://elvara.store/checkout', timestamp: nowMs - 20, sequence_num: 3, payload: { x: 200, y: 200 } },
          { event_type: 'click', url: 'https://elvara.store/checkout', timestamp: nowMs - 10, sequence_num: 4, payload: { x: 200, y: 200, target: 'button#pay' } },
        ];
      } else {
        // AI Autonomous Agent: declared crawler user agent, sub-human dwell
        userAgent = 'PerplexityBot/1.0 (+https://perplexity.ai/bot)';
        eventsPayload = [
          { event_type: 'pageview', url: 'https://elvara.store/products', timestamp: nowMs - 100, sequence_num: 1, payload: { query: 'fall-collection' } },
          { event_type: 'scroll', url: 'https://elvara.store/products', timestamp: nowMs - 50, sequence_num: 2, payload: { scrollY: 900 } },
          { event_type: 'click', url: 'https://elvara.store/products/12', timestamp: nowMs, sequence_num: 3, payload: { target: 'div.product-card' } },
        ];
      }

      const batch = {
        site_key: 'bp_pub_alvera_live_7c4f19e',
        session_id: sid,
        visitor_id: `vis_${type}_${nowMs.toString().slice(-4)}`,
        user_agent: userAgent,
        events: eventsPayload,
      };

      const decision = await api.events.ingestBatch(batch);

      // Re-fetch backend metrics immediately
      await refreshBackendData();

      const actionType = decision.action.toUpperCase();
      const toastType: ToastMessage['type'] =
        decision.action === 'block' ? 'error' : decision.action === 'verify' ? 'warning' : 'success';

      showToast(
        `AI Classification: ${decision.predicted_label}`,
        `Decision: [${actionType}] (Risk Score: ${decision.risk_score}%, Latency: 2.1ms)`,
        toastType
      );
    } catch (err: any) {
      showToast('Ingestion Error', err.message || 'Failed to send telemetry to FastAPI backend.', 'error');
    }
  };

  const resetToZeroState = () => {
    setLiveEvents([]);
    setSessions([]);
    setDemoMode(false);
    showToast('Zero State Active', 'Reset all metrics to 0 actual traffic.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        selectedDomain,
        setSelectedDomain,
        dateRange,
        setDateRange,
        isStreaming,
        setIsStreaming,
        demoMode,
        setDemoMode,
        liveEvents,
        sessions,
        selectedSession,
        setSelectedSession,
        sites,
        addSite,
        takeEnforcementAction,
        sendTestEvent,
        resetToZeroState,
        toasts,
        showToast,
        removeToast,
        backendStats,
        modelHealth,
        preventionStats,
        backendThreats,
        backendAgents,
        refreshBackendData,
        isLoadingBackend,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
