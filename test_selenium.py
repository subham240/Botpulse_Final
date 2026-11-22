"""
BotPulse Automated Selenium Verification Suite
Tests automated headless Chrome browser detection, Proof-of-Work challenge delivery,
and edge policy enforcement (BLOCK, VERIFY, LIMIT, ALLOW, and Thresholds).
"""

import sys
import os
import time
import json
import hashlib
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

API_BASE = "http://54.174.210.57:8000/api/v1"
STOREFRONT_URL = f"https://elvara-fashion.vercel.app/?bp_api={API_BASE}"
SITE_ID = "site_elvara_001"

def print_separator(title=""):
    print("\n" + "=" * 70)
    if title:
        print(f"  {title.upper()}")
        print("=" * 70)

def set_policy(traditional_bot_action=None, block_threshold=80, verify_threshold=60, pow_difficulty=3):
    """Updates edge regulation policy on BotPulse backend."""
    payload = {
        "site_id": SITE_ID,
        "traditional_bot_action": traditional_bot_action,
        "ai_agent_action": "verify",
        "block_threshold": block_threshold,
        "verify_threshold": verify_threshold,
        "pow_difficulty": pow_difficulty,
        "block_headless_browsers": True
    }
    resp = requests.put(f"{API_BASE}/prevention/policies", json=payload, timeout=10)
    resp.raise_for_status()
    print(f"[*] Edge Policy Synchronized: traditional_bot_action={traditional_bot_action}, block_thresh={block_threshold}, verify_thresh={verify_threshold}, pow_difficulty={pow_difficulty}")
    return resp.json()

def solve_pow(challenge, session_id):
    """Client-side SHA-256 Proof-of-Work solver."""
    challenge_id = challenge["challenge_id"]
    seed = challenge["seed"]
    difficulty = int(challenge["difficulty"])
    target = "0" * difficulty
    
    t0 = time.perf_counter()
    nonce = 0
    while True:
        candidate = f"{seed}:{nonce}"
        h = hashlib.sha256(candidate.encode("utf-8")).hexdigest()
        if h.startswith(target):
            solve_time_ms = (time.perf_counter() - t0) * 1000.0
            submission = {
                "challenge_id": challenge_id,
                "seed": seed,
                "difficulty": difficulty,
                "expires_at": challenge["expires_at"],
                "signature": challenge["signature"],
                "nonce": nonce,
                "session_id": session_id,
                "bound_session_id": challenge.get("bound_session_id", session_id),
                "site_id": challenge.get("site_id", SITE_ID),
                "time_taken_ms": round(solve_time_ms, 2)
            }
            return submission, h, solve_time_ms
        nonce += 1

def run_selenium_storefront_test():
    """Runs Selenium Chrome WebDriver directly against the live protected storefront."""
    print_separator("Selenium Live Storefront Interaction Test")
    
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,800")
    
    print("[*] Launching automated Chrome WebDriver via Selenium...")
    driver = webdriver.Chrome(options=options)
    
    try:
        print(f"[*] Navigating Selenium to: {STOREFRONT_URL}")
        driver.get(STOREFRONT_URL)
        time.sleep(3)
        
        page_title = driver.title
        print(f"[+] Page loaded successfully! Title: '{page_title}'")
        
        # Check WebDriver detection flag exposed by Selenium
        is_webdriver = driver.execute_script("return navigator.webdriver;")
        user_agent = driver.execute_script("return navigator.userAgent;")
        print(f"[+] Browser Signals Detected:")
        print(f"    - navigator.webdriver: {is_webdriver}")
        print(f"    - User-Agent: {user_agent}")
        
        # Simulate automated scraper behavior: rapid page scrolls and button clicks
        print("[*] Selenium simulating automated bot behavior (rapid DOM queries & interaction)...")
        driver.execute_script("window.scrollTo(0, 500);")
        time.sleep(0.5)
        driver.execute_script("window.scrollTo(0, 1000);")
        time.sleep(0.5)
        
        # Verify BotPulse SDK status in page
        sdk_active = driver.execute_script("return typeof window.botpulse !== 'undefined' || typeof window.BotPulse !== 'undefined';")
        print(f"[+] BotPulse Browser SDK injected and active: {sdk_active}")
        
        storage_data = driver.execute_script("return { ...localStorage };")
        print(f"[+] LocalStorage synced keys: {list(storage_data.keys())}")
        if "bp_session_id" in storage_data:
            print(f"    - Session ID: {storage_data['bp_session_id']}")
        if "bp_decision_token" in storage_data:
            print(f"    - Live Edge Decision Token: {storage_data['bp_decision_token'][:45]}...")

    finally:
        driver.quit()
        print("[*] Selenium WebDriver session closed cleanly.")

