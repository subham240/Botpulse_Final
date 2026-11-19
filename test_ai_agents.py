#!/usr/bin/env python3
"""
========================================================================================
  BotPulse & ÉLVARA Fashion -- Real AI Agent Detection & Verification Test Suite
========================================================================================
This standalone CLI tool tests real autonomous AI agents against the live ÉLVARA Fashion
storefront (https://elvara-fashion.vercel.app) and the BotPulse AI Security Engine
(https://botpulse-final.vercel.app/api/v1).

Tested Agent Personas:
  1. Google Gemini Autonomous Agent (API Key attribution + declared headers)
  2. Anthropic Claude Web Agent (Autonomous crawler/agent)
  3. OpenAI GPTBot & ChatGPT Browsing Agent
  4. Perplexity AI Search & Synthesis Agent
  5. Malicious Headless Scraper / Bot (Scrapy / Headless Chrome - High Risk Burst)
  6. Natural Human Visitor Baseline (Low Risk)
  7. Real Interactive Browser Agent (Playwright driving real Chromium on Elvara)

Usage:
  # Run all terminal-based AI agent tests:
  python test_ai_agents.py

  # Test a specific AI agent:
  python test_ai_agents.py --agent gemini
  python test_ai_agents.py --agent claude
  python test_ai_agents.py --agent gptbot
  python test_ai_agents.py --agent perplexity
  python test_ai_agents.py --agent scraper

  # Test a custom AI agent with custom User-Agent and optional API key:
  python test_ai_agents.py --custom-ua "MyCustomAgent/1.0" --api-key "AIzaSyTestKey123"

  # Run real headless browser automation test on Elvara with Playwright:
  python test_ai_agents.py --browser
========================================================================================
"""

import sys
import time
import json
import base64
import argparse
from typing import Dict, Any, Optional

try:
    import requests
except ImportError:
    print("[ERROR] 'requests' library is required. Install with: pip install requests")
    sys.exit(1)

# Default live endpoints
DEFAULT_BOTPULSE_API = "https://botpulse-final.vercel.app/api/v1"
DEFAULT_ELVARA_URL = "https://elvara-fashion.vercel.app"
DEFAULT_SITE_KEY = "bp_pub_alvera_live_7c4f19e"

# Terminal ANSI formatting
C_RESET = "\033[0m"
C_BOLD = "\033[1m"
C_CYAN = "\033[96m"
C_GREEN = "\033[92m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_MAGENTA = "\033[95m"
C_DIM = "\033[2m"

def decode_jwt_payload(token: str) -> Optional[Dict[str, Any]]:
    """Decodes JWT payload without verifying signature for diagnostic display."""
    try:
        parts = token.split(".")
        if len(parts) >= 2:
            padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
            data = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
            return json.loads(data)
    except Exception:
        pass
    return None

def print_banner():
    banner = f"""
{C_CYAN}{C_BOLD}========================================================================================
  🛡️  BOTPULSE AI SECURITY ENGINE -- REAL AI AGENT DETECTION TEST HARNESS
========================================================================================{C_RESET}
  {C_BOLD}Target Storefront:{C_RESET}  {DEFAULT_ELVARA_URL}
  {C_BOLD}Security Engine:{C_RESET}    {DEFAULT_BOTPULSE_API}
  {C_BOLD}Protected Site:{C_RESET}     ÉLVARA Fashion (site_id: site_alvera_001)
  {C_BOLD}Detection Layers:{C_RESET}   Stage 1: XGBoost  |  Stage 2: BiLSTM  |  Stage 3: RAD-S1 AI-Agent
========================================================================================
"""
    print(banner)

def send_telemetry_batch(
    endpoint: str,
    site_key: str,
    session_id: str,
    user_agent: str,
    events: list,
    api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    extra_headers: Optional[dict] = None
) -> Dict[str, Any]:
    """Transmits behavioral telemetry batch to BotPulse detection endpoint."""
    url = f"{endpoint.rstrip('/')}/events"
    payload = {
        "site_key": site_key,
        "session_id": session_id,
        "visitor_id": f"vis_{session_id[-12:]}",
        "user_agent": user_agent,
        "events": events
    }
    if api_key:
        payload["api_key"] = api_key
    if gemini_api_key:
        payload["gemini_api_key"] = gemini_api_key

    headers = {"Content-Type": "application/json"}
    if extra_headers:
        headers.update(extra_headers)

    t0 = time.perf_counter()
    resp = None
    for attempt in range(2):
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=20)
            break
        except requests.exceptions.RequestException as e:
            if attempt == 1:
                latency_ms = (time.perf_counter() - t0) * 1000.0
                return {
                    "success": False,
                    "status_code": 0,
                    "error": f"Network timeout/connection error: {e}",
                    "latency_ms": latency_ms
                }
            time.sleep(1)

    latency_ms = (time.perf_counter() - t0) * 1000.0

    if resp is None or resp.status_code != 200:
        return {
            "success": False,
            "status_code": resp.status_code if resp else 0,
            "error": resp.text if resp else "No response",
            "latency_ms": latency_ms
        }

    data = resp.json()
    data["success"] = True
    data["http_latency_ms"] = round(latency_ms, 2)
    return data

