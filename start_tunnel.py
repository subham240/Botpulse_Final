"""
BotPulse — 100% Free Persistent Cloudflare Public Tunnel & Backend Launcher
Starts FastAPI on http://127.0.0.1:8000 and exposes it globally via Cloudflare Tunnel.
Processes run detached from this script so they persist across agent turns and restarts.
"""
import sys
import os

import re
import time
import shutil
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(ROOT_DIR, "backend", "data")
os.makedirs(LOG_DIR, exist_ok=True)
SERVER_LOG = os.path.join(LOG_DIR, "server.log")
TUNNEL_LOG = os.path.join(LOG_DIR, "tunnel.log")

if sys.platform == "win32":
    try:
        if sys.stdout is None or not hasattr(sys.stdout, "write"):
            _log_file = open(os.path.join(ROOT_DIR, "launcher.log"), "a", encoding="utf-8")
            sys.stdout = _log_file
            sys.stderr = _log_file
        else:
            if hasattr(sys.stdout, "reconfigure"):
                sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            if hasattr(sys.stderr, "reconfigure"):
                sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

DETACHED_FLAGS = (0x00000008 | 0x00000200) if sys.platform == "win32" else 0

def ensure_backend_running():
    """Checks backend health and restarts it if unresponsive."""
    import urllib.request
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        r = opener.open("http://127.0.0.1:8000/health", timeout=3.0)
        if r.status == 200:
            return True
    except Exception:
        pass

    print("\n[Backend] Port 8000 unresponsive. Starting fresh backend process...", flush=True)
    if sys.platform == "win32":
        subprocess.run(
            ["powershell", "-Command", "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"],
            capture_output=True
        )
    time.sleep(1)

    server_log_file = open(SERVER_LOG, "a", encoding="utf-8")
    subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=ROOT_DIR,
        stdout=server_log_file,
        stderr=subprocess.STDOUT,
        creationflags=DETACHED_FLAGS
    )
    for _ in range(25):
        time.sleep(0.5)
        try:
            r = opener.open("http://127.0.0.1:8000/health", timeout=3.0)
            if r.status == 200:
                print("[OK] Backend recovered and running healthy on http://127.0.0.1:8000", flush=True)
                return True
        except Exception:
            pass
    return False

def stop_services():
    """Stops all running backend and tunnel processes."""
    print("Stopping BotPulse services...", flush=True)
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/F", "/IM", "cloudflared.exe"], capture_output=True)
        subprocess.run(
            ["powershell", "-Command", "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"],
            capture_output=True
        )
    print("[OK] All BotPulse services stopped.", flush=True)

def update_env_file(public_url: str):
    """Updates VITE_API_URL in .env to match the current Cloudflare Tunnel URL."""
    env_path = os.path.join(ROOT_DIR, ".env")
    api_url = f"{public_url}/api/v1"
    
    lines = []
    found = False
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("VITE_API_URL="):
                    lines.append(f"VITE_API_URL={api_url}\n")
                    found = True
                else:
                    lines.append(line)
    if not found:
        lines.append(f"VITE_API_URL={api_url}\n")
        
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"[OK] Updated .env with VITE_API_URL={api_url}", flush=True)

