/**
 * BotPulse Centralized API Client
 * Interacts with FastAPI Backend Engine on /api/v1
 */

export function getApiBaseUrl(): string {
  const DEFAULT_TUNNEL_API = 'https://exclusively-lawyer-watch-roots.trycloudflare.com/api/v1';

  if (typeof window !== 'undefined') {
    // 1. Check if URL has ?api=https://... to quickly switch or set backend
    try {
      const params = new URLSearchParams(window.location.search);
      const paramUrl = params.get('api');
      if (paramUrl) {
        const clean = paramUrl.replace(/\/+$/, '');
        localStorage.setItem('bp_api_url', clean);
        return clean;
      }
    } catch {}

    // 2. Check saved localStorage
    const saved = localStorage.getItem('bp_api_url');
    if (saved && saved.trim() !== '') {
      // If deployed on Vercel and localStorage is pointing to unreachable 127.0.0.1 or localhost, redirect to active tunnel
      if (
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        (saved.includes('127.0.0.1') || saved.includes('localhost'))
      ) {
        localStorage.setItem('bp_api_url', DEFAULT_TUNNEL_API);
        return DEFAULT_TUNNEL_API;
      }
      return saved.replace(/\/+$/, '');
    }
  }

  // 3. Environment variable or default
  const envUrl = (import.meta as any).env?.VITE_API_URL as string;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }

  // 4. Default: active public Cloudflare tunnel
  return DEFAULT_TUNNEL_API;
}

export interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  role: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export interface TrafficTrendItem {
  timestamp?: number;
  time: string;
  human: number;
  bot: number;
  aiAgent: number;
  bots?: number;
  agents?: number;
  total?: number;
  requests?: number;
  human_requests?: number;
  bot_requests?: number;
  agent_requests?: number;
}

export interface TopPageItem {
  path: string;
  count: number;
  human: number;
  bot: number;
  agent: number;
}

export interface BehavioralMetrics {
  human_entropy?: number;
  bot_jitter?: number;
  ai_attribution?: string;
  active_agents?: number;
}

export interface DashboardStatsResponse {
  total_requests: number;
  total_sessions: number;
  human_count: number;
  traditional_bot_count: number;
  advanced_bot_count: number;
  ai_agent_count: number;
  threat_count?: number;
  blocked_threats_count?: number;
  prevention_actions?: number;
  avg_risk_score?: number;
  mitigation_rate: string;
  traffic_trend?: TrafficTrendItem[];
  top_pages?: TopPageItem[];
  behavioral_metrics?: BehavioralMetrics;
}

export interface BackendLiveEvent {
  id: string;
  session_id: string;
  site_key: string;
  event_type: string;
  url: string;
  ip: string;
  user_agent?: string;
  category: 'human' | 'traditional_bot' | 'advanced_bot' | 'ai_agent';
  agent_name?: string;
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  action: 'allow' | 'verify' | 'rate_limit' | 'block';
  timestamp: string;
}

export interface BackendSession {
  session_id: string;
  site_key: string;
  visitor_id?: string;
  ip: string;
  user_agent?: string;
  category: 'human' | 'traditional_bot' | 'advanced_bot' | 'ai_agent';
  agent_family?: string;
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  action: 'allow' | 'verify' | 'rate_limit' | 'block';
  total_events: number;
  first_seen: string;
  last_seen: string;
  duration_seconds: number;
  reasons: string[];
  telemetry_metrics?: {
    mouseMovementEntropy: number;
    scrollJitter: number;
    typingRhythmVariance: number;
    straightLineMovesRatio: number;
    clickPrecisionVariance: number;
  };
}

export interface ModelLayerHealth {
  layer: string;
  name: string;
  status: 'READY' | 'ACTIVE' | 'DEGRADED' | 'UNAVAILABLE';
  version: string;
  latency_ms: number;
  runs: number;
  detections: number;
  artifact_path?: string;
  note?: string;
}

export interface ModelHealthResponse {
  status: 'healthy' | 'degraded' | 'error';
  layers: {
    xgboost: ModelLayerHealth;
    lstm: ModelLayerHealth;
    rad_s1: ModelLayerHealth;
  };
}

export interface PreventionOverviewResponse {
  total_decisions: number;
  blocked: number;
  allowed: number;
  rate_limited: number;
  mitigation_rate: string;
}

export interface IntegrationSiteResponse {
  testing_site: {
    name: string;
    domain: string;
    site_key: string;
    site_id: string;
    status: string;
    sdk_version: string;
    script_snippet: string;
  };
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('bp_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `API request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.detail || errData.message || errMsg;
    } catch {
      // Body not JSON
    }
    throw new ApiError(errMsg, res.status);
  }

  return (await res.json()) as T;
}