def format_verdict(decision: Dict[str, Any]) -> str:
    label = decision.get("predicted_label", "Unknown")
    action = str(decision.get("action", "unknown")).upper()
    risk = decision.get("risk_score", 0.0)
    conf = decision.get("confidence", 0.0)

    # Colorize label
    if label == "AI Agent":
        lbl_color = f"{C_CYAN}{C_BOLD}{label}{C_RESET}"
    elif label == "Human":
        lbl_color = f"{C_GREEN}{C_BOLD}{label}{C_RESET}"
    else:
        lbl_color = f"{C_RED}{C_BOLD}{label}{C_RESET}"

    # Colorize action
    if action == "ALLOW":
        act_color = f"{C_GREEN}{C_BOLD}{action}{C_RESET}"
    elif action == "POW_CHALLENGE" or action == "VERIFY":
        act_color = f"{C_YELLOW}{C_BOLD}{action}{C_RESET}"
    else:
        act_color = f"{C_RED}{C_BOLD}{action}{C_RESET}"

    return f"{lbl_color} | Action: {act_color} | Risk: {risk}/100 | Conf: {int(conf * 100)}%"

def run_agent_test(
    name: str,
    description: str,
    user_agent: str,
    events: list,
    api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    extra_headers: Optional[dict] = None,
    endpoint: str = DEFAULT_BOTPULSE_API
) -> Dict[str, Any]:
    print(f"\n{C_BOLD}▶ Testing Agent: {C_MAGENTA}{name}{C_RESET}")
    print(f"  {C_DIM}Profile:{C_RESET} {description}")
    print(f"  {C_DIM}User-Agent:{C_RESET} {user_agent}")
    if gemini_api_key or api_key:
        key_show = gemini_api_key or api_key
        masked = key_show[:8] + "..." + key_show[-4:] if len(key_show) > 12 else key_show
        print(f"  {C_DIM}API Credential Attribution:{C_RESET} {masked}")

    session_id = f"sess_{name.lower().replace(' ', '_').replace('/', '_')}_{int(time.time())}"
    res = send_telemetry_batch(
        endpoint=endpoint,
        site_key=DEFAULT_SITE_KEY,
        session_id=session_id,
        user_agent=user_agent,
        events=events,
        api_key=api_key,
        gemini_api_key=gemini_api_key,
        extra_headers=extra_headers
    )

    if not res.get("success"):
        print(f"  {C_RED}[FAIL] HTTP {res.get('status_code')}: {res.get('error')}{C_RESET}")
        return res

    print(f"  {C_BOLD}Detection Verdict:{C_RESET} {format_verdict(res)} (API Latency: {res.get('http_latency_ms')} ms)")

    reasons = res.get("reasons", [])
    if reasons:
        print(f"  {C_BOLD}Detection Evidence Signals:{C_RESET}")
        for r in reasons:
            print(f"    • {C_YELLOW}{r}{C_RESET}")

    token = res.get("decision_token")
    if token:
        payload = decode_jwt_payload(token)
        if payload:
            print(f"  {C_BOLD}Signed Decision Token (HS256):{C_RESET}")
            print(f"    - Visitor Type: {C_CYAN}{payload.get('visitor_type')}{C_RESET}")
            print(f"    - Site ID:      {payload.get('site_id')}")
            print(f"    - Action Claim: {payload.get('action')}")
            print(f"    - Scope:        {payload.get('permitted_scope')}")
            print(f"    - Decision ID:  {payload.get('decision_id')}")

    res["agent_name"] = name
    return res