def run_policy_enforcement_tests():
    """Tests all 4 Traditional Bot regulation modes and Proof-of-Work challenge verification."""
    print_separator("Selenium Detection & Edge Enforcement Matrix")
    
    test_cases = [
        {
            "name": "TEST 1: Traditional Bots = BLOCK",
            "policy_action": "block",
            "expected_action": "block",
            "expected_category": "Traditional Bot"
        },
        {
            "name": "TEST 2: Traditional Bots = VERIFY (Proof-of-Work Challenge)",
            "policy_action": "verify",
            "expected_action": "verify",
            "expected_category": "Traditional Bot"
        },
        {
            "name": "TEST 3: Traditional Bots = LIMIT (Rate Limiting)",
            "policy_action": "limit",
            "expected_action": "rate_limit",
            "expected_category": "Traditional Bot"
        },
        {
            "name": "TEST 4: Traditional Bots = ALLOW (Explicit Bypass)",
            "policy_action": "allow",
            "expected_action": "allow",
            "expected_category": "Traditional Bot"
        }
    ]
    
    results = []
    
    for tc in test_cases:
        print(f"\n>>> Running: {tc['name']}")
        set_policy(traditional_bot_action=tc["policy_action"], pow_difficulty=3)
        time.sleep(0.5)
        
        # Construct synthetic Selenium headless telemetry payload with automated signature
        session_id = f"sess_selenium_test_{tc['policy_action']}_{int(time.time())}"
        telemetry_payload = {
            "site_key": "bp_pub_alvera_live_7c4f19e",
            "session_id": session_id,
            "visitor_id": f"vis_selenium_{int(time.time())}",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36 Selenium/4.53.0",
            "events": [
                {
                    "event_type": "page_view",
                    "url": STOREFRONT_URL,
                    "timestamp": int(time.time() * 1000),
                    "sequence_num": 1,
                    "payload": {"title": "ÉLVARA Store", "path": "/"}
                },
                {
                    "event_type": "click",
                    "url": STOREFRONT_URL,
                    "timestamp": int(time.time() * 1000) + 100,
                    "sequence_num": 2,
                    "payload": {"x": 500, "y": 200, "tag": "button"}
                }
            ],
            "session_metadata": {
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36 Selenium/4.53.0",
                "is_selenium": True
            }
        }
        
        resp = requests.post(f"{API_BASE}/events", json=telemetry_payload, timeout=10)
        resp_data = resp.json()
        
        actual_action = resp_data.get("action")
        risk_score = resp_data.get("risk_score")
        category = resp_data.get("predicted_label")
        reasons = resp_data.get("reasons", [])
        pow_challenge = resp_data.get("pow_challenge")
        
        passed = (actual_action == tc["expected_action"])
        
        print(f"    - Enforced Action:   {actual_action.upper()} (Expected: {tc['expected_action'].upper()})")
        print(f"    - Risk Score:        {risk_score}/100")
        print(f"    - Classification:    {category}")
        print(f"    - Triggered Reasons: {reasons}")
        
        # In VERIFY mode, solve and verify Proof-of-Work
        pow_verified = None
        if actual_action == "verify" and pow_challenge:
            print(f"    - Proof-of-Work Challenge Issued: Challenge ID={pow_challenge['challenge_id']}, Difficulty={pow_challenge['difficulty']}")
            submission, sol_hash, solve_time = solve_pow(pow_challenge, session_id=session_id)
            print(f"    - Solved PoW in {solve_time:.2f}ms (nonce={submission['nonce']}, hash={sol_hash[:16]}...)")
            
            verify_resp = requests.post(f"{API_BASE}/prevention/pow/verify", json=submission, timeout=10)
            verify_data = verify_resp.json()
            pow_verified = verify_data.get("verified", False)
            print(f"    - PoW Verification Response: verified={pow_verified}, message='{verify_data.get('message')}', new_action='{verify_data.get('new_action')}'")
        
        results.append({
            "test": tc["name"],
            "policy": tc["policy_action"],
            "action": actual_action,
            "category": category,
            "risk_score": risk_score,
            "passed": passed,
            "pow_solved": pow_verified
        })
        time.sleep(0.5)

    return results

