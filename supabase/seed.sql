-- =============================================================================
-- Supabase Seed Data for BotPulse
-- Automatically executed by Supabase CLI or GitHub Action
-- =============================================================================

-- 1. Primary SOC Analyst (Password: botpulse2026!)
INSERT INTO public.users (id, email, full_name, organization, hashed_password, role, created_at)
VALUES (
    'usr_seed_analyst',
    'analyst@botpulse.io',
    'Alexander Wright',
    'BotPulse Cyber Labs',
    '$2b$12$6t69D8yFj3q00rQ5X4hM/e5dJ8H3tZ/1pY8Y6j5Q4L4L4L4L4L4L4',
    'owner',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. Default Protected Storefront (ÉLVARA Fashion)
INSERT INTO public.websites (id, site_id, site_key, name, domain, user_id, status, created_at, secret_key)
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
