# 6. Local Setup, Model Training & Deployment Guide

Follow this step-by-step guide to run **BotPulse** on your own machine, test every detection layer, retrain models, or deploy to the cloud.

---

## Prerequisites

- **Python 3.11+** (recommended; matches `Dockerfile`)
- **Node.js 18+ & npm** (for the React 19 / Vite frontend)
- **Optional:** PyTorch (`torch`) if you want native Stage 2 BiLSTM neural inference locally (without PyTorch, Stage 2 automatically runs its kinematic heuristic fallback)
- **Optional:** A free [Supabase](https://supabase.com) PostgreSQL database (without it, BotPulse uses embedded SQLite automatically with zero setup)

---

## 1. Local Development Quick Start

### Step 1: Clone & Configure Environment

```bash
git clone <your-repo-url>
cd Botpulse
cp .env.example .env
```

Generate a strong 32+ character `BOTPULSE_SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Update `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
BOTPULSE_SECRET_KEY=<your-generated-secret-key>

# Optional: Leave blank to use automatic embedded SQLite (backend/data/botpulse.db)
# SUPABASE_DB_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Optional: Enable server-side Resemble.AI RAD-S1 session verification
# RESEMBLE_API_TOKEN=your_resemble_api_token
# RESEMBLE_SITE_ID=76
```

### Step 2: Start the FastAPI Backend

```bash
# Create & activate a virtual environment (recommended)
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# (Optional) Install CPU PyTorch to activate neural Stage 2 BiLSTM inference
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Run the backend server on http://127.0.0.1:8000
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Verify the backend is healthy:
- Health endpoint: `http://127.0.0.1:8000/health`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Browser SDK: `http://127.0.0.1:8000/botpulse.js`

### Step 3: Start the React SOC Frontend

In a second terminal:

```bash
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

### Default Demo Credentials

The database seeds a ready-to-use SOC Analyst account and a default protected website (**ÉLVARA Fashion**):

- **Email:** `analyst@botpulse.io`
- **Password:** `botpulse2026!`
- **Default Site ID:** `site_alvera_001`
- **Default Site Key:** `bp_pub_alvera_live_7c4f19e`

---

## 2. Verifying the 3-Layer Pipeline Locally

Once the backend is running, you can test all three traffic classes directly via `curl` or Swagger UI (`/docs`):

### Test A: Simulate an Authenticated Google Gemini AI Agent (Stage 3 RAD-S1)

```bash
curl -X POST http://127.0.0.1:8000/api/v1/events/test-agent \
  -H "Content-Type: application/json" \
  -d '{
    "agent_family": "gemini",
    "gemini_api_key": "AIzaSyDemoGeminiAttributionKey1234567890"
  }'
```
Expected result: `predicted_label: "AI Agent"`, `action: "allow"`, `risk_score: 18.0`, reason `VALID_GEMINI_API_KEY`.

### Test B: Simulate a Headless Automated Bot (Stage 1 XGBoost)

```bash
curl -X POST http://127.0.0.1:8000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "site_key": "bp_pub_alvera_live_7c4f19e",
    "session_id": "sess_bot_test_01",
    "user_agent": "Mozilla/5.0 HeadlessChrome/120.0 Puppeteer",
    "events": [
      {"event_type": "click", "url": "https://elvara-fashion.vercel.app/cart", "timestamp": 1731932000000},
      {"event_type": "click", "url": "https://elvara-fashion.vercel.app/cart", "timestamp": 1731932000010},
      {"event_type": "click", "url": "https://elvara-fashion.vercel.app/cart", "timestamp": 1731932000020},
      {"event_type": "click", "url": "https://elvara-fashion.vercel.app/cart", "timestamp": 1731932000030}
    ]
  }'
```
Expected result: `predicted_label: "Traditional Bot"`, high/critical risk score, `rate_limit` or `block` action, and a new entry on `/app/threats`.

---

## 3. Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `BOTPULSE_SECRET_KEY` | **Yes (Prod)** | Dev fallback in `config.py` | Minimum 32-character secret for signing User JWTs, Decision Tokens (`HS256`), and PoW challenge HMACs. |
| `VITE_API_URL` | Frontend | `http://127.0.0.1:8000/api/v1` | Backend API base URL consumed by Vite during local development/builds. |
| `SUPABASE_DB_URL` | Optional | `None` | PostgreSQL connection string (direct or pooler URI). Enables Tier 1 Supabase Cloud storage. |
| `SUPABASE_URL` / `SUPABASE_KEY` | Optional | `None` | Supabase HTTPS REST URL & API key (optional metadata/tools). |
| `MONGODB_URI` | Optional | `mongodb://localhost:27017` | Enables Tier 2 MongoDB storage if PostgreSQL is not configured. |
| `RESEMBLE_API_TOKEN` | Optional | `None` | Server-side bearer token for authoritative Resemble.AI RAD-S1 session lookups & sync. |
| `RESEMBLE_SITE_ID` | Optional | `76` | Resemble.AI site ID used during `/api/v1/resemble/sync`. |
| `DATA_DIR` | Optional | `backend/data` (`/tmp` on Vercel) | Directory where `botpulse.db` SQLite file and runtime logs are stored. |
| `PORT` | Optional | `8000` (`7860` in `app.py`) | Listening port for Uvicorn. |

