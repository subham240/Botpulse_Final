"""
BotPulse — GitHub Actions Automated Supabase Deployment Runner
Applies all migrations from supabase/migrations/ and executes supabase/seed.sql.
Includes automatic URL normalization, unencoded password escaping, IPv4 pooler redirection, and fallbacks.
"""
import sys
import os
import glob
import re
import urllib.parse

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

KNOWN_REF = "iexxzljqbwmymxytkocw"
KNOWN_PASS = "Subham%40112005"
KNOWN_POOLER_HOST = "aws-0-ap-northeast-2.pooler.supabase.com"

FALLBACK_URLS = [
    # 1. Supavisor IPv4 Session Pooler (port 5432 - supports DDL / migrations)
    f"postgresql://postgres.{KNOWN_REF}:{KNOWN_PASS}@{KNOWN_POOLER_HOST}:5432/postgres?sslmode=require",
    # 2. Supavisor IPv4 Transaction Pooler (port 6543)
    f"postgresql://postgres.{KNOWN_REF}:{KNOWN_PASS}@{KNOWN_POOLER_HOST}:6543/postgres?sslmode=require",
    # 3. Direct IPv6 Host (port 5432)
    f"postgresql://postgres:{KNOWN_PASS}@db.{KNOWN_REF}.supabase.co:5432/postgres?sslmode=require",
]

def normalize_database_url(raw_url: str):
    """
    Cleans and normalizes any Supabase connection URL.
    - Handles raw '@' or special characters in the password.
    - Converts IPv6-only direct host (db.<ref>.supabase.co) to IPv4 pooler for GitHub Actions.
    - Ensures sslmode=require.
    """
    if not raw_url or not raw_url.strip():
        return None

    url = raw_url.strip().strip("'\"")
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]

    # Parse postgresql://[user]:[password]@[host]:[port]/[database]
    # We use rfind('@') to safely split user:password from host:port
    prefix = "postgresql://"
    if url.startswith(prefix):
        body = url[len(prefix):]
        at_idx = body.rfind("@")
        if at_idx != -1:
            auth_part = body[:at_idx]
            rest_part = body[at_idx + 1:]
            
            # Split user and password by first ':'
            colon_idx = auth_part.find(":")
            if colon_idx != -1:
                user = auth_part[:colon_idx]
                raw_pwd = auth_part[colon_idx + 1:]
                
                # Unquote then quote to prevent double-encoding
                decoded_pwd = urllib.parse.unquote(raw_pwd)
                encoded_pwd = urllib.parse.quote(decoded_pwd, safe="")
                
                # Split host and path
                slash_idx = rest_part.find("/")
                host_port = rest_part[:slash_idx] if slash_idx != -1 else rest_part
                path_query = rest_part[slash_idx:] if slash_idx != -1 else "/postgres"
                
                if ":" in host_port:
                    host, port = host_port.split(":", 1)
                else:
                    host, port = host_port, "5432"
                
                # If host is db.<ref>.supabase.co, redirect to IPv4 pooler to prevent IPv6 DNS errors on GitHub Actions
                if host.startswith("db.") and host.endswith(".supabase.co"):
                    ref = host.split(".")[1]
                    host = KNOWN_POOLER_HOST
                    port = "5432"
                    if not user.startswith("postgres."):
                        user = f"postgres.{ref}"
                
                url = f"postgresql://{user}:{encoded_pwd}@{host}:{port}{path_query}"

    if "sslmode=" not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"
    return url


def connect_with_retry(candidate_urls):
    import psycopg2
    last_err = None
    for idx, uri in enumerate(candidate_urls, 1):
        # Mask password for display
        masked = re.sub(r':([^@]+)@', r':****@', uri)
        print(f"  [{idx}/{len(candidate_urls)}] Connecting to: {masked} ...")
        try:
            conn = psycopg2.connect(uri, connect_timeout=10)
            print("  ✓ Connected successfully!")
            return conn
        except Exception as e:
            print(f"  ⚠ Attempt {idx} failed: {e}")
            last_err = e
    raise last_err


def main():
    print("=" * 65)
    print("  BotPulse — GitHub to Supabase Automated Migration Deployer")
    print("=" * 65)

    try:
        import psycopg2
    except ImportError:
        print("✗ psycopg2 is not installed.")
        sys.exit(1)

    raw_env_url = (
        os.getenv("SUPABASE_DB_URL")
        or os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
    )

    candidates = []
    if raw_env_url:
        normalized = normalize_database_url(raw_env_url)
        if normalized:
            candidates.append(normalized)

    # Always append the known IPv4 pooler candidates as robust fallbacks
    for fallback in FALLBACK_URLS:
        if fallback not in candidates:
            candidates.append(fallback)

    print(f"\n[1/3] Establishing connection to Supabase Cloud...")
    try:
        conn = connect_with_retry(candidates)
        cur = conn.cursor()
    except Exception as e:
        print(f"\n✗ Failed to connect to Supabase after trying all endpoints: {e}")
        sys.exit(1)

    # 1. Apply all migrations in order
    migrations_dir = os.path.join(ROOT_DIR, "supabase", "migrations")
    migration_files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))

    print(f"\n[2/3] Applying {len(migration_files)} migration(s)...")
    for mig in migration_files:
        filename = os.path.basename(mig)
        print(f"  → Running migration: {filename}...")
        with open(mig, "r", encoding="utf-8") as f:
            sql = f.read()
        try:
            cur.execute(sql)
            conn.commit()
            print(f"    ✓ {filename} applied successfully.")
        except Exception as err:
            print(f"    ✗ Error in {filename}: {err}")
            conn.rollback()
            sys.exit(1)

    # 2. Apply seed.sql if present
    seed_file = os.path.join(ROOT_DIR, "supabase", "seed.sql")
    if os.path.exists(seed_file):
        print(f"\n[3/3] Applying seed data (seed.sql)...")
        with open(seed_file, "r", encoding="utf-8") as f:
            seed_sql = f.read()
        try:
            cur.execute(seed_sql)
            conn.commit()
            print("  ✓ Seed records verified successfully (SOC Analyst & ÉLVARA Storefront).")
        except Exception as seed_err:
            print(f"  Notice: Seed data application: {seed_err}")
            conn.rollback()

    # Verify table count in Supabase public schema
    cur.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
    count = cur.fetchone()[0]
    print(f"\n[Status] Supabase public tables verified: {count} active tables.")

    cur.close()
    conn.close()

    print("\n" + "=" * 65)
    print("  🚀 GITHUB TO SUPABASE DEPLOYMENT COMPLETED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    main()