# --------------------------------------------------------------------------------------
# Standard Agent Test Payloads
# --------------------------------------------------------------------------------------

def get_gemini_payload():
    now = int(time.time() * 1000)
    return {
        "name": "Google Gemini Autonomous Agent",
        "description": "Legitimate multimodal AI web agent navigating Elvara via Gemini Developer API",
        "user_agent": "Mozilla/5.0 (compatible; Google-Gemini-Agent/1.0; +https://deepmind.google/technologies/gemini/)",
        "gemini_api_key": "AIzaSyB3TestGeminiAutonomousAgentKey2026",
        "extra_headers": {
            "x-goog-api-key": "AIzaSyB3TestGeminiAutonomousAgentKey2026",
            "x-agent-family": "Google Gemini Agent"
        },
        "events": [
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/", "timestamp": now - 600, "sequence_num": 1, "payload": {"path": "/"}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/collections/women", "timestamp": now - 350, "sequence_num": 2, "payload": {"path": "/collections/women"}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/search?query=silk+blouse", "timestamp": now - 150, "sequence_num": 3, "payload": {"path": "/search"}},
            {"event_type": "click", "url": f"{DEFAULT_ELVARA_URL}/product/essential-linen-blouse", "timestamp": now, "sequence_num": 4, "payload": {"target": "button.add-to-bag", "class_hint": "cta-cart"}}
        ]
    }

def get_claude_payload():
    now = int(time.time() * 1000)
    return {
        "name": "Anthropic Claude Web Agent",
        "description": "Anthropic autonomous browsing agent performing knowledge gathering & synthesis",
        "user_agent": "Mozilla/5.0 (compatible; ClaudeBot/1.0; +https://www.anthropic.com/claudebot)",
        "events": [
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/collections/women", "timestamp": now - 500, "sequence_num": 1, "payload": {"path": "/collections/women"}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/search?query=linen", "timestamp": now - 250, "sequence_num": 2, "payload": {"path": "/search"}},
            {"event_type": "click", "url": f"{DEFAULT_ELVARA_URL}/checkout", "timestamp": now, "sequence_num": 3, "payload": {"target": "button.checkout"}}
        ]
    }

def get_gptbot_payload():
    now = int(time.time() * 1000)
    return {
        "name": "OpenAI GPTBot / ChatGPT Browsing Agent",
        "description": "OpenAI search crawler & interactive browsing agent fetching real-time product data",
        "user_agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0; +https://openai.com/bot)",
        "events": [
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/collections/men", "timestamp": now - 400, "sequence_num": 1, "payload": {"path": "/collections/men"}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/search?query=wool+overcoat", "timestamp": now - 200, "sequence_num": 2, "payload": {"path": "/search"}},
            {"event_type": "click", "url": f"{DEFAULT_ELVARA_URL}/product/classic-wool-overcoat", "timestamp": now, "sequence_num": 3, "payload": {"target": "a.product-card"}}
        ]
    }

def get_perplexity_payload():
    now = int(time.time() * 1000)
    return {
        "name": "Perplexity AI Autonomous Search Agent",
        "description": "Perplexity live search agent conducting conversational web retrieval on Elvara",
        "user_agent": "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
        "events": [
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/collections/accessories", "timestamp": now - 450, "sequence_num": 1, "payload": {"path": "/collections/accessories"}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/search?query=leather+belt", "timestamp": now - 200, "sequence_num": 2, "payload": {"path": "/search"}},
            {"event_type": "click", "url": f"{DEFAULT_ELVARA_URL}/cart", "timestamp": now, "sequence_num": 3, "payload": {"target": "button.view-cart"}}
        ]
    }

