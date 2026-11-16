---
title: Botpulse AI Security Engine
emoji: 🛡️
colorFrom: green
colorTo: blue
sdk: gradio
app_file: app.py
pinned: false
---

# BotPulse — Next-Gen AI Bot Detection & Prevention Engine

Three-layer hybrid detection engine:
1. **Stage 1:** XGBoost Tabular Base Classifier (27 features, sub-millisecond screening)
2. **Stage 2:** Bidirectional LSTM Sequential Sequencer (PyTorch deep trajectory kinematics)
3. **Stage 3:** Resemble AI RAD-S1 Autonomous Agent Attribution Engine (Gemini & LLM signatures)

---

## 24/7 Cloud Deployment Guide (100% Free)

### Part A: Deploy Backend to Hugging Face Spaces (Free 16 GB RAM)
1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. Set Space name: `botpulse-api`.
3. Select **Space SDK: Gradio** (leave hardware as default **Free 2 vCPU · 16 GB RAM**).
4. Connect this GitHub repository (`subham240/Botpulse_Final`) or push your code.
5. Hugging Face will automatically read `app.py` and `requirements.txt` and boot the FastAPI backend 24/7.
6. Your live public API URL will be:
   `https://<your-hf-username>-botpulse-api.hf.space`

---

### Part B: Deploy Frontend to Vercel (Free 24/7 Global CDN)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New Project** → Import `subham240/Botpulse_Final`.
3. Framework Preset: **Vite** (Build command: `npm run build`, Output: `dist`).
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://<your-hf-username>-botpulse-api.hf.space/api/v1`
5. Click **Deploy**.

---

## Backend Configuration

Set `BOTPULSE_SECRET_KEY` in the environment to a secure random string:
```sh
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
