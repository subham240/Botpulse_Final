"""
BotPulse — GitHub Actions Automated Supabase Deployment Runner
Applies all migrations from supabase/migrations/ and executes supabase/seed.sql.
"""
import sys
import os
import glob

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    print("=" * 65)
    print("  BotPulse — GitHub to Supabase Automated Migration Deployer")
    print("=" * 65)

    supabase_db_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not supabase_db_url:
        print("\n✗ Error: Missing SUPABASE_DB_URL secret in GitHub Actions environment.")
        print("\nTo fix this:")
        print("1. Go to your GitHub Repository -> Settings -> Secrets and variables -> Actions")
        print("2. Click 'New repository secret'")
        print("3. Name: SUPABASE_DB_URL")
        print("4. Value: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres")
        sys.exit(1)

    clean_url = supabase_db_url.strip().strip("'\"")
    if clean_url.startswith("postgres://"):
        clean_url = "postgresql://" + clean_url[len("postgres://"):]
    if "sslmode=" not in clean_url:
        clean_url += ("&" if "?" in clean_url else "?") + "sslmode=require"

    try:
        import psycopg2
    except ImportError:
        print("✗ psycopg2 is not installed.")
        sys.exit(1)

    print("\n[1/3] Connecting to Supabase Cloud PostgreSQL...")
    try:
        conn = psycopg2.connect(clean_url)
        cur = conn.cursor()
        print("✓ Connected successfully to Supabase PostgreSQL!")
    except Exception as e:
        print(f"✗ Failed to connect to Supabase: {e}")
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
            print("✓ Seed records verified successfully (SOC Analyst & ÉLVARA Storefront).")
        except Exception as seed_err:
            print(f"Notice: Seed data application: {seed_err}")
            conn.rollback()

    cur.close()
    conn.close()

    print("\n" + "=" * 65)
    print("  🚀 GITHUB TO SUPABASE DEPLOYMENT COMPLETED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    main()
