# 4. REST API Reference

The **BotPulse FastAPI Backend** exposes all versioned API routes under `/api/v1` (plus root aliases for health, SDK, and telemetry ingestion). Interactive OpenAPI / Swagger documentation is automatically served at **`/docs`** whenever the server is running.

---

## Base URLs & Authentication

- **Local Development:** `http://127.0.0.1:8000/api/v1`
- **Authentication Scheme:** JWT Bearer Token (`HS256`, 24-hour expiration)
  ```http
  Authorization: Bearer <access_token>
  ```
- Protected routes require a valid Bearer token obtained from `/api/v1/auth/login` or `/api/v1/auth/register`. Telemetry ingestion and public PoW endpoints are intentionally unauthenticated so client browsers and edge apps can call them using `site_key`.

---

## 1. System, Discovery & SDK

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api` or `/api/v1` | Public | API discovery metadata (service name, version, docs & health paths). |
| `GET` | `/health` or `/api/v1/health` | Public | Returns service status, active DB backend (`supabase_postgresql`, `mongodb`, or `sqlite_fallback`), and 3-layer ML model health overview. |
| `GET` | `/botpulse.js` or `/api/v1/botpulse.js` | Public | Serves the universal browser tracking SDK (`application/javascript`). |
| `GET` | `/docs` | Public | Interactive FastAPI Swagger UI. |

---

## 2. Authentication (`/api/v1/auth`)

Defined in `backend/routes/auth.py`.

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register a new SOC analyst account (bcrypt-hashed password) and return a JWT `access_token`. |
| `POST` | `/api/v1/auth/login` | Public | Authenticate with email/password and receive a JWT `access_token` + user profile. |
| `GET` | `/api/v1/auth/me` | Bearer | Return the currently authenticated analyst's profile. |

### Example: Login Request & Response

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "analyst@botpulse.io", "password": "botpulse2026!"}'
```

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr_seed_analyst",
    "email": "analyst@botpulse.io",
    "full_name": "Alexander Wright",
    "organization": "BotPulse Cyber Labs",
    "role": "owner",
    "created_at": "2026-11-18T12:00:00"
  }
}
```

---

## 3. Websites Management (`/api/v1/websites`)

Defined in `backend/routes/websites.py`. Manages protected domains and generates `site_id`, public `site_key` (`bp_pub_*`), and `secret_key` (`bp_sec_*`).

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/v1/websites` | Bearer | List websites owned by the authenticated user (auto-seeds default **ÉLVARA Fashion** site if empty). |
| `POST` | `/api/v1/websites` | Bearer | Register a new website (`{ "name": "...", "domain": "..." }`). |
| `GET` | `/api/v1/websites/{site_id}` | Bearer | Fetch website details by `site_id` or `site_key`. |
| `DELETE` | `/api/v1/websites/{site_id}` | Bearer | Delete a registered website owned by the current user. |

---

## 4. Telemetry Ingestion & AI Agent Testing

Defined in `backend/routes/events.py`. Mounted at both `/api/v1` and root `""` for compatibility.

| Method | Endpoint(s) | Auth | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/v1/events` *(aliases: `/events`, `/telemetry`, `/api/v1/telemetry/events`)* | Public (`site_key`) | Ingest a batch of behavioral telemetry events, run the 3-layer ML pipeline (XGBoost → BiLSTM → RAD-S1), persist session/events/threats, and return a signed Decision Token (+ optional PoW challenge). |
| `POST` | `/api/v1/events/test-agent` *(aliases: `/test-agent`, `/api/v1/telemetry/test-agent`)* | Public | Dedicated test harness to simulate an autonomous AI agent (e.g., Gemini, Claude, GPTBot) with optional API key attribution and verify Layer 3 RAD-S1 classification. |

### Example: Telemetry Ingestion Payload

```json
{
  "site_key": "bp_pub_alvera_live_7c4f19e",
  "session_id": "sess_demo_001",
  "visitor_id": "vis_demo_001",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0",
  "events": [
    {
      "event_type": "page_view",
      "url": "https://elvara-fashion.vercel.app/collections",
      "timestamp": 1731932000000,
      "sequence_num": 1,
      "payload": { "path": "/collections" }
    },
    {
      "event_type": "mouse_move",
      "url": "https://elvara-fashion.vercel.app/collections",
      "timestamp": 1731932000120,
      "sequence_num": 2,
      "payload": { "x": 420, "y": 310 }
    }
  ]
}
```

### Example: DecisionResponse

```json
{
  "action": "allow",
  "risk_score": 8.4,
  "risk_level": "low",
  "predicted_label": "Human",
  "confidence": 0.958,
  "decision_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "reasons": ["VERIFIED_NATURAL_HUMAN_KINEMATICS"],
  "pow_challenge": null
}
```

### Example: Testing AI Agent Attribution

```bash
curl -X POST http://127.0.0.1:8000/api/v1/events/test-agent \
  -H "Content-Type: application/json" \
  -d '{
    "agent_family": "gemini",
    "gemini_api_key": "AIzaSyDemoGeminiAttributionKey1234567890"
  }'
