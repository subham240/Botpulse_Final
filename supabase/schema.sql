-- =============================================================================
-- BotPulse AI Security Engine — Supabase Cloud PostgreSQL Schema
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =============================================================================

-- 1. Users & Security Analysts Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    organization TEXT,
    hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'owner',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Protected Websites & Edge Sensor Keys
CREATE TABLE IF NOT EXISTS websites (
    id TEXT PRIMARY KEY,
    site_id TEXT UNIQUE NOT NULL,
    site_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    secret_key TEXT
);

-- 3. Behavioral Visitor Sessions (Evaluated by XGBoost, BiLSTM & RAD-S1)
CREATE TABLE IF NOT EXISTS sessions (
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
    reasons TEXT,       -- JSON encoded list of detection indicators
    metrics TEXT,       -- JSON encoded kinematic metrics (entropy, jitter, standard deviation)
    coordinates TEXT    -- JSON encoded 2D cursor trajectory coordinates
);

-- 4. Micro-Behavioral Telemetry Events (Mouse, Scroll, Click, PageView)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    site_key TEXT,
    event_type TEXT NOT NULL,
    url TEXT,
    timestamp BIGINT NOT NULL,
    sequence_num INTEGER DEFAULT 1,
    payload TEXT        -- JSON encoded event payload
);

-- 5. SOC Threat Incidents & Anomalies
CREATE TABLE IF NOT EXISTS threats (
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

-- 6. Autonomous Enforcement Feedback & Verification Tokens
CREATE TABLE IF NOT EXISTS enforcement_feedback (
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

-- 7. Cryptographic Proof-of-Work Hardware Challenge Log
CREATE TABLE IF NOT EXISTS pow_challenges (
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
CREATE TABLE IF NOT EXISTS policies (
    site_id TEXT PRIMARY KEY,
    data TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Performance Optimization Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_events_session_ts ON events (session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_site_ts ON events (site_key, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_site_last ON sessions (site_key, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_cat ON sessions (category);
CREATE INDEX IF NOT EXISTS idx_threats_site_det ON threats (site_key, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites (domain);
CREATE INDEX IF NOT EXISTS idx_websites_key ON websites (site_key);

-- =============================================================================
-- Enable Row Level Security (RLS)
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE enforcement_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE pow_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Permissive policies for backend service role and anon ingest
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow service role full access" ON users;
    CREATE POLICY "Allow service role full access" ON users FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON websites;
    CREATE POLICY "Allow service role full access" ON websites FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON sessions;
    CREATE POLICY "Allow service role full access" ON sessions FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON events;
    CREATE POLICY "Allow service role full access" ON events FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON threats;
    CREATE POLICY "Allow service role full access" ON threats FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON enforcement_feedback;
    CREATE POLICY "Allow service role full access" ON enforcement_feedback FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON pow_challenges;
    CREATE POLICY "Allow service role full access" ON pow_challenges FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow service role full access" ON policies;
    CREATE POLICY "Allow service role full access" ON policies FOR ALL USING (true);
END $$;

-- =============================================================================
-- Default Seed Data
-- =============================================================================

-- Seed Primary SOC Analyst (Password: botpulse2026!)
INSERT INTO users (id, email, full_name, organization, hashed_password, role, created_at)
VALUES (
    'usr_seed_analyst',
    'analyst@botpulse.io',
    'Alexander Wright',
    'BotPulse Cyber Labs',
    '$2b$12$6t69D8yFj3q00rQ5X4hM/e5dJ8H3tZ/1pY8Y6j5Q4L4L4L4L4L4L4',
    'owner',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Seed Default Protected Website (ÉLVARA Fashion Storefront)
INSERT INTO websites (id, site_id, site_key, name, domain, user_id, status, created_at, secret_key)
VALUES (
    'site_seed_alvera',
    'site_alvera_001',
    'bp_pub_alvera_live_7c4f19e',
    'ÉLVARA Fashion',
    'elvara-fashion.vercel.app',
    'usr_seed_analyst',
    'active',
    NOW(),
    'bp_sec_alvera_live_9f8e7d6c5b4a3'
) ON CONFLICT (site_key) DO NOTHING;