---

## 4. Database Setup & Migration (Supabase)

1. Open your Supabase project → **SQL Editor** → paste and run `supabase/schema.sql`.
   This creates all 8 tables, performance indexes, Row Level Security (RLS) policies, and seed records.
2. *(Optional)* Migrate existing local SQLite data to Supabase in one command:
   ```bash
   python scripts/migrate_to_supabase.py "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
   ```

---

## 5. Retraining the Stage 2 BiLSTM Model

The pre-trained weights (`backend/models/lstm.pt`) and scaler (`backend/models/lstm_scaler.joblib`) are already committed in the repository. To retrain Stage 2 from scratch on the M4D Web Bot Detection Dataset (Phase 1 & Phase 2):

1. Place the dataset directory at the path configured in `DATASET_DIR` inside `backend/ml/train_lstm.py` (or update `DATASET_DIR`).
2. Run:
   ```bash
   python backend/ml/train_lstm.py
   ```
3. Outputs saved automatically to `backend/models/`:
   - `lstm.pt` — Trained PyTorch `BiLSTMBehavioralClassifier` weights
   - `lstm_scaler.joblib` — Fitted `RobustScaler` over the 9 kinematic features
   - `lstm_training_report.json` — Accuracy, precision, recall, F1, ROC-AUC, and latency report

---

## 6. Deployment Options

### Option A: Docker (Unified Backend + Pre-Built Frontend)

The included `Dockerfile` packages the FastAPI engine together with the compiled `dist/` frontend bundle:

```bash
npm run build
docker build -t botpulse-engine .
docker run -p 8000:8000 \
  -e BOTPULSE_SECRET_KEY="your-32-char-random-secret-key-here" \
  -e SUPABASE_DB_URL="postgresql://..." \
  botpulse-engine
```

### Option B: Hugging Face Spaces (Backend) + Vercel (Frontend)

1. **Backend on Hugging Face Spaces (Free 2 vCPU · 16 GB RAM):**
   - Create a new Space using the **Gradio** SDK and connect this repository.
   - `app.py` mounts the full FastAPI application alongside a live Gradio status UI at `/` on port `7860`.
   - Set `BOTPULSE_SECRET_KEY` (and optional `SUPABASE_DB_URL` / `RESEMBLE_API_TOKEN`) under Space **Secrets**.
2. **Frontend on Vercel:**
   - Import the repository with preset **Vite** (`npm run build`, output `dist`).
   - Either set `VITE_API_URL` to your deployed backend URL or update the proxy rewrite destination in `vercel.json` to point to your backend host.

### Option C: Local Backend + Free Public Cloudflare Tunnel

For quick live demos from your laptop to an external site (like ÉLVARA Fashion):

```bash
python start_tunnel.py
# Or on Windows: double-click start_tunnel.bat
```

This boots Uvicorn on `127.0.0.1:8000` and opens a public `*.trycloudflare.com` HTTPS tunnel. You can then open the dashboard with `?api=https://<tunnel-host>/api/v1` to connect instantly.

---

## 7. Troubleshooting

| Issue | Cause & Fix |
| :--- | :--- |
| **`LSTM` shows heuristic fallback in logs** | PyTorch (`torch`) is not installed in the active Python environment. Install CPU PyTorch (`pip install torch --index-url https://download.pytorch.org/whl/cpu`) to enable neural BiLSTM weights (`lstm.pt`). |
| **`XGBoost` fails to load on Linux / Docker** | Missing OpenMP runtime (`libgomp1`). The `Dockerfile` installs `libgomp1` automatically; on bare Linux run `sudo apt-get install libgomp1`. |
| **Frontend shows Mixed Content / network error on HTTPS** | Ensure `vercel.json` rewrites point to an HTTPS/accessible backend, or clear stale overrides via `localStorage.removeItem('bp_api_url')` in browser DevTools. |
| **Database falls back to SQLite** | Check `GET /health` (`database` field). If `SUPABASE_DB_URL` is unreachable within 0.8 s, `DatabaseManager` intentionally falls back to `backend/data/botpulse.db` to stay online. |
| **PoW verification returns `CHALLENGE_ALREADY_USED` or `CHALLENGE_EXPIRED`** | Expected anti-replay security behavior—each PoW challenge is single-use and valid for 90 seconds. Request a fresh challenge via `POST /api/v1/prevention/pow/challenge`. |
