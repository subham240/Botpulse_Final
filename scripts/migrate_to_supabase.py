"""
BotPulse — One-Click Data Migration from Local SQLite to Supabase Cloud PostgreSQL
Transfers all users, registered websites, behavioral sessions, events, and threats.

Usage:
  python scripts/migrate_to_supabase.py [SUPABASE_DB_URL]
"""
import sys
import os
import sqlite3
import json

# Ensure project root is in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(ROOT_DIR, ".env"))

def main():
    print("=" * 65)
    print("  BotPulse — Local SQLite to Supabase Cloud Migration Tool")
    print("=" * 65)

    # 1. Get Supabase Connection String
    supabase_url = None
    if len(sys.argv) > 1:
        supabase_url = sys.argv[1].strip()
    else:
        supabase_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

    if not supabase_url:
        print("\n✗ Error: No Supabase connection string provided.")
        print("\nUsage:")
        print("  python scripts/migrate_to_supabase.py \"postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres\"")
        print("\nOr add to your .env file:")
        print("  SUPABASE_DB_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres")
        sys.exit(1)

    # 2. Check local SQLite DB
    sqlite_path = os.path.join(ROOT_DIR, "backend", "data", "botpulse.db")
    if not os.path.exists(sqlite_path):
        print(f"\n✗ Error: Local SQLite file not found at {sqlite_path}")
        sys.exit(1)

    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
    except ImportError:
        print("\n✗ Error: psycopg2-binary is not installed. Install via: pip install psycopg2-binary")
        sys.exit(1)

    print(f"\n[1/3] Reading source data from local SQLite: {sqlite_path}...")
    src_conn = sqlite3.connect(sqlite_path)
    src_conn.row_factory = sqlite3.Row
    src_cur = src_conn.cursor()

    # Read all tables
    def fetch_all(table_name):
        try:
            src_cur.execute(f"SELECT * FROM {table_name}")
            return [dict(r) for r in src_cur.fetchall()]
        except Exception:
            return []

    users = fetch_all("users")
    websites = fetch_all("websites")
    sessions = fetch_all("sessions")
    events = fetch_all("events")
    threats = fetch_all("threats")
    feedback = fetch_all("enforcement_feedback")
    pows = fetch_all("pow_challenges")

    print(f"  • Users:                {len(users)}")
    print(f"  • Protected Websites:   {len(websites)}")
    print(f"  • Behavioral Sessions:  {len(sessions)}")
    print(f"  • Telemetry Events:     {len(events)}")
    print(f"  • Threat Incidents:     {len(threats)}")
    print(f"  • Enforcement Feedback: {len(feedback)}")

    print(f"\n[2/3] Connecting to Supabase Cloud PostgreSQL...")
    try:
        dest_conn = psycopg2.connect(supabase_url)
        dest_cur = dest_conn.cursor()
        print("✓ Connected successfully to Supabase PostgreSQL!")
    except Exception as e:
        print(f"✗ Failed to connect to Supabase: {e}")
        sys.exit(1)

    print("\n[3/3] Migrating data into Supabase Cloud...")

    # Ensure tables exist
    schema_path = os.path.join(ROOT_DIR, "supabase", "schema.sql")
    if os.path.exists(schema_path):
        with open(schema_path, "r", encoding="utf-8") as f:
            dest_cur.execute(f.read())
        dest_conn.commit()
        print("✓ Verified Supabase database schema and RLS policies.")

    # Migrate users
    migrated_users = 0
    for u in users:
        dest_cur.execute("""
        INSERT INTO users (id, email, full_name, organization, hashed_password, role, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            organization = EXCLUDED.organization,
            hashed_password = EXCLUDED.hashed_password,
            role = EXCLUDED.role
        """, (u["id"], u["email"], u.get("full_name", ""), u.get("organization", ""), u["hashed_password"], u.get("role", "owner"), u.get("created_at")))
        migrated_users += 1
    dest_conn.commit()

    # Migrate websites
    migrated_websites = 0
    for w in websites:
        dest_cur.execute("""
        INSERT INTO websites (id, site_id, site_key, name, domain, user_id, status, created_at, secret_key)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (site_key) DO UPDATE SET
            name = EXCLUDED.name,
            domain = EXCLUDED.domain,
            status = EXCLUDED.status
        """, (w["id"], w["site_id"], w["site_key"], w["name"], w["domain"], w.get("user_id"), w.get("status", "active"), w.get("created_at"), w.get("secret_key", "")))
        migrated_websites += 1
    dest_conn.commit()

    # Migrate sessions
    migrated_sessions = 0
    for s in sessions:
        dest_cur.execute("""
        INSERT INTO sessions (
            session_id, site_key, visitor_id, ip, user_agent, category,
            risk_score, risk_level, enforcement, first_seen, last_seen,
            event_count, reasons, metrics, coordinates
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (session_id) DO UPDATE SET
            category = EXCLUDED.category,
            risk_score = EXCLUDED.risk_score,
            risk_level = EXCLUDED.risk_level,
            enforcement = EXCLUDED.enforcement,
            last_seen = EXCLUDED.last_seen,
            event_count = EXCLUDED.event_count,
            reasons = EXCLUDED.reasons,
            metrics = EXCLUDED.metrics,
            coordinates = EXCLUDED.coordinates
        """, (
            s["session_id"], s.get("site_key", ""), s.get("visitor_id", ""), s.get("ip", ""),
            s.get("user_agent", ""), s.get("category", "unknown"), s.get("risk_score", 0.0),
            s.get("risk_level", "low"), s.get("enforcement", "allow"), s.get("first_seen"),
            s.get("last_seen"), s.get("event_count", 1), s.get("reasons"), s.get("metrics"), s.get("coordinates")
        ))
        migrated_sessions += 1
    dest_conn.commit()

    # Migrate events
    migrated_events = 0
    for ev in events:
        dest_cur.execute("""
        INSERT INTO events (id, session_id, site_key, event_type, url, timestamp, sequence_num, payload)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING
        """, (
            ev["id"], ev.get("session_id"), ev.get("site_key"), ev.get("event_type"),
            ev.get("url"), ev.get("timestamp"), ev.get("sequence_num", 1), ev.get("payload")
        ))
        migrated_events += 1
    dest_conn.commit()

    # Migrate threats
    migrated_threats = 0
    for t in threats:
        dest_cur.execute("""
        INSERT INTO threats (id, session_id, site_key, title, category, severity, status, detected_at, details)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            details = EXCLUDED.details
        """, (
            t["id"], t.get("session_id", ""), t.get("site_key", ""), t["title"],
            t.get("category", "Automated Threat"), t.get("severity", "high"),
            t.get("status", "new"), t.get("detected_at"), t.get("details", "")
        ))
        migrated_threats += 1
    dest_conn.commit()

    dest_cur.close()
    dest_conn.close()
    src_conn.close()

    print("\n" + "=" * 65)
    print("  🎉 MIGRATION TO SUPABASE COMPLETE!")
    print("=" * 65)
    print(f"  ✓ Users migrated:    {migrated_users}")
    print(f"  ✓ Websites migrated: {migrated_websites}")
    print(f"  ✓ Sessions migrated: {migrated_sessions}")
    print(f"  ✓ Events migrated:   {migrated_events}")
    print(f"  ✓ Threats migrated:  {migrated_threats}")
    print("=" * 65)
    print("\nYour BotPulse engine is ready to use Supabase cloud database 24/7.")

if __name__ == "__main__":
    main()