def run_threshold_tests():
    """Tests the Automatic Block and Verification Challenge Threshold sliders."""
    print_separator("Threshold Slider Edge Enforcement Tests")
    
    # Reset category override to test raw threshold scoring
    set_policy(traditional_bot_action=None, block_threshold=65, verify_threshold=40, pow_difficulty=2)
    time.sleep(0.5)
    
    # 1. Score in VERIFY window (40 <= score < 65)
    payload_verify = {
        "site_key": "bp_pub_alvera_live_7c4f19e",
        "session_id": f"sess_thresh_verify_{int(time.time())}",
        "visitor_id": f"vis_thresh_{int(time.time())}",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
        "events": [{"event_type": "page_view", "url": STOREFRONT_URL, "timestamp": int(time.time() * 1000)}]
    }
    
    r1 = requests.post(f"{API_BASE}/events", json=payload_verify).json()
    print(f"[*] Threshold Set: Block >= 65, Verify >= 40")
    print(f"    Session Risk Score: {r1.get('risk_score')}/100 -> Enforced Action: {r1.get('action').upper()} ({r1.get('predicted_label')})")
    
    # 2. Strict Block Threshold (Block >= 50)
    set_policy(traditional_bot_action=None, block_threshold=50, verify_threshold=25, pow_difficulty=2)
    time.sleep(0.5)
    r2 = requests.post(f"{API_BASE}/events", json=payload_verify).json()
    print(f"[*] Aggressive Threshold Set: Block >= 50, Verify >= 25")
    print(f"    Session Risk Score: {r2.get('risk_score')}/100 -> Enforced Action: {r2.get('action').upper()} ({r2.get('predicted_label')})")
    
    # Reset to baseline production policy
    set_policy(traditional_bot_action="block", block_threshold=80, verify_threshold=60, pow_difficulty=3)
    print("\n[*] Reset policy to Production Baseline: traditional_bot_action=BLOCK, block_threshold=80, verify_threshold=60")

def main():
    print("=" * 70)
    print("  BOTPULSE SELENIUM AUTOMATION & EDGE MITIGATION TEST SUITE")
    print("=" * 70)
    
    # 1. Test live Selenium browser visiting storefront
    run_selenium_storefront_test()
    
    # 2. Test policy enforcement matrix with Selenium signatures
    results = run_policy_enforcement_tests()
    
    # 3. Test threshold sliders
    run_threshold_tests()
    
    # Summary
    print_separator("Test Suite Execution Summary")
    all_passed = True
    for r in results:
        status_str = "PASS" if r["passed"] else "FAIL"
        if not r["passed"]:
            all_passed = False
        pow_note = f" (PoW Verified: {r['pow_solved']})" if r.get("pow_solved") is not None else ""
        print(f"  [{status_str}] {r['test']}: Enforced -> {r['action'].upper()} (Risk: {r['risk_score']}){pow_note}")
        
    print("\n" + "=" * 70)
    if all_passed:
        print("  ALL SELENIUM TEST CASES PASSED SUCCESSFULLY!")
    else:
        print("  SOME TEST CASES FAILED. REVIEW LOGS ABOVE.")
    print("=" * 70)

if __name__ == "__main__":
    main()