export const api = {
  get baseUrl() {
    return getApiBaseUrl();
  },

  // Auth endpoints
  auth: {
    login: (email: string, pass: string): Promise<AuthResponse> =>
      apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      }),

    register: (data: {
      fullName: string;
      workEmail: string;
      organization: string;
      password: string;
    }): Promise<AuthResponse> =>
      apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: data.fullName,
          work_email: data.workEmail,
          organization: data.organization,
          password: data.password,
        }),
      }),

    getMe: (): Promise<ApiUser> =>
      apiRequest<ApiUser>('/auth/me', {
        method: 'GET',
      }),
  },

  // Website management
  websites: {
    getAll: () => apiRequest<any[]>('/websites', { method: 'GET' }),
    create: (data: { name: string; domain: string }) =>
      apiRequest<any>('/websites', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (siteId: string) =>
      apiRequest<{ status: string }>(`/websites/${siteId}`, {
        method: 'DELETE',
      }),
  },

  // Dashboard Telemetry & Metrics
  dashboard: {
    getStats: (domain?: string, range: string = '24h'): Promise<DashboardStatsResponse> => {
      const params = new URLSearchParams();
      if (domain && domain !== 'all') params.append('domain', domain);
      if (range) params.append('range', range);
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiRequest<DashboardStatsResponse>(`/dashboard/stats${query}`, { method: 'GET' });
    },

    getLiveEvents: (limit: number = 50): Promise<BackendLiveEvent[]> =>
      apiRequest<BackendLiveEvent[]>(`/dashboard/live?limit=${limit}`, { method: 'GET' }),

    getSessions: (limit: number = 50): Promise<BackendSession[]> =>
      apiRequest<BackendSession[]>(`/dashboard/sessions?limit=${limit}`, { method: 'GET' }),

    getThreats: (): Promise<any[]> =>
      apiRequest<any[]>('/dashboard/threats', { method: 'GET' }),

    updateThreatStatus: (threatId: string, status: string): Promise<any> =>
      apiRequest<any>(`/dashboard/threats/${threatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    getLayers: (): Promise<Record<string, ModelLayerHealth>> =>
      apiRequest<Record<string, ModelLayerHealth>>('/dashboard/layers', { method: 'GET' }),

    getModelHealth: (): Promise<ModelHealthResponse> =>
      apiRequest<ModelHealthResponse>('/dashboard/model-health', { method: 'GET' }),

    getAiAgents: (): Promise<{ total_ai_agents: number; agents: any[] }> =>
      apiRequest<{ total_ai_agents: number; agents: any[] }>('/dashboard/agents', { method: 'GET' }),

    getPreventionStats: (): Promise<PreventionOverviewResponse> =>
      apiRequest<PreventionOverviewResponse>('/dashboard/prevention', { method: 'GET' }),

    getIntegrations: (): Promise<IntegrationSiteResponse> =>
      apiRequest<IntegrationSiteResponse>('/dashboard/integrations', { method: 'GET' }),

    getPolicies: (siteId: string = 'site_alvera_001'): Promise<any> =>
      apiRequest<any>(`/prevention/policies?site_id=${siteId}`, { method: 'GET' }),
  },

  // Prevention feedback & Proof-of-Work
  prevention: {
    sendFeedback: (payload: {
      site_id: string;
      session_id?: string;
      action: string;
      enforcement_result?: string;
      risk_score?: number;
      risk_level?: string;
    }) =>
      apiRequest<any>('/enforce/feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getPoWChallenge: (difficulty = 3): Promise<any> =>
      apiRequest<any>(`/prevention/pow/challenge?difficulty=${difficulty}`, { method: 'POST' }),

    verifyPoWSolution: (payload: any): Promise<any> =>
      apiRequest<any>('/prevention/pow/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getPoWStats: (): Promise<{ total_solved: number; avg_solve_time_ms: number; status: string; default_difficulty: number }> =>
      apiRequest<any>('/prevention/pow/stats', { method: 'GET' }),

    getPolicies: (siteId: string = 'site_alvera_001'): Promise<any> =>
      apiRequest<any>(`/prevention/policies?site_id=${siteId}`, { method: 'GET' }),

    updatePolicies: (payload: any): Promise<{ status: string; message: string; policy: any }> =>
      apiRequest<{ status: string; message: string; policy: any }>('/prevention/policies', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  // Direct Telemetry Ingestion (for test injectors / beacons)
  events: {
    ingestBatch: (payload: any) =>
      apiRequest<any>('/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
};
