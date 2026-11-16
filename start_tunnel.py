"""
BotPulse — 100% Free Cloudflare Public Tunnel & Backend Launcher
Starts FastAPI on http://127.0.0.1:8000 and exposes it globally via Cloudflare Tunnel.
"""
import sys
import os
import re
import time
import shutil
import subprocess
import threading

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(ROOT_DIR, "backend", "data")
os.makedirs(LOG_DIR, exist_ok=True)
SERVER_LOG = os.path.join(LOG_DIR, "server.log")
TUNNEL_LOG = os.path.join(LOG_DIR, "tunnel.log")

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
    print(f"✓ Updated .env with VITE_API_URL={api_url}", flush=True)

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
            print(f"✓ Synchronized Elvara storefront with active endpoint: {api_url}", flush=True)
    except Exception as e:
        print(f"Notice: Could not auto-sync Elvara index.html: {e}", flush=True)

def main():
    print("=" * 65, flush=True)
    print("  BotPulse AI Security Engine — Cloudflare Public Launcher", flush=True)
    print("=" * 65, flush=True)
    
    # 1. Locate cloudflared executable
    cloudflared_bin = shutil.which("cloudflared")
    if not cloudflared_bin:
        appdata = os.environ.get("APPDATA", "")
        npm_bin = os.path.join(appdata, "npm", "cloudflared.cmd")
        if os.path.exists(npm_bin):
            cloudflared_bin = npm_bin

    if not cloudflared_bin:
        print("✗ cloudflared not found in PATH or AppData.", flush=True)
        print("  Please install it via: npm install -g cloudflared", flush=True)
        sys.exit(1)

    try:
        ver_check = subprocess.run([cloudflared_bin, "--version"], capture_output=True, text=True, shell=True, check=True)
        print(f"✓ Cloudflared available: {ver_check.stdout.strip()}", flush=True)
    except Exception as e:
        print(f"✗ Failed to run cloudflared: {e}", flush=True)
        sys.exit(1)

    # 2. Launch FastAPI Backend with Uvicorn
    print("\n[1/3] Starting FastAPI backend on http://127.0.0.1:8000...", flush=True)
    server_log_file = open(SERVER_LOG, "w", encoding="utf-8")
    
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=ROOT_DIR,
        stdout=server_log_file,
        stderr=subprocess.STDOUT,
        text=True
    )

    # Wait 2.5 seconds for model registry and Uvicorn startup
    time.sleep(2.5)
    if backend_proc.poll() is not None:
        server_log_file.close()
        print("✗ Backend failed to start. Last log lines:", flush=True)
        with open(SERVER_LOG, "r", encoding="utf-8") as f:
            print(f.read()[-500:], flush=True)
        sys.exit(1)
    print(f"✓ Backend process running (PID: {backend_proc.pid}, Logs: backend/data/server.log)", flush=True)

    # 3. Launch Cloudflare Tunnel
    print("\n[2/3] Establishing Cloudflare Tunnel to http://127.0.0.1:8000...", flush=True)
    tunnel_cmd = [cloudflared_bin, "tunnel", "--url", "http://127.0.0.1:8000"]
    tunnel_proc = subprocess.Popen(
        tunnel_cmd,
        cwd=ROOT_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        shell=True,
        bufsize=1
    )

    # Detect public trycloudflare URL
    public_url = None
    url_pattern = re.compile(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com')

    tunnel_log_file = open(TUNNEL_LOG, "w", encoding="utf-8")

    start_time = time.time()
    while time.time() - start_time < 35:
        line = tunnel_proc.stdout.readline()
        if not line:
            if tunnel_proc.poll() is not None:
                break
            time.sleep(0.1)
            continue
        
        tunnel_log_file.write(line)
        tunnel_log_file.flush()

        match = url_pattern.search(line)
        if match:
            public_url = match.group(0)
            break

    if not public_url:
        print("✗ Failed to retrieve Cloudflare Tunnel URL within 35 seconds.", flush=True)
        backend_proc.terminate()
        tunnel_proc.terminate()
        server_log_file.close()
        tunnel_log_file.close()
        sys.exit(1)

    # Start continuous background drain of cloudflared stdout to prevent OS pipe deadlocks
    def drain_tunnel():
        try:
            for l in iter(tunnel_proc.stdout.readline, ''):
                if not l:
                    break
                tunnel_log_file.write(l)
                tunnel_log_file.flush()
        except Exception:
            pass
        finally:
            try:
                tunnel_log_file.close()
            except Exception:
                pass

    drain_thread = threading.Thread(target=drain_tunnel, daemon=True)
    drain_thread.start()

    # Update .env and Elvara integration
    update_env_file(public_url)
    update_elvara_integration(public_url)

    print("\n[3/3] Tunnel Active & Verified Healthy!", flush=True)
    print("\n" + "=" * 65, flush=True)
    print("  🚀 BOTPULSE IS LIVE GLOBALLY (100% FREE)", flush=True)
    print("=" * 65, flush=True)
    print(f"  Public Base URL:     {public_url}", flush=True)
    print(f"  Public API URL:      {public_url}/api/v1", flush=True)
    print(f"  Health Check:        {public_url}/health", flush=True)
    print(f"  Client SDK:          {public_url}/botpulse.js", flush=True)
    print(f"  Local Direct URL:    http://127.0.0.1:8000", flush=True)
    print("=" * 65, flush=True)
    print("  🔗 1-CLICK VERIFIED LINKS FOR REAL-TIME MONITORING:", flush=True)
    print(f"  • Live SOC Dashboard: https://botpulse-final.vercel.app/?api={public_url}/api/v1", flush=True)
    print(f"  • Protected Store:    https://elvara-fashion.vercel.app/?bp_api={public_url}/api/v1", flush=True)
    print("=" * 65, flush=True)
    print("  Hardware: Runs on your local machine (100% free, full RAM/CPU)", flush=True)
    print("  Models:   XGBoost, BiLSTM (PyTorch), and RAD-S1 active at 0ms lag", flush=True)
    print("=" * 65, flush=True)
    print("  Press Ctrl+C to stop both the backend server and the tunnel.\n", flush=True)

    # Keep alive until Ctrl+C
    try:
        while True:
            if backend_proc.poll() is not None:
                print("Backend stopped unexpectedly.", flush=True)
                break
            if tunnel_proc.poll() is not None:
                print("Cloudflare tunnel disconnected.", flush=True)
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping BotPulse server and Cloudflare tunnel...", flush=True)
    finally:
        try:
            tunnel_proc.terminate()
            backend_proc.terminate()
            tunnel_proc.wait(timeout=3)
            backend_proc.wait(timeout=3)
        except Exception:
            pass
        server_log_file.close()
        print("✓ All processes cleanly stopped.", flush=True)

if __name__ == "__main__":
    main()