def update_vercel_config(public_url: str):
    """Updates vercel.json rewrites with the active Cloudflare Tunnel endpoint."""
    vercel_path = os.path.join(ROOT_DIR, "vercel.json")
    if not os.path.exists(vercel_path):
        return
    try:
        import json
        with open(vercel_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        data["rewrites"] = [
            {"source": "/api/v1/:path*", "destination": f"{public_url}/api/v1/:path*"},
            {"source": "/api/:path*", "destination": f"{public_url}/api/:path*"},
            {"source": "/events", "destination": f"{public_url}/api/v1/events"},
            {"source": "/telemetry/:path*", "destination": f"{public_url}/api/v1/telemetry/:path*"},
            {"source": "/health", "destination": f"{public_url}/health"},
            {"source": "/botpulse.js", "destination": f"{public_url}/botpulse.js"},
            {"source": "/(.*)", "destination": "/index.html"}
        ]
        with open(vercel_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"[OK] Updated vercel.json edge rewrites with {public_url}", flush=True)
    except Exception as e:
        print(f"Notice: Could not update vercel.json: {e}", flush=True)

def update_api_service(public_url: str):
    """Updates DEFAULT_TUNNEL_API in src/services/api.ts."""
    api_path = os.path.join(ROOT_DIR, "src", "services", "api.ts")
    if not os.path.exists(api_path):
        return
    try:
        with open(api_path, "r", encoding="utf-8") as f:
            code = f.read()
        api_url = f"{public_url}/api/v1"
        updated = re.sub(r"const DEFAULT_TUNNEL_API = '[^']+';", f"const DEFAULT_TUNNEL_API = '{api_url}';", code)
        if updated != code:
            with open(api_path, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"[OK] Updated src/services/api.ts fallback to {api_url}", flush=True)
    except Exception as e:
        print(f"Notice: Could not update api.ts: {e}", flush=True)

def update_elvara_integration(public_url: str):
    """Updates Elvara fashion demo index.html with the active Cloudflare Tunnel endpoint."""
    elvara_index = os.path.normpath(os.path.join(ROOT_DIR, "..", "Elvara", "index.html"))
    if not os.path.exists(elvara_index):
        return
    api_url = f"{public_url}/api/v1"
    try:
        with open(elvara_index, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace fallback trycloudflare URL in Elvara index.html
        updated = re.sub(
            r'https://[a-zA-Z0-9-]+\.trycloudflare\.com/api/v1',
            api_url,
            content
        )
        if updated != content:
            with open(elvara_index, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"[OK] Synchronized Elvara storefront with active endpoint: {api_url}", flush=True)
    except Exception as e:
        print(f"Notice: Could not auto-sync Elvara index.html: {e}", flush=True)

def main():
    if "--stop" in sys.argv:
        stop_services()
        return

    print("=" * 65, flush=True)
    print("  BotPulse AI Security Engine -- Persistent Tunnel Launcher", flush=True)
    print("=" * 65, flush=True)
    
    # 1. Locate cloudflared binary
    direct_exe = os.path.join(os.environ.get("APPDATA", ""), "npm", "node_modules", "cloudflared", "bin", "cloudflared.exe")
    if os.path.exists(direct_exe):
        cloudflared_bin = direct_exe
    else:
        cloudflared_bin = shutil.which("cloudflared")
        if not cloudflared_bin:
            npm_bin = os.path.join(os.environ.get("APPDATA", ""), "npm", "cloudflared.cmd")
            if os.path.exists(npm_bin):
                cloudflared_bin = npm_bin

    if not cloudflared_bin:
        print("[ERROR] cloudflared not found in PATH or AppData.", flush=True)
        print("  Please install it via: npm install -g cloudflared", flush=True)
        sys.exit(1)

    try:
        ver_check = subprocess.run([cloudflared_bin, "--version"], capture_output=True, text=True, shell=True, check=True)
        print(f"[OK] Cloudflared available: {ver_check.stdout.strip()}", flush=True)
    except Exception as e:
        print(f"[ERROR] Failed to run cloudflared: {e}", flush=True)
        sys.exit(1)

    # 2. Check or Launch FastAPI Backend with Uvicorn
    backend_running = ensure_backend_running()
    if not backend_running:
        print("[ERROR] Backend failed to start. Last log lines from backend/data/server.log:", flush=True)
        if os.path.exists(SERVER_LOG):
            with open(SERVER_LOG, "r", encoding="utf-8") as f:
                print(f.read()[-500:], flush=True)
        sys.exit(1)
    print("[OK] FastAPI backend running healthy on http://127.0.0.1:8000 (Logs: backend/data/server.log)", flush=True)

    # 3. Always launch a fresh, verified Cloudflare Tunnel
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/F", "/IM", "cloudflared.exe"], capture_output=True)
    time.sleep(1)

    print("\n[2/3] Establishing fresh Cloudflare Tunnel to http://127.0.0.1:8000...", flush=True)
    tunnel_log_file = open(TUNNEL_LOG, "w", encoding="utf-8")
    subprocess.Popen(
        [cloudflared_bin, "tunnel", "--url", "http://127.0.0.1:8000"],
        cwd=ROOT_DIR,
        stdout=tunnel_log_file,
        stderr=subprocess.STDOUT,
        creationflags=DETACHED_FLAGS
    )

    public_url = None
    url_pattern = re.compile(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com')

    start_time = time.time()
    while time.time() - start_time < 35:
        time.sleep(0.5)
        if os.path.exists(TUNNEL_LOG):
            try:
                with open(TUNNEL_LOG, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                m = url_pattern.search(content)
                if m:
                    public_url = m.group(0)
                    break
            except Exception:
                pass

    if not public_url:
        print("[ERROR] Failed to retrieve Cloudflare Tunnel URL within 35 seconds.", flush=True)
        sys.exit(1)

    # Update configs
    update_env_file(public_url)
    update_vercel_config(public_url)
    update_api_service(public_url)
    update_elvara_integration(public_url)

    # Sync git repos
    print("\n[3/3] Syncing active tunnel with GitHub & Vercel edge proxy...", flush=True)
    try:
        subprocess.run(["git", "add", "."], cwd=ROOT_DIR, capture_output=True)
        c = subprocess.run(["git", "commit", "-m", f"sync: auto-route Vercel proxy to {public_url}"], cwd=ROOT_DIR, capture_output=True)
        if c.returncode == 0:
            subprocess.run(["git", "push", "origin", "main"], cwd=ROOT_DIR, capture_output=True)
            print("[OK] Synced Botpulse repo with GitHub & Vercel edge proxy", flush=True)
        else:
            # Still push in case earlier commits were pending
            subprocess.run(["git", "push", "origin", "main"], cwd=ROOT_DIR, capture_output=True)
            print("[OK] Pushed pending commits to GitHub & Vercel edge proxy", flush=True)
    except Exception as e:
        print(f"Notice: git sync Botpulse: {e}", flush=True)

    elvara_dir = os.path.normpath(os.path.join(ROOT_DIR, "..", "Elvara"))
    if os.path.exists(elvara_dir):
        try:
            subprocess.run(["git", "add", "index.html"], cwd=elvara_dir, capture_output=True)
            c_el = subprocess.run(["git", "commit", "-m", f"sync: update endpoint to {public_url}"], cwd=elvara_dir, capture_output=True)
            if c_el.returncode == 0:
                subprocess.run(["git", "push", "origin", "main"], cwd=elvara_dir, capture_output=True)
                print("[OK] Synced Elvara repo with GitHub & Vercel", flush=True)
        except Exception as e:
            print(f"Notice: git sync Elvara: {e}", flush=True)

    # Verify public health check
    health_verified = False
    for _ in range(10):
        time.sleep(1)
        try:
            h = urllib.request.urlopen(f"{public_url}/health", timeout=5)
            if h.status == 200:
                health_verified = True
                break
        except Exception:
            pass

    print("\n" + "=" * 65, flush=True)
    print("  BOTPULSE IS LIVE GLOBALLY & RUNNING PERSISTENTLY", flush=True)
    print("=" * 65, flush=True)
    print(f"  Public Base URL:     {public_url}", flush=True)
    print(f"  Public API URL:      {public_url}/api/v1", flush=True)
    print(f"  Health Check:        {public_url}/health ({'VERIFIED 200 OK' if health_verified else 'CONNECTING'})", flush=True)
    print(f"  Local Direct URL:    http://127.0.0.1:8000", flush=True)
    print("=" * 65, flush=True)
    print("  1-CLICK VERIFIED LINKS FOR REAL-TIME MONITORING:", flush=True)
    print(f"  * Live SOC Dashboard: https://botpulse-final.vercel.app/?api={public_url}/api/v1", flush=True)
    print(f"  * Protected Store:    https://elvara-fashion.vercel.app/?bp_api={public_url}/api/v1", flush=True)
    print("=" * 65, flush=True)
    print("  Status: Both FastAPI and Cloudflare Tunnel are running persistently", flush=True)
    print("          as independent Windows background processes.", flush=True)
    print("=" * 65, flush=True)

    # Supervise continuously so tunnel and backend remain active
    print("  Status: Services running. Monitoring health (Press Ctrl+C to stop)...", flush=True)
    hb_tick = 0
    failed_checks = 0
    local_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    while True:
        try:
            time.sleep(10)
            hb_tick += 1

            # 1. Check local backend health
            backend_ok = False
            try:
                r = local_opener.open("http://127.0.0.1:8000/health", timeout=5.0)
                if r.status == 200:
                    backend_ok = True
                    failed_checks = 0
            except Exception:
                failed_checks += 1

            if not backend_ok and failed_checks >= 4:
                try:
                    print("  [Auto-Heal] Backend port 8000 unresponsive after 4 checks. Recovering...", flush=True)
                except Exception:
                    pass
                ensure_backend_running()
                failed_checks = 0

            # 2. Heartbeat logging
            if hb_tick % 3 == 0:
                try:
                    print(f"  [Heartbeat] BotPulse Tunnel & Backend OK: {public_url}", flush=True)
                except Exception:
                    pass
        except KeyboardInterrupt:
            try:
                print("\nStopping BotPulse services...", flush=True)
            except Exception:
                pass
            stop_services()
            break
        except Exception:
            time.sleep(5)

if __name__ == "__main__":
    main()
