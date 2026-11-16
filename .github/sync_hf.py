"""
Sync to Hugging Face Spaces helper.
1. Authenticates via HF_TOKEN and auto-detects the exact Hugging Face username.
2. Checks if the Space exists, and automatically creates it with Gradio SDK if missing.
3. Pushes the latest code from GitHub to Hugging Face Spaces.
"""
import os
import sys
import json
import urllib.request
import urllib.error
import subprocess

def main():
    token = os.environ.get("HF_TOKEN", "").strip()
    if not token:
        print("::error::HF_TOKEN secret is missing in GitHub repository secrets.")
        print("Please go to GitHub Repo -> Settings -> Secrets and variables -> Actions, and add HF_TOKEN.")
        sys.exit(1)

    print("Step 1: Authenticating with Hugging Face API...", flush=True)
    whoami_req = urllib.request.Request(
        "https://huggingface.co/api/whoami-v2",
        headers={"Authorization": f"Bearer {token}", "User-Agent": "BotPulse-Sync/1.0"}
    )
    try:
        with urllib.request.urlopen(whoami_req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            hf_user = data.get("name")
            print(f"✓ Authenticated as Hugging Face user: '{hf_user}'", flush=True)
    except urllib.error.HTTPError as e:
        print(f"::error::Failed to authenticate with Hugging Face (HTTP {e.code}). Please check your HF_TOKEN permissions.", flush=True)
        sys.exit(1)

    space_name = os.environ.get("HF_SPACE_NAME", "botpulse-api").strip()
    space_id = f"{hf_user}/{space_name}"
    print(f"Step 2: Checking target Space '{space_id}'...", flush=True)

    check_req = urllib.request.Request(
        f"https://huggingface.co/api/spaces/{space_id}",
        headers={"Authorization": f"Bearer {token}", "User-Agent": "BotPulse-Sync/1.0"}
    )
    space_exists = False
    try:
        with urllib.request.urlopen(check_req) as resp:
            space_exists = True
            print(f"✓ Space '{space_id}' already exists.", flush=True)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"Space '{space_id}' not found. Creating it automatically with Gradio SDK...", flush=True)
            create_payload = json.dumps({
                "name": space_name,
                "type": "space",
                "space_sdk": "gradio"
            }).encode("utf-8")
            create_req = urllib.request.Request(
                "https://huggingface.co/api/repos/create",
                data=create_payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "User-Agent": "BotPulse-Sync/1.0"
                }
            )
            try:
                with urllib.request.urlopen(create_req) as resp:
                    print(f"✓ Space '{space_id}' created successfully on Hugging Face!", flush=True)
                    space_exists = True
            except urllib.error.HTTPError as ce:
                print(f"Notice: Space creation response code: {ce.code}", flush=True)
        else:
            print(f"Notice: Space check response code: {e.code}", flush=True)

    # Step 3: Git push
    remote_url = f"https://{hf_user}:{token}@huggingface.co/spaces/{space_id}"
    print(f"Step 3: Pushing repository to https://huggingface.co/spaces/{space_id}...", flush=True)
    res = subprocess.run(["git", "push", "--force", remote_url, "main:main"], capture_output=True, text=True)
    if res.returncode == 0:
        print("=" * 60, flush=True)
        print("✓ Successfully synced repository to Hugging Face Spaces!", flush=True)
        print(f"🚀 Your Space URL:     https://huggingface.co/spaces/{space_id}", flush=True)
        subdomain = f"{hf_user}-{space_name}".replace("_", "-").lower()
        print(f"🚀 Your Live API URL:  https://{subdomain}.hf.space", flush=True)
        print("=" * 60, flush=True)
    else:
        print(f"::error::Git push failed: {res.stderr}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