def get_scraper_payload():
    now = int(time.time() * 1000)
    return {
        "name": "Malicious Scraper / Headless Bot",
        "description": "Aggressive headless bot scraping entire catalogue in high-frequency bursts without human kinematics",
        "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
        "events": [
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/collections/women", "timestamp": now - 200, "sequence_num": 1, "payload": {}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/collections/men", "timestamp": now - 150, "sequence_num": 2, "payload": {}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/collections/accessories", "timestamp": now - 100, "sequence_num": 3, "payload": {}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/products/all", "timestamp": now - 50, "sequence_num": 4, "payload": {}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/checkout", "timestamp": now, "sequence_num": 5, "payload": {}}
        ]
    }

def get_human_payload():
    now = int(time.time() * 1000)
    return {
        "name": "Natural Human Visitor Baseline",
        "description": "Standard organic human browsing session with natural dwell time and low risk",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "events": [
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/", "timestamp": now - 15000, "sequence_num": 1, "payload": {"title": "ÉLVARA — Timeless by Design"}},
            {"event_type": "scroll", "url": f"{DEFAULT_ELVARA_URL}/", "timestamp": now - 11000, "sequence_num": 2, "payload": {"scroll_y": 420}},
            {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/collections/women", "timestamp": now - 5000, "sequence_num": 3, "payload": {"path": "/collections/women"}}
        ]
    }

# --------------------------------------------------------------------------------------
# Interactive Browser Agent Test (Playwright)
# --------------------------------------------------------------------------------------

def run_playwright_browser_test(headless: bool = True):
    print(f"\n{C_BOLD}========================================================================================{C_RESET}")
    print(f"  {C_CYAN}{C_BOLD}LAUNCHING REAL AUTONOMOUS PLAYWRIGHT BROWSER AGENT ON ÉLVARA STOREFRONT{C_RESET}")
    print(f"{C_BOLD}========================================================================================{C_RESET}")
    print(f"  Target URL: {DEFAULT_ELVARA_URL}")
    print(f"  Mode:       Headless Chrome (Automated AI Browser)")

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(f"\n{C_RED}[ERROR] Playwright is not installed. Run: pip install playwright && playwright install chromium{C_RESET}")
        return

    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    ]
    exec_path = None
    import os
    for p in chrome_paths:
        if os.path.exists(p):
            exec_path = p
            break

    with sync_playwright() as p:
        launch_kwargs = {"headless": headless}
        if exec_path:
            launch_kwargs["executable_path"] = exec_path

        print(f"  Browser Binary: {exec_path or 'Playwright default'}")
        browser = p.chromium.launch(**launch_kwargs)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Autonomous-AI-Agent/1.0",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()

        decisions = []

        def on_response(res):
            if "/events" in res.url:
                try:
                    d = res.json()
                    decisions.append(d)
                    label = d.get("predicted_label")
                    act = d.get("action", "").upper()
                    risk = d.get("risk_score")
                    print(f"  {C_CYAN}[Live Telemetry Decision]{C_RESET} HTTP {res.status} | Label: {C_BOLD}{label}{C_RESET} | Action: {act} | Risk: {risk}")
                except Exception:
                    pass

        page.on("response", on_response)

        print("\n  [1/4] Navigating to ÉLVARA Storefront...")
        page.goto(DEFAULT_ELVARA_URL, wait_until="commit")
        time.sleep(3)

        print("  [2/4] Navigating to Women's Collection...")
        try:
            page.click("text=Women", timeout=6000)
        except Exception:
            page.goto(f"{DEFAULT_ELVARA_URL}/collections/women", wait_until="commit")
        time.sleep(3)

        print("  [3/4] Performing Programmatic Traversal & Flushes...")
        page.evaluate("""() => {
            if (window.BotPulse) {
                window.BotPulse.flush(false);
            }
        }""")
        time.sleep(4)

        print("\n  [4/4] Summary of Browser Agent Verdicts:")
        if decisions:
            latest = decisions[-1]
            print(f"    • Classification: {C_CYAN}{C_BOLD}{latest.get('predicted_label')}{C_RESET}")
            print(f"    • Final Action:   {latest.get('action', '').upper()}")
            print(f"    • Risk Score:     {latest.get('risk_score')}/100")
            print(f"    • Detection Reasons: {latest.get('reasons')}")
        else:
            print("    • No telemetry responses intercepted within window.")

        browser.close()