```

---

## 5. SOC Dashboard Analytics (`/api/v1/dashboard`)

Defined in `backend/routes/dashboard.py`. All metrics reflect real persisted records (true zero-state when no traffic has arrived).

| Method | Endpoint | Query Params | Description |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/stats` | `site_key`, `domain`, `range` (`24h`) | Aggregated counts (`total_requests`, `total_sessions`, `human_count`, `traditional_bot_count`, `advanced_bot_count`, `ai_agent_count`, `threat_count`, `prevention_actions`, `avg_risk_score`, `mitigation_rate`), `traffic_trend`, `top_pages`, and `behavioral_metrics`. |
| `GET` | `/api/v1/dashboard/live` | `site_key`, `limit` (`50`) | Recent live telemetry events streamed from protected sites. |
| `GET` | `/api/v1/dashboard/sessions` | `site_key`, `limit` (`50`) | Visitor sessions including risk scores, reason codes, metrics, and last 40 cursor coordinates for 2D replay. |
| `GET` | `/api/v1/dashboard/threats` | `site_key`, `limit` (`50`) | High/critical malicious bot incidents and anomalies. |
| `PATCH` | `/api/v1/dashboard/threats/{threat_id}` | — | Update threat status (`{ "status": "investigating" \| "confirmed" \| "resolved" \| "false_positive" }`). |
| `GET` | `/api/v1/dashboard/layers` | — | Per-layer operational health, status, latency, invocation counts, and anomaly counts for `xgboost`, `lstm`, and `rad_s1`. |
| `GET` | `/api/v1/dashboard/model-health` | — | Overall ML pipeline health wrapper (`{ "status": "healthy", "layers": ... }`). |
| `GET` | `/api/v1/dashboard/agents` | — | Filtered list of detected autonomous AI agent sessions (`category == "ai_agent"`). |
| `GET` | `/api/v1/dashboard/prevention` | `site_key` | Summary of allowed, blocked, rate-limited decisions and mitigation rate. |
| `GET` | `/api/v1/dashboard/integrations` | — | Integration status and SDK metadata for the default protected storefront (**ÉLVARA Fashion**). |

---

## 6. Prevention, Policies, PoW & Resemble.AI

Defined in `backend/routes/prevention.py`.

| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `POST` | `/api/v1/enforce/feedback` *(alias: `/api/v1/risk/enforcement-feedback`)* | Server-to-server enforcement confirmation logged by protected applications (`decision_id`, `site_id`, `session_id`, `action`, `endpoint`, `enforcement_result`, `http_status_code`). |
| `GET` | `/api/v1/prevention/policies` | Fetch saved `PreventionPolicy` for `?site_id=site_alvera_001` (thresholds, rate limits, PoW difficulty `2–5`, headless/scraper toggles, blocklists). |
| `PUT` / `POST` | `/api/v1/prevention/policies` | Save updated `PreventionPolicy` for a site (strictly validates `pow_difficulty` within `2–5`). |
| `POST` | `/api/v1/prevention/pow/challenge` | Generate an HMAC-signed SHA-256 Proof-of-Work challenge (`?difficulty=3&site_id=site_alvera_001`). |
| `POST` | `/api/v1/prevention/pow/verify` | Verify a solved PoW nonce, enforce replay protection & session binding, and issue an upgraded `ALLOW` Decision Token. |
| `GET` | `/api/v1/prevention/pow/stats` | Aggregated PoW solve count and average solve latency (`?site_id=site_alvera_001`). |
| `GET` | `/api/v1/resemble/status` | Check server-side connectivity to Resemble.AI RAD-S1 API (`RESEMBLE_API_TOKEN`). |
| `GET` | `/api/v1/resemble/session/{resemble_sid}` | Server-side lookup of a settled Resemble.AI session verdict (`settled`, `visitor_class`, `p_person`, `action`). |
| `POST` | `/api/v1/resemble/sync` | Pull up to 50 recent settled Human/Agent sessions from Resemble.AI into BotPulse's database. |
