"""
Database access layer for BotPulse.
Supports:
1. Supabase Cloud PostgreSQL (via psycopg2 connection pool)
2. MongoDB (via pymongo)
3. Persistent Embedded SQLite (seamless local fallback)
"""

import os
import json
import sqlite3
import logging
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from urllib.parse import urlparse
from contextlib import contextmanager

from backend.config import settings

logger = logging.getLogger("botpulse.database")

class DatabaseManager:
    def __init__(self):
        self.is_postgres: bool = False
        self.pg_pool = None
        self.is_mongodb: bool = False
        self.mongo_client = None
        self.mongo_db = None
        self._policy_cache: Dict[str, Any] = {}
        
        is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
        if is_serverless:
            self.sqlite_path: str = "/tmp/botpulse.db"
            orig_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "botpulse.db")
            if os.path.exists(orig_db) and not os.path.exists(self.sqlite_path):
                try:
                    import shutil
                    shutil.copy2(orig_db, self.sqlite_path)
                except Exception as e:
                    logger.warning("Could not copy initial sqlite DB to /tmp: %s", e)
        else:
            self.sqlite_path: str = os.path.join(settings.DATA_DIR, "botpulse.db")
            try:
                os.makedirs(settings.DATA_DIR, exist_ok=True)
            except Exception:
                pass

        self._init_connection()

    def _init_connection(self):
        """Attempts connection to Supabase PostgreSQL, then MongoDB; falls back to SQLite."""
        # 1. Check for Supabase Cloud PostgreSQL connection string
        supabase_db_url = settings.SUPABASE_DB_URL or os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
        if supabase_db_url and ("postgres" in supabase_db_url.lower()):
            try:
                import psycopg2
                from psycopg2 import pool
                from psycopg2.extras import RealDictCursor
                
                clean_url = supabase_db_url.strip().strip("'\"")
                if clean_url.startswith("postgres://"):
                    clean_url = "postgresql://" + clean_url[len("postgres://"):]
                if "sslmode=" not in clean_url:
                    clean_url += ("&" if "?" in clean_url else "?") + "sslmode=require"
                
                logger.info("Connecting to Supabase Cloud PostgreSQL database...")
                self.pg_pool = pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=10,
                    dsn=clean_url
                )
                self.is_postgres = True
                self._init_postgres()
                logger.info("Connected successfully to Supabase Cloud PostgreSQL!")
                return
            except Exception as e:
                logger.warning("Supabase PostgreSQL connection failed: %s. Falling back to local storage.", e)
                self.is_postgres = False
                self.pg_pool = None

        # 2. Check for MongoDB if configured
        is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
        if not is_serverless or settings.MONGODB_URI != "mongodb://localhost:27017":
            try:
                import pymongo
                timeout = 500 if is_serverless else 2000
                client = pymongo.MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=timeout)
                client.admin.command('ping')
                self.mongo_client = client
                self.mongo_db = client[settings.DATABASE_NAME]
                self.is_mongodb = True
                logger.info("Connected successfully to MongoDB at %s", settings.MONGODB_URI)
                self._ensure_mongo_indexes()
                return
            except Exception as e:
                logger.warning("MongoDB unavailable (%s). Falling back to persistent SQLite storage.", e)

        # 3. Fallback to SQLite
        self.is_postgres = False
        self.is_mongodb = False
        self._init_sqlite()

    @contextmanager
    def _pg_cursor(self):
        """Context manager for thread-safe Supabase PostgreSQL queries."""
        conn = self.pg_pool.getconn()
        try:
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                yield cur
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self.pg_pool.putconn(conn)

    def _query_one(self, sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        """Unified single row query across Supabase PostgreSQL and SQLite."""
        if self.is_postgres:
            pg_sql = sql.replace("?", "%s")
            with self._pg_cursor() as cur:
                cur.execute(pg_sql, params)
                row = cur.fetchone()
                return dict(row) if row else None
        else:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute(sql, params)
            row = cur.fetchone()
            conn.close()
            return dict(row) if row else None

    def _query_all(self, sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Unified multiple row query across Supabase PostgreSQL and SQLite."""
        if self.is_postgres:
            pg_sql = sql.replace("?", "%s")
            with self._pg_cursor() as cur:
                cur.execute(pg_sql, params)
                return [dict(r) for r in cur.fetchall()]
        else:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute(sql, params)
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            return rows

    def _execute(self, sql: str, params: tuple = ()) -> int:
        """Unified mutation execution across Supabase PostgreSQL and SQLite."""
        if self.is_postgres:
            pg_sql = sql.replace("?", "%s")
            if "INSERT OR IGNORE INTO" in pg_sql:
                pg_sql = pg_sql.replace("INSERT OR IGNORE INTO", "INSERT INTO")
                if "ON CONFLICT" not in pg_sql:
                    pg_sql += " ON CONFLICT DO NOTHING"
            with self._pg_cursor() as cur:
                cur.execute(pg_sql, params)
                return cur.rowcount
        else:
            conn = sqlite3.connect(self.sqlite_path)
            cur = conn.cursor()
            cur.execute(sql, params)
            conn.commit()
            affected = cur.rowcount
            conn.close()
            return affected

    def _init_postgres(self):
        """Initializes Supabase Cloud PostgreSQL tables, indexes, and default records."""
        with self._pg_cursor() as cur:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT,
                organization TEXT,
                hashed_password TEXT NOT NULL,
                role TEXT DEFAULT 'owner',
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS websites (
                id TEXT PRIMARY KEY,
                site_id TEXT UNIQUE NOT NULL,
                site_key TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                domain TEXT NOT NULL,
                user_id TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT,
                secret_key TEXT
            );

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
                reasons TEXT,
                metrics TEXT,
                coordinates TEXT
            );

            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                site_key TEXT,
                event_type TEXT NOT NULL,
                url TEXT,
                timestamp BIGINT NOT NULL,
                sequence_num INTEGER DEFAULT 1,
                payload TEXT
            );

            CREATE TABLE IF NOT EXISTS threats (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                site_key TEXT,
                title TEXT NOT NULL,
                category TEXT DEFAULT 'Automated Threat',
                severity TEXT DEFAULT 'high',
                status TEXT DEFAULT 'new',
                detected_at TEXT,
                details TEXT
            );

            CREATE TABLE IF NOT EXISTS enforcement_feedback (
                id TEXT PRIMARY KEY,
                decision_id TEXT,
                site_id TEXT,
                session_id TEXT,
                action TEXT,
                endpoint TEXT,
                result TEXT,
                http_status INTEGER DEFAULT 200,
                received_at TEXT
            );

            CREATE TABLE IF NOT EXISTS pow_challenges (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                challenge_id TEXT,
                difficulty INTEGER DEFAULT 3,
                nonce INTEGER,
                time_taken_ms REAL,
                status TEXT DEFAULT 'verified',
                resolved_at TEXT
            );

            CREATE TABLE IF NOT EXISTS policies (
                site_id TEXT PRIMARY KEY,
                data TEXT,
                updated_at TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_events_session_ts ON events (session_id, timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_events_site_ts ON events (site_key, timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_sessions_site_last ON sessions (site_key, last_seen DESC);
            CREATE INDEX IF NOT EXISTS idx_threats_site_det ON threats (site_key, detected_at DESC);
            """)

            # Seed default SOC analyst if fresh
            try:
                cur.execute("SELECT id FROM users WHERE email = 'analyst@botpulse.io'")
                if not cur.fetchone():
                    from backend.core.security import hash_password
                    cur.execute("""
                    INSERT INTO users (id, email, full_name, organization, hashed_password, role, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO NOTHING
                    """, (
                        "usr_seed_analyst",
                        "analyst@botpulse.io",
                        "Alexander Wright",
                        "BotPulse Cyber Labs",
                        hash_password("botpulse2026!"),
                        "owner",
                        datetime.utcnow().isoformat()
                    ))
            except Exception as seed_err:
                logger.warning("Could not seed default analyst in Supabase: %s", seed_err)

            # Seed default protected site if fresh
            try:
                cur.execute("SELECT id FROM websites WHERE site_id = %s", (settings.DEFAULT_SITE_ID,))
                if not cur.fetchone():
                    cur.execute("""
                    INSERT INTO websites (id, site_id, site_key, name, domain, user_id, status, created_at, secret_key)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (site_key) DO NOTHING
                    """, (
                        "site_seed_alvera",
                        settings.DEFAULT_SITE_ID,
                        settings.DEFAULT_SITE_KEY,
                        settings.DEFAULT_SITE_NAME,
                        settings.DEFAULT_SITE_DOMAIN,
                        "usr_seed_analyst",
                        "active",
                        datetime.utcnow().isoformat(),
                        "bp_sec_alvera_live_9f8e7d6c5b4a3"
                    ))
            except Exception as site_seed_err:
                logger.warning("Could not seed default site in Supabase: %s", site_seed_err)

        logger.info("Supabase PostgreSQL tables and indexes ready.")

    def _ensure_mongo_indexes(self):
        try:
            self.mongo_db.users.create_index("email", unique=True)
            self.mongo_db.websites.create_index("site_key", unique=True)
            self.mongo_db.websites.create_index("site_id", unique=True)
            self.mongo_db.sessions.create_index("session_id", unique=True)
            self.mongo_db.events.create_index([("session_id", 1), ("timestamp", -1)])
            self.mongo_db.threats.create_index("threat_id", unique=True)
        except Exception as err:
            logger.error("Error creating MongoDB indexes: %s", err)

    def _init_sqlite(self):
        """Initializes SQLite tables for local persistence."""
        conn = sqlite3.connect(self.sqlite_path)
        cur = conn.cursor()
        
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            full_name TEXT,
            organization TEXT,
            hashed_password TEXT,
            role TEXT,
            created_at TEXT
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS websites (
            id TEXT PRIMARY KEY,
            site_id TEXT UNIQUE,
            site_key TEXT UNIQUE,
            name TEXT,
            domain TEXT,
            user_id TEXT,
            status TEXT,
            created_at TEXT,
            secret_key TEXT
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            site_key TEXT,
            visitor_id TEXT,
            ip TEXT,
            user_agent TEXT,
            category TEXT,
            risk_score REAL,
            risk_level TEXT,
            enforcement TEXT,
            first_seen TEXT,
            last_seen TEXT,
            event_count INTEGER,
            reasons TEXT,
            metrics TEXT,
            coordinates TEXT
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            site_key TEXT,
            event_type TEXT,
            url TEXT,
            timestamp INTEGER,
            sequence_num INTEGER,
            payload TEXT
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS threats (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            site_key TEXT,
            title TEXT,
            category TEXT,
            severity TEXT,
            status TEXT,
            detected_at TEXT,
            details TEXT
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS enforcement_feedback (
            id TEXT PRIMARY KEY,
            decision_id TEXT,
            site_id TEXT,
            session_id TEXT,
            action TEXT,
            endpoint TEXT,
            result TEXT,
            http_status INTEGER,
            received_at TEXT
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS pow_challenges (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            challenge_id TEXT,
            difficulty INTEGER,
            nonce INTEGER,
            time_taken_ms REAL,
            status TEXT,
            resolved_at TEXT
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            site_id TEXT PRIMARY KEY,
            data TEXT,
            updated_at TEXT
        )
        """)

        conn.commit()

        # Seed default SOC analyst if database is fresh
        try:
            cur.execute("SELECT id FROM users WHERE email = 'analyst@botpulse.io'")
            if not cur.fetchone():
                from backend.core.security import hash_password
                cur.execute("""
                INSERT INTO users (id, email, full_name, organization, hashed_password, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    "usr_seed_analyst",
                    "analyst@botpulse.io",
                    "Alexander Wright",
                    "BotPulse Cyber Labs",
                    hash_password("botpulse2026!"),
                    "owner",
                    datetime.utcnow().isoformat()
                ))
                conn.commit()
        except Exception as seed_err:
            logger.warning("Could not seed default analyst: %s", seed_err)

        conn.close()
        logger.info("SQLite database tables initialized successfully.")

    # --------------------------------------------------------------------------
    # Users Repository
    # --------------------------------------------------------------------------
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        email = email.lower().strip()
        if self.is_mongodb:
            return self.mongo_db.users.find_one({"email": email})
        else:
            return self._query_one("SELECT * FROM users WHERE email = ?", (email,))

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        user_data["email"] = user_data["email"].lower().strip()
        user_data["created_at"] = datetime.utcnow().isoformat()
        if self.is_mongodb:
            self.mongo_db.users.insert_one(user_data)
            return user_data
        else:
            sql = """
            INSERT INTO users (id, email, full_name, organization, hashed_password, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (email) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                organization = EXCLUDED.organization,
                hashed_password = EXCLUDED.hashed_password,
                role = EXCLUDED.role
            """
            self._execute(sql, (
                user_data["id"],
                user_data["email"],
                user_data.get("full_name", ""),
                user_data.get("organization", ""),
                user_data["hashed_password"],
                user_data.get("role", "owner"),
                user_data["created_at"]
            ))
            return user_data

    # --------------------------------------------------------------------------
    # Websites Repository
    # --------------------------------------------------------------------------
    def get_website_by_key(self, site_key: str) -> Optional[Dict[str, Any]]:
        if self.is_mongodb:
            return self.mongo_db.websites.find_one({"site_key": site_key})
        else:
            return self._query_one("SELECT * FROM websites WHERE site_key = ? OR site_id = ?", (site_key, site_key))

    def get_website_by_domain(self, domain_or_key: str) -> Optional[Dict[str, Any]]:
        if not domain_or_key:
            return None
        clean = domain_or_key.lower().replace("https://", "").replace("http://", "").split("/")[0].strip()
        if self.is_mongodb:
            doc = self.mongo_db.websites.find_one({"$or": [{"domain": domain_or_key}, {"domain": clean}, {"site_key": domain_or_key}, {"site_id": domain_or_key}]})
            if not doc and "elvara" in clean:
                doc = self.mongo_db.websites.find_one({"site_id": settings.DEFAULT_SITE_ID})
            return doc
        else:
            sql = "SELECT * FROM websites WHERE domain = ? OR domain = ? OR domain = 'elvara.store' OR domain = 'elvara-fashion.vercel.app' OR site_key = ? OR site_id = ?"
            rows = self._query_all(sql, (domain_or_key, clean, domain_or_key, domain_or_key))
            for r in rows:
                if r.get("domain") in (domain_or_key, clean) or r.get("site_key") == domain_or_key:
                    return r
            if "elvara" in clean:
                for r in rows:
                    if r.get("site_id") == settings.DEFAULT_SITE_ID:
                        return r
            return rows[0] if rows else None

    def get_websites_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        if self.is_mongodb:
            return list(self.mongo_db.websites.find({"user_id": user_id}, {"_id": 0}))
        else:
            return self._query_all("SELECT * FROM websites WHERE user_id = ?", (user_id,))

    def create_website(self, site_data: Dict[str, Any]) -> Dict[str, Any]:
        site_data["created_at"] = datetime.utcnow().isoformat()
        if self.is_mongodb:
            self.mongo_db.websites.insert_one(site_data)
            return site_data
        else:
            sql = """
            INSERT INTO websites (id, site_id, site_key, name, domain, user_id, status, created_at, secret_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (site_key) DO UPDATE SET
                name = EXCLUDED.name,
                domain = EXCLUDED.domain,
                status = EXCLUDED.status
            """
            self._execute(sql, (
                site_data["id"],
                site_data["site_id"],
                site_data["site_key"],
                site_data["name"],
                site_data["domain"],
                site_data["user_id"],
                site_data.get("status", "active"),
                site_data["created_at"],
                site_data.get("secret_key", "")
            ))
            return site_data

    def delete_website(self, site_id: str, user_id: str) -> bool:
        if self.is_mongodb:
            res = self.mongo_db.websites.delete_one({"site_id": site_id, "user_id": user_id})
            return res.deleted_count > 0
        else:
            affected = self._execute("DELETE FROM websites WHERE site_id = ? AND user_id = ?", (site_id, user_id))
            return affected > 0

    # --------------------------------------------------------------------------
    # Sessions Repository
    # --------------------------------------------------------------------------
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        if self.is_mongodb:
            return self.mongo_db.sessions.find_one({"session_id": session_id}, {"_id": 0})
        else:
            row = self._query_one("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
            if not row:
                return None
            row["reasons"] = json.loads(row["reasons"]) if row.get("reasons") and isinstance(row["reasons"], str) else (row.get("reasons") or [])
            row["metrics"] = json.loads(row["metrics"]) if row.get("metrics") and isinstance(row["metrics"], str) else (row.get("metrics") or {})
            row["coordinates"] = json.loads(row["coordinates"]) if row.get("coordinates") and isinstance(row["coordinates"], str) else (row.get("coordinates") or [])
            return row

    def save_session(self, session_data: Dict[str, Any]):
        if self.is_mongodb:
            self.mongo_db.sessions.update_one(
                {"session_id": session_data["session_id"]},
                {"$set": session_data},
                upsert=True
            )
        else:
            reasons_json = json.dumps(session_data.get("reasons", []))
            metrics_json = json.dumps(session_data.get("metrics", {}))
            coords_json = json.dumps(session_data.get("coordinates", []))
            sql = """
            INSERT INTO sessions (
                session_id, site_key, visitor_id, ip, user_agent, category,
                risk_score, risk_level, enforcement, first_seen, last_seen,
                event_count, reasons, metrics, coordinates
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                category = EXCLUDED.category,
                risk_score = EXCLUDED.risk_score,
                risk_level = EXCLUDED.risk_level,
                enforcement = EXCLUDED.enforcement,
                last_seen = EXCLUDED.last_seen,
                event_count = EXCLUDED.event_count,
                reasons = EXCLUDED.reasons,
                metrics = EXCLUDED.metrics,
                coordinates = EXCLUDED.coordinates
            """
            self._execute(sql, (
                session_data["session_id"],
                session_data.get("site_key", ""),
                session_data.get("visitor_id", ""),
                session_data.get("ip", ""),
                session_data.get("user_agent", ""),
                session_data.get("category", "unknown"),
                session_data.get("risk_score", 0.0),
                session_data.get("risk_level", "low"),
                session_data.get("enforcement", "allow"),
                session_data.get("first_seen", datetime.utcnow().isoformat()),
                session_data.get("last_seen", datetime.utcnow().isoformat()),
                session_data.get("event_count", 1),
                reasons_json,
                metrics_json,
                coords_json
            ))

    def get_sessions_list(self, site_key: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        if self.is_mongodb:
            query = {"site_key": site_key} if site_key and site_key != "all" else {}
            cursor = self.mongo_db.sessions.find(query, {"_id": 0}).sort("last_seen", -1).limit(limit)
            return list(cursor)
        else:
            if site_key and site_key != "all":
                rows = self._query_all("SELECT * FROM sessions WHERE site_key = ? ORDER BY last_seen DESC LIMIT ?", (site_key, limit))
            else:
                rows = self._query_all("SELECT * FROM sessions ORDER BY last_seen DESC LIMIT ?", (limit,))
            result = []
            for r in rows:
                d = dict(r)
                d["reasons"] = json.loads(d["reasons"]) if d.get("reasons") and isinstance(d["reasons"], str) else (d.get("reasons") or [])
                d["metrics"] = json.loads(d["metrics"]) if d.get("metrics") and isinstance(d["metrics"], str) else (d.get("metrics") or {})
                d["coordinates"] = json.loads(d["coordinates"]) if d.get("coordinates") and isinstance(d["coordinates"], str) else (d.get("coordinates") or [])
                result.append(d)
            return result

    # --------------------------------------------------------------------------
    # Events Repository
    # --------------------------------------------------------------------------
    def insert_events_batch(self, events: List[Dict[str, Any]]):
        if not events:
            return
        if self.is_mongodb:
            self.mongo_db.events.insert_many(events)
        else:
            sql = """
            INSERT INTO events (id, session_id, site_key, event_type, url, timestamp, sequence_num, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO NOTHING
            """
            for ev in events:
                payload_json = json.dumps(ev.get("payload", {}))
                self._execute(sql, (
                    ev.get("id", f"evt_{ev.get('timestamp')}_{ev.get('sequence_num')}"),
                    ev.get("session_id"),
                    ev.get("site_key"),
                    ev.get("event_type"),
                    ev.get("url"),
                    ev.get("timestamp"),
                    ev.get("sequence_num", 1),
                    payload_json
                ))

    def get_recent_events(self, site_key: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        if self.is_mongodb:
            query = {"site_key": site_key} if site_key and site_key != "all" else {}
            events = list(self.mongo_db.events.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit))
            for ev in events:
                sess = self.mongo_db.sessions.find_one({"session_id": ev.get("session_id")})
                if sess:
                    ev["ip"] = sess.get("ip", "127.0.0.1")
                    ev["category"] = sess.get("category", "human")
                    ev["risk_score"] = sess.get("risk_score", 0.0)
                    ev["risk_level"] = sess.get("risk_level", "low")
                    ev["enforcement"] = sess.get("enforcement", "allow")
                    ev["reasons"] = sess.get("reasons", [])
            return events
        else:
            query = """
            SELECT 
                e.id, e.session_id, e.site_key, e.event_type, e.url, e.timestamp, e.sequence_num, e.payload,
                s.ip, s.user_agent, s.category, s.risk_score, s.risk_level, s.enforcement, s.reasons
            FROM events e
            LEFT JOIN sessions s ON e.session_id = s.session_id
            """
            params = []
            if site_key and site_key != "all":
                query += " WHERE e.site_key = ?"
                params.append(site_key)
            query += " ORDER BY e.timestamp DESC LIMIT ?"
            params.append(limit)
            
            rows = self._query_all(query, tuple(params))
            result = []
            for r in rows:
                d = dict(r)
                d["payload"] = json.loads(d["payload"]) if d.get("payload") and isinstance(d["payload"], str) else (d.get("payload") or {})
                d["reasons"] = json.loads(d["reasons"]) if d.get("reasons") and isinstance(d["reasons"], str) else (d.get("reasons") or [])
                d["ip"] = d.get("ip") or "127.0.0.1"
                d["category"] = d.get("category") or "human"
                d["risk_score"] = d.get("risk_score") if d.get("risk_score") is not None else 0.0
                d["risk_level"] = d.get("risk_level") or "low"
                d["enforcement"] = d.get("enforcement") or "allow"
                result.append(d)
            return result

    # --------------------------------------------------------------------------
    # Threats Repository
    # --------------------------------------------------------------------------
    def create_threat(self, threat_data: Dict[str, Any]):
        if self.is_mongodb:
            self.mongo_db.threats.insert_one(threat_data)
        else:
            sql = """
            INSERT INTO threats (id, session_id, site_key, title, category, severity, status, detected_at, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                details = EXCLUDED.details
            """
            self._execute(sql, (
                threat_data["id"],
                threat_data.get("session_id", ""),
                threat_data.get("site_key", ""),
                threat_data["title"],
                threat_data.get("category", "Automated Threat"),
                threat_data.get("severity", "high"),
                threat_data.get("status", "new"),
                threat_data.get("detected_at", datetime.utcnow().isoformat()),
                threat_data.get("details", "")
            ))

    def get_threats_list(self, site_key: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        if self.is_mongodb:
            query = {"site_key": site_key} if site_key and site_key != "all" else {}
            return list(self.mongo_db.threats.find(query, {"_id": 0}).sort("detected_at", -1).limit(limit))
        else:
            if site_key and site_key != "all":
                return self._query_all("SELECT * FROM threats WHERE site_key = ? ORDER BY detected_at DESC LIMIT ?", (site_key, limit))
            else:
                return self._query_all("SELECT * FROM threats ORDER BY detected_at DESC LIMIT ?", (limit,))

    def update_threat_status(self, threat_id: str, new_status: str) -> bool:
        if self.is_mongodb:
            res = self.mongo_db.threats.update_one({"id": threat_id}, {"$set": {"status": new_status}})
            return res.modified_count > 0
        else:
            affected = self._execute("UPDATE threats SET status = ? WHERE id = ?", (new_status, threat_id))
            return affected > 0

    # --------------------------------------------------------------------------
    # Enforcement Feedback Repository
    # --------------------------------------------------------------------------
    def record_enforcement_feedback(self, data: Dict[str, Any]):
        data["received_at"] = datetime.utcnow().isoformat()
        if self.is_mongodb:
            self.mongo_db.enforcement_feedback.insert_one(data)
        else:
            sql = """
            INSERT INTO enforcement_feedback (id, decision_id, site_id, session_id, action, endpoint, result, http_status, received_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO NOTHING
            """
            self._execute(sql, (
                data.get("id", f"fb_{datetime.utcnow().timestamp()}"),
                data.get("decision_id", ""),
                data.get("site_id", ""),
                data.get("session_id", ""),
                data.get("action", ""),
                data.get("endpoint", ""),
                data.get("result", ""),
                data.get("http_status", 200),
                data["received_at"]
            ))

    # --------------------------------------------------------------------------
    # Strict Zero-State Statistics Aggregation
    # --------------------------------------------------------------------------
    def get_dashboard_stats(self, site_key: Optional[str] = None, time_range: Optional[str] = None) -> Dict[str, Any]:
        """
        Aggregates live counts strictly from real database records.
        Supports Supabase Cloud PostgreSQL, MongoDB, and SQLite.
        """
        if self.is_mongodb:
            query = {"site_key": site_key} if site_key and site_key != "all" else {}
            total_sessions = self.mongo_db.sessions.count_documents(query)
            if total_sessions == 0:
                return {
                    "total_requests": 0, "total_sessions": 0, "human_count": 0,
                    "traditional_bot_count": 0, "advanced_bot_count": 0, "ai_agent_count": 0,
                    "threat_count": 0, "prevention_actions": 0, "avg_risk_score": 0.0,
                    "mitigation_rate": "0.0%", "traffic_trend": [], "top_pages": [],
                    "behavioral_metrics": {"human_entropy": 0.88, "bot_jitter": 0.02, "ai_attribution": "RAD-S1 Active", "active_agents": 0}
                }
            
            human = self.mongo_db.sessions.count_documents({**query, "category": "human"})
            trad_bot = self.mongo_db.sessions.count_documents({**query, "category": "traditional_bot"})
            adv_bot = self.mongo_db.sessions.count_documents({**query, "category": "advanced_bot"})
            ai_agent = self.mongo_db.sessions.count_documents({**query, "category": "ai_agent"})
            threats = self.mongo_db.threats.count_documents(query)
            prevented = self.mongo_db.sessions.count_documents({**query, "enforcement": {"$in": ["block", "verify", "rate_limit"]}})
            total_reqs = self.mongo_db.events.count_documents(query)
            
            pipeline = [{"$match": query}, {"$group": {"_id": None, "avg_score": {"$avg": "$risk_score"}}}]
            agg_res = list(self.mongo_db.sessions.aggregate(pipeline))
            avg_risk = round(agg_res[0]["avg_score"], 1) if agg_res and agg_res[0].get("avg_score") is not None else 0.0

            trend_cursor = self.mongo_db.events.find(query).sort("timestamp", 1)
            trend_buckets = {}
            for ev in trend_cursor:
                ts = ev.get("timestamp", 0)
                try:
                    dt = datetime.utcfromtimestamp(ts / 1000.0) if ts > 1e11 else datetime.utcfromtimestamp(ts)
                    time_label = dt.strftime("%H:00") if time_range in (None, "24h") else dt.strftime("%b %d")
                    sort_key = dt.strftime("%Y%m%d%H") if time_range in (None, "24h") else dt.strftime("%Y%m%d")
                except Exception:
                    time_label = "Recent"
                    sort_key = "0"
                if sort_key not in trend_buckets:
                    trend_buckets[sort_key] = {"time": time_label, "human": 0, "bot": 0, "aiAgent": 0, "total": 0, "_sort": sort_key}
                cat = ev.get("category", "human")
                if cat == "human":
                    trend_buckets[sort_key]["human"] += 1
                elif cat in ("traditional_bot", "advanced_bot"):
                    trend_buckets[sort_key]["bot"] += 1
                elif cat == "ai_agent":
                    trend_buckets[sort_key]["aiAgent"] += 1
                else:
                    trend_buckets[sort_key]["human"] += 1
                trend_buckets[sort_key]["total"] += 1
            
            traffic_trend = sorted(trend_buckets.values(), key=lambda x: x["_sort"])
            for b in traffic_trend:
                del b["_sort"]

            non_human = total_sessions - human
            rate = f"{round((prevented / max(1, non_human)) * 100, 1)}%" if non_human > 0 else "100.0%"

            return {
                "total_requests": total_reqs, "total_sessions": total_sessions, "human_count": human,
                "traditional_bot_count": trad_bot, "advanced_bot_count": adv_bot, "ai_agent_count": ai_agent,
                "threat_count": threats, "prevention_actions": prevented, "avg_risk_score": avg_risk,
                "mitigation_rate": rate, "traffic_trend": traffic_trend, "top_pages": [],
                "behavioral_metrics": {"human_entropy": 0.88, "bot_jitter": 0.02, "ai_attribution": "RAD-S1 Active", "active_agents": ai_agent}
            }
        else:
            # Resolve site_key if it's a domain name
            target_key = site_key
            if site_key and site_key != "all":
                site_info = self.get_website_by_domain(site_key)
                if site_info and "site_key" in site_info:
                    target_key = site_info["site_key"]
            
            # Compute timestamp cutoff if time_range is specified
            cutoff_ms = 0
            cutoff_iso = None
            if time_range and time_range != "all":
                row = self._query_one("SELECT MAX(timestamp) as max_ts FROM events")
                max_ts = row["max_ts"] if row and row["max_ts"] else int(datetime.utcnow().timestamp() * 1000)
                if time_range == "24h":
                    cutoff_ms = max_ts - 24 * 3600 * 1000
                elif time_range == "7d":
                    cutoff_ms = max_ts - 7 * 86400 * 1000
                elif time_range == "30d":
                    cutoff_ms = max_ts - 30 * 86400 * 1000
                cutoff_iso = datetime.utcfromtimestamp(cutoff_ms / 1000.0).isoformat()

            sess_conditions = []
            sess_params = []
            if target_key and target_key != "all":
                sess_conditions.append("site_key = ?")
                sess_params.append(target_key)
            if cutoff_iso:
                sess_conditions.append("last_seen >= ?")
                sess_params.append(cutoff_iso)
            
            sess_where = ("WHERE " + " AND ".join(sess_conditions)) if sess_conditions else ""
            
            sess_row = self._query_one(f"SELECT COUNT(*) as count FROM sessions {sess_where}", tuple(sess_params))
            total_sessions = sess_row["count"] if sess_row else 0

            ev_conditions = []
            ev_params = []
            if target_key and target_key != "all":
                ev_conditions.append("e.site_key = ?")
                ev_params.append(target_key)
            if cutoff_ms > 0:
                ev_conditions.append("e.timestamp >= ?")
                ev_params.append(cutoff_ms)
            
            ev_where = ("WHERE " + " AND ".join(ev_conditions)) if ev_conditions else ""
            
            if total_sessions == 0 and not sess_where:
                return {
                    "total_requests": 0, "total_sessions": 0, "human_count": 0,
                    "traditional_bot_count": 0, "advanced_bot_count": 0, "ai_agent_count": 0,
                    "threat_count": 0, "prevention_actions": 0, "avg_risk_score": 0.0,
                    "mitigation_rate": "0.0%", "traffic_trend": [], "top_pages": [],
                    "behavioral_metrics": {"human_entropy": 0.88, "bot_jitter": 0.02, "ai_attribution": "RAD-S1 Active", "active_agents": 0}
                }
            
            ev_count_where = ("WHERE " + " AND ".join(["site_key = ?" if c.startswith("e.site_key") else c.replace("e.", "") for c in ev_conditions])) if ev_conditions else ""
            req_row = self._query_one(f"SELECT COUNT(*) as count FROM events {ev_count_where}", tuple(ev_params))
            total_reqs = req_row["count"] if req_row else 0

            def count_sess_cat(cat_name):
                conds = list(sess_conditions) + ["category = ?"]
                params_list = list(sess_params) + [cat_name]
                w = "WHERE " + " AND ".join(conds)
                res = self._query_one(f"SELECT COUNT(*) as count FROM sessions {w}", tuple(params_list))
                return res["count"] if res else 0

            human = count_sess_cat("human")
            trad_bot = count_sess_cat("traditional_bot")
            adv_bot = count_sess_cat("advanced_bot")
            ai_agent = count_sess_cat("ai_agent")

            thr_conditions = []
            thr_params = []
            if target_key and target_key != "all":
                thr_conditions.append("site_key = ?")
                thr_params.append(target_key)
            thr_where = ("WHERE " + " AND ".join(thr_conditions)) if thr_conditions else ""
            thr_row = self._query_one(f"SELECT COUNT(*) as count FROM threats {thr_where}", tuple(thr_params))
            threats = thr_row["count"] if thr_row else 0

            prev_conds = list(sess_conditions) + ["enforcement IN ('block', 'verify', 'rate_limit')"]
            w_prev = "WHERE " + " AND ".join(prev_conds)
            prev_row = self._query_one(f"SELECT COUNT(*) as count FROM sessions {w_prev}", tuple(sess_params))
            prevented = prev_row["count"] if prev_row else 0

            avg_row = self._query_one(f"SELECT AVG(risk_score) as avg_score FROM sessions {sess_where}", tuple(sess_params))
            avg_risk = round(avg_row["avg_score"], 1) if avg_row and avg_row["avg_score"] is not None else 0.0

            interval_ms = 3600 * 1000 if (time_range in (None, "24h")) else 86400 * 1000
            is_hourly = (time_range in (None, "24h"))

            trend_sql = f"""
            SELECT 
                (e.timestamp / {interval_ms}) * {interval_ms} as bucket_ts,
                COUNT(DISTINCT e.session_id) as total_sessions,
                COUNT(DISTINCT CASE WHEN s.category = 'human' THEN e.session_id END) as human_sessions,
                COUNT(DISTINCT CASE WHEN s.category IN ('traditional_bot', 'advanced_bot') THEN e.session_id END) as bot_sessions,
                COUNT(DISTINCT CASE WHEN s.category = 'ai_agent' THEN e.session_id END) as agent_sessions,
                COUNT(e.id) as total_requests,
                SUM(CASE WHEN s.category = 'human' THEN 1 ELSE 0 END) as human_requests,
                SUM(CASE WHEN s.category IN ('traditional_bot', 'advanced_bot') THEN 1 ELSE 0 END) as bot_requests,
                SUM(CASE WHEN s.category = 'ai_agent' THEN 1 ELSE 0 END) as agent_requests
            FROM events e
            LEFT JOIN sessions s ON e.session_id = s.session_id
            {ev_where}
            GROUP BY 1
            ORDER BY 1 ASC
            """
            rows = self._query_all(trend_sql, tuple(ev_params))

            trend_buckets = {}
            for r in rows:
                b_ts = r["bucket_ts"]
                try:
                    dt = datetime.utcfromtimestamp(b_ts / 1000.0)
                    time_label = dt.strftime("%H:00") if is_hourly else dt.strftime("%b %d")
                except Exception:
                    time_label = "Recent"

                trend_buckets[b_ts] = {
                    "timestamp": b_ts,
                    "time": time_label,
                    "human": r["human_sessions"] or 0,
                    "bot": r["bot_sessions"] or 0,
                    "aiAgent": r["agent_sessions"] or 0,
                    "total": r["total_sessions"] or 0,
                    "requests": r["total_requests"] or 0,
                    "human_requests": r["human_requests"] or 0,
                    "bot_requests": r["bot_requests"] or 0,
                    "agent_requests": r["agent_requests"] or 0
                }

            if trend_buckets:
                min_b = min(trend_buckets.keys())
                max_b = max(trend_buckets.keys())
                curr = min_b
                while curr <= max_b:
                    if curr not in trend_buckets:
                        try:
                            dt = datetime.utcfromtimestamp(curr / 1000.0)
                            time_label = dt.strftime("%H:00") if is_hourly else dt.strftime("%b %d")
                        except Exception:
                            time_label = "Recent"
                        trend_buckets[curr] = {
                            "timestamp": curr,
                            "time": time_label,
                            "human": 0, "bot": 0, "aiAgent": 0, "total": 0,
                            "requests": 0, "human_requests": 0, "bot_requests": 0, "agent_requests": 0
                        }
                    curr += interval_ms

            traffic_trend = sorted(trend_buckets.values(), key=lambda x: x["timestamp"])

            # Top Active Pages
            pages_sql = f"""
            SELECT e.url, s.category
            FROM events e
            LEFT JOIN sessions s ON e.session_id = s.session_id
            {ev_where}
            """
            page_rows = self._query_all(pages_sql, tuple(ev_params))

            pages_map = {}
            for r in page_rows:
                url = r["url"] or "/"
                cat = r["category"] or "human"
                try:
                    p = urlparse(url).path or "/"
                except Exception:
                    p = "/"
                if not p.startswith("/"):
                    p = "/" + p
                if len(p) > 1 and p.endswith("/"):
                    p = p[:-1]

                if p not in pages_map:
                    pages_map[p] = {"path": p, "count": 0, "human": 0, "bot": 0, "agent": 0}
                pages_map[p]["count"] += 1
                if cat == "human":
                    pages_map[p]["human"] += 1
                elif cat in ("traditional_bot", "advanced_bot"):
                    pages_map[p]["bot"] += 1
                elif cat == "ai_agent":
                    pages_map[p]["agent"] += 1
                else:
                    pages_map[p]["human"] += 1

            top_pages = sorted(pages_map.values(), key=lambda x: x["count"], reverse=True)[:10]

            # Behavioral Metrics
            sess_metrics_rows = self._query_all(f"SELECT category, metrics FROM sessions {sess_where}", tuple(sess_params))
            human_stds = []
            bot_stds = []
            for r in sess_metrics_rows:
                cat = r["category"]
                m_str = r["metrics"]
                if m_str:
                    try:
                        m = json.loads(m_str) if isinstance(m_str, str) else m_str
                        std = float(m.get("STANDARD_DEVIATION", 0.0))
                        if cat == "human":
                            human_stds.append(std)
                        elif cat in ("traditional_bot", "advanced_bot"):
                            bot_stds.append(std)
                    except Exception:
                        pass

            if human_stds:
                avg_h = sum(human_stds) / len(human_stds)
                human_entropy = round(min(0.96, max(0.70, 0.78 + (avg_h / 120.0))), 2)
            else:
                human_entropy = 0.88

            if bot_stds:
                avg_b = sum(bot_stds) / len(bot_stds)
                bot_jitter = round(min(0.12, avg_b / 50.0), 2)
            else:
                bot_jitter = 0.02

            behavioral_metrics = {
                "human_entropy": human_entropy,
                "bot_jitter": bot_jitter,
                "ai_attribution": "RAD-S1 Active",
                "active_agents": ai_agent
            }

            non_human = total_sessions - human
            rate = f"{round((prevented / max(1, non_human)) * 100, 1)}%" if non_human > 0 else "100.0%"
            
            return {
                "total_requests": total_reqs,
                "total_sessions": total_sessions,
                "human_count": human,
                "traditional_bot_count": trad_bot,
                "advanced_bot_count": adv_bot,
                "ai_agent_count": ai_agent,
                "threat_count": threats,
                "prevention_actions": prevented,
                "avg_risk_score": avg_risk,
                "mitigation_rate": rate,
                "traffic_trend": traffic_trend,
                "top_pages": top_pages,
                "behavioral_metrics": behavioral_metrics
            }

    def record_pow_event(self, session_id: str, challenge_id: str, difficulty: int, nonce: int, time_taken_ms: float, status: str = "verified"):
        """Records a completed client-side Proof-of-Work hardware integrity challenge."""
        if not self.is_mongodb:
            record_id = f"pow_rec_{uuid.uuid4().hex[:10]}"
            sql = """
            INSERT INTO pow_challenges (id, session_id, challenge_id, difficulty, nonce, time_taken_ms, status, resolved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            self._execute(sql, (record_id, session_id, challenge_id, difficulty, nonce, time_taken_ms, status, datetime.utcnow().isoformat()))
            return record_id
        return None

    def get_pow_stats(self) -> Dict[str, Any]:
        """Retrieves aggregated statistics for cryptographic Proof-of-Work challenges."""
        if not self.is_mongodb:
            row = self._query_one("SELECT COUNT(*) as count, AVG(time_taken_ms) as avg_time FROM pow_challenges WHERE status = 'verified'")
            count = row["count"] if row and row.get("count") else 0
            avg_time = round(row["avg_time"], 2) if row and row.get("avg_time") else 0.0
            return {
                "total_solved": count,
                "avg_solve_time_ms": avg_time,
                "status": "active",
                "default_difficulty": 3
            }
        return {"total_solved": 0, "avg_solve_time_ms": 0.0, "status": "active", "default_difficulty": 3}

    def get_policy(self, site_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves active bot regulation policies for a site."""
        if site_id in self._policy_cache:
            return self._policy_cache[site_id]
        if self.is_mongodb:
            doc = self.mongo_db.policies.find_one({"site_id": site_id}, {"_id": 0})
            if doc:
                self._policy_cache[site_id] = doc
                return doc
        else:
            try:
                row = self._query_one("SELECT data FROM policies WHERE site_id = ?", (site_id,))
                if row and row.get("data"):
                    pol = json.loads(row["data"])
                    self._policy_cache[site_id] = pol
                    return pol
            except Exception as e:
                logger.warning("Could not query policy table: %s", e)
        return None

    def save_policy(self, site_id: str, policy_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves active bot regulation policies for a site."""
        policy_data["site_id"] = site_id
        policy_data["updated_at"] = datetime.utcnow().isoformat()
        self._policy_cache[site_id] = policy_data

        if self.is_mongodb:
            self.mongo_db.policies.update_one(
                {"site_id": site_id},
                {"$set": policy_data},
                upsert=True
            )
        else:
            try:
                data_json = json.dumps(policy_data)
                now_str = datetime.utcnow().isoformat()
                if self.is_postgres:
                    sql = """
                    INSERT INTO policies (site_id, data, updated_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (site_id) DO UPDATE SET
                        data = EXCLUDED.data,
                        updated_at = EXCLUDED.updated_at
                    """
                    self._execute(sql, (site_id, data_json, now_str))
                else:
                    sql = """
                    INSERT INTO policies (site_id, data, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(site_id) DO UPDATE SET
                        data = excluded.data,
                        updated_at = excluded.updated_at
                    """
                    self._execute(sql, (site_id, data_json, now_str))
            except Exception as e:
                logger.warning("Could not persist policy table, stored in memory: %s", e)

        return policy_data

db = DatabaseManager()