# --------------------------------------------------------------------------------------
# CLI Runner
# --------------------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="BotPulse AI Agent Detection Test Harness for ÉLVARA")
    parser.add_argument("--agent", choices=["all", "gemini", "claude", "gptbot", "perplexity", "scraper", "human"], default="all",
                        help="Specific AI agent persona to test (default: all)")
    parser.add_argument("--browser", action="store_true", help="Launch real Playwright Chromium browser agent")
    parser.add_argument("--headed", action="store_true", help="Run browser in visible (headed) mode")
    parser.add_argument("--custom-ua", type=str, help="Test a custom User-Agent string")
    parser.add_argument("--api-key", type=str, help="Pass API key for attribution test")
    parser.add_argument("--endpoint", type=str, default=DEFAULT_BOTPULSE_API, help="BotPulse API base URL")

    args = parser.parse_args()

    print_banner()

    if args.browser:
        run_playwright_browser_test(headless=not args.headed)
        return

    if args.custom_ua:
        now = int(time.time() * 1000)
        custom_payload = {
            "name": "Custom User-Specified Agent",
            "description": f"Custom testing payload with UA: {args.custom_ua}",
            "user_agent": args.custom_ua,
            "api_key": args.api_key,
            "gemini_api_key": args.api_key if (args.api_key and "AIza" in args.api_key) else None,
            "events": [
                {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/", "timestamp": now - 300, "sequence_num": 1, "payload": {}},
                {"event_type": "page_view", "url": f"{DEFAULT_ELVARA_URL}/collections", "timestamp": now - 150, "sequence_num": 2, "payload": {}},
                {"event_type": "click", "url": f"{DEFAULT_ELVARA_URL}/checkout", "timestamp": now, "sequence_num": 3, "payload": {"target": "btn.submit"}}
            ]
        }
        run_agent_test(**custom_payload, endpoint=args.endpoint)
        return

    test_matrix = {
        "gemini": get_gemini_payload(),
        "claude": get_claude_payload(),
        "gptbot": get_gptbot_payload(),
        "perplexity": get_perplexity_payload(),
        "scraper": get_scraper_payload(),
        "human": get_human_payload()
    }

    results = []
    if args.agent == "all":
        for key, p in test_matrix.items():
            res = run_agent_test(**p, endpoint=args.endpoint)
            results.append((p["name"], res))
    else:
        p = test_matrix[args.agent]
        res = run_agent_test(**p, endpoint=args.endpoint)
        results.append((p["name"], res))

    # Print summary comparison table
    print(f"\n{C_BOLD}========================================================================================{C_RESET}")
    print(f"  {C_BOLD}FINAL EVALUATION SUMMARY MATRIX{C_RESET}")
    print(f"{C_BOLD}========================================================================================{C_RESET}")
    print(f"  {'Agent Persona':<38} | {'Classification':<15} | {'Action':<7} | {'Risk':<7} | {'Confidence'}")
    print(f"  {'-'*38}-|-{'-'*15}-|-{'-'*7}-|-{'-'*7}-|-{'-'*10}")

    for name, r in results:
        label = r.get("predicted_label", "ERR")
        action = str(r.get("action", "ERR")).upper()
        risk = f"{r.get('risk_score', 0.0)}"
        conf = f"{int((r.get('confidence') or 0.0) * 100)}%"
        print(f"  {name:<38} | {label:<15} | {action:<7} | {risk:<7} | {conf}")
    print(f"{C_BOLD}========================================================================================{C_RESET}\n")

if __name__ == "__main__":
    main()
