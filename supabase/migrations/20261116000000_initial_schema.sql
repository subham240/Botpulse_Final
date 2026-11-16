-- =============================================================================
-- Migration: 20261116000000_initial_schema.sql
-- Description: Core tables, indexes, and RLS policies for BotPulse
-- =============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    organization TEXT,
    hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'owner',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Websites Table
CREATE TABLE IF NOT EXISTS public.websites (
    id TEXT PRIMARY KEY,
    site_id TEXT UNIQUE NOT NULL,
    site_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    secret_key TEXT
);

-- 3. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
    session_id TEXT PRIMARY KEY,
    site_key TEXT NOT NULL,
    visitor_id TEXT,
    ip TEXT,
    user_agent TEXT,
    category TEXT DEFAULT 'unknown',
    risk_score REAL DEFAULT 0.0,
    risk_level TEXT DEFAULT 'low',
    enforcement TEXT DEFAULT 'allow',
    first_seen TEXT,
    last_seen TEXT,
    event_count INTEGER DEFAULT 1,
    reasons TEXT,
    metrics TEXT,
    coordinates TEXT
);

-- 4. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    site_key TEXT,
    event_type TEXT NOT NULL,
    url TEXT,
    timestamp BIGINT NOT NULL,
    sequence_num INTEGER DEFAULT 1,
    payload TEXT
);

-- 5. Threats Table
CREATE TABLE IF NOT EXISTS public.threats (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    site_key TEXT,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Automated Threat',
    severity TEXT DEFAULT 'high',
    status TEXT DEFAULT 'new',
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    details TEXT
);

-- 6. Enforcement Feedback Table
CREATE TABLE IF NOT EXISTS public.enforcement_feedback (
    id TEXT PRIMARY KEY,
    decision_id TEXT,
    site_id TEXT,
    session_id TEXT,
    action TEXT,
    endpoint TEXT,
    result TEXT,
    http_status INTEGER DEFAULT 200,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Proof of Work Challenges Table
CREATE TABLE IF NOT EXISTS public.pow_challenges (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    challenge_id TEXT,
    difficulty INTEGER DEFAULT 3,
    nonce INTEGER,
    time_taken_ms REAL,
    status TEXT DEFAULT 'verified',
    resolved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Prevention Policies & Bot Regulation Thresholds Table
CREATE TABLE IF NOT EXISTS public.policies (
    site_id TEXT PRIMARY KEY,
    data TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for SOC Analytics and High-Throughput Telemetry
CREATE INDEX IF NOT EXISTS idx_events_session_ts ON public.events (session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_site_ts ON public.events (site_key, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_site_last ON public.sessions (site_key, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_cat ON public.sessions (category);
CREATE INDEX IF NOT EXISTS idx_threats_site_det ON public.threats (site_key, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON public.websites (domain);
CREATE INDEX IF NOT EXISTS idx_websites_key ON public.websites (site_key);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enforcement_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pow_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Service Backend & SDK Ingestion
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow service role full access" ON public.users;
    CREATE POLICY "Allow service role full access" ON public.users FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON public.websites;
    CREATE POLICY "Allow service role full access" ON public.websites FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON public.sessions;
    CREATE POLICY "Allow service role full access" ON public.sessions FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON public.events;
    CREATE POLICY "Allow service role full access" ON public.events FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON public.threats;
    CREATE POLICY "Allow service role full access" ON public.threats FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON public.enforcement_feedback;
    CREATE POLICY "Allow service role full access" ON public.enforcement_feedback FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON public.pow_challenges;
    CREATE POLICY "Allow service role full access" ON public.pow_challenges FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON public.policies;
    CREATE POLICY "Allow service role full access" ON public.policies FOR ALL USING (true);
END $$;
