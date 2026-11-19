import time
import json
import sys
from playwright.sync_api import sync_playwright

def run_browser_agent_test():
    print("=" * 70, flush=True)
    print("  ÉLVARA STOREFRONT -- AUTONOMOUS AI BROWSER AGENT TEST", flush=True)
    print("  Target: https://elvara-fashion.vercel.app", flush=True)
    print("=" * 70, flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            headless=True
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 (Autonomous-AI-Agent/1.0)",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()

        batches_sent = []
        decisions_received = []

        def on_request(req):
            if '/events' in req.url:
                try:
                    data = req.post_data_json
                    batches_sent.append(data)
                    print(f"  --> [Browser SDK] Flushed telemetry batch ({len(data.get('events', []))} events)", flush=True)
                except Exception:
                    pass

        def on_response(res):
            if '/events' in res.url:
                try:
                    data = res.json()
                    decisions_received.append(data)
                    print(f"  <-- [BotPulse Decision] HTTP {res.status} | Label: {data.get('predicted_label')} | Action: {data.get('action').upper()} | Risk: {data.get('risk_score')}", flush=True)
                    if data.get('reasons'):
                        print(f"      Reasons: {data.get('reasons')}", flush=True)
                except Exception:
                    pass

        page.on('request', on_request)
        page.on('response', on_response)

        # 1. Navigate to Storefront Homepage
        print("\n[Step 1] AI Agent navigating to ÉLVARA Homepage...", flush=True)
        page.goto('https://elvara-fashion.vercel.app', wait_until='commit')
        time.sleep(3)

        # 2. Browse Women's Collection
        print("\n[Step 2] AI Agent navigating to Women's Collection...", flush=True)
        page.click("text=Women")
        time.sleep(3)

        # 3. Autonomous Product Inspection & Selection
        print("\n[Step 3] AI Agent inspecting catalogue and clicking a product...", flush=True)
        product_card = page.locator("a[href*='/product/']").first
        if product_card.count() > 0:
            product_card.click()
            time.sleep(3)
            print(f"         Inspecting: {page.url}", flush=True)
        else:
            page.click("text=Essential Linen Blouse")
            time.sleep(3)

        # 4. Trigger Cart Operation
        print("\n[Step 4] AI Agent adding item to bag...", flush=True)
        add_btn = page.locator("button:has-text('Add to Bag'), button:has-text('ADD TO BAG')").first
        if add_btn.count() > 0:
            add_btn.click()
            time.sleep(2)

        # 5. Force SDK Batch Telemetry Flush
        print("\n[Step 5] Triggering final telemetry sync...", flush=True)
        page.evaluate("""() => {
            if (window.BotPulse) {
                window.BotPulse.flush(false);
            }
        }""")
        time.sleep(4)

        print("\n" + "=" * 70, flush=True)
        print("  AI BROWSER AGENT DETECTION SUMMARY", flush=True)
        print("=" * 70, flush=True)
        print(f"  Total Telemetry Batches Transmitted : {len(batches_sent)}", flush=True)
        print(f"  Total Signed Decisions Returned     : {len(decisions_received)}", flush=True)

        if decisions_received:
            latest = decisions_received[-1]
            print(f"\n  Final Classification : {latest.get('predicted_label')}", flush=True)
            print(f"  Enforcement Action   : {latest.get('action').upper()}", flush=True)
            print(f"  Risk Score           : {latest.get('risk_score')} / 100", flush=True)
            print(f"  Confidence           : {int((latest.get('confidence') or 0.95)*100)}%", flush=True)
            print(f"  Detection Signals    : {latest.get('reasons')}", flush=True)
            token = latest.get('decision_token')
            if token:
                print(f"  Decision Token (JWT) : {token[:35]}...{token[-15:]}", flush=True)
        print("=" * 70, flush=True)

        browser.close()

if __name__ == "__main__":
    run_browser_agent_test()
