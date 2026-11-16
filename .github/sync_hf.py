"""
BotPulse — Hugging Face Sync Action (using huggingface_hub HfApi)
Automatically syncs all files and LFS model weights to Hugging Face Spaces.
"""
import os
import sys

def main():
    token = os.environ.get("HF_TOKEN", "").strip()
    if not token:
        print("::error::HF_TOKEN secret is missing in GitHub repository secrets.")
        sys.exit(1)

    try:
        from huggingface_hub import HfApi
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub"])
        from huggingface_hub import HfApi

    api = HfApi(token=token)
    
    # 1. Whoami
    user_info = api.whoami()
    hf_user = user_info.get("name")
    print(f"✓ Authenticated as Hugging Face user: '{hf_user}'")

    space_name = os.environ.get("HF_SPACE_NAME", "botpulse-api").strip()
    repo_id = f"{hf_user}/{space_name}"
    print(f"Target Space: {repo_id}")

    # 2. Check or create space
    try:
        api.space_info(repo_id=repo_id)
        print(f"✓ Space '{repo_id}' exists.")
    except Exception:
        print(f"Creating Space '{repo_id}' with Gradio SDK...")
        api.create_repo(repo_id=repo_id, repo_type="space", space_sdk="gradio")
        print(f"✓ Space '{repo_id}' created successfully!")

    # 3. Upload all files (handles binary .pt and .joblib seamlessly)
    print(f"Uploading files to https://huggingface.co/spaces/{repo_id}...")
    api.upload_folder(
        folder_path=".",
        repo_id=repo_id,
        repo_type="space",
        ignore_patterns=[
            "node_modules/**",
            ".git/**",
            ".github/**",
            "dist/**",
            "__pycache__/**",
            "backend/__pycache__/**",
            "backend/**/__pycache__/**",
            "backend/data/*.db",
            "backend/data/*.sqlite*",
            "backend/data/*.log",
            "*.log"
        ]
    )

    subdomain = f"{hf_user}-{space_name}".replace("_", "-").lower()
    print("=" * 60)
    print("✓ Successfully synced repository to Hugging Face Spaces!")
    print(f"🚀 Space Dashboard: https://huggingface.co/spaces/{repo_id}")
    print(f"🚀 24/7 API URL:    https://{subdomain}.hf.space")
    print("=" * 60)

if __name__ == "__main__":
    main()
