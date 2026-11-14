import uuid
import secrets
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from backend.schemas.website import WebsiteCreate, WebsiteResponse
from backend.routes.auth import get_current_user
from backend.database import db
from backend.config import settings

router = APIRouter(prefix="/websites", tags=["Websites Management"])

@router.get("", response_model=List[WebsiteResponse])
def list_websites(current_user: dict = Depends(get_current_user)):
    sites = db.get_websites_by_user(current_user["id"])
    # If no sites, seed with default Elvara Fashion site
    if not sites:
        default_site = {
            "id": f"site_{uuid.uuid4().hex[:8]}",
            "site_id": settings.DEFAULT_SITE_ID,
            "site_key": settings.DEFAULT_SITE_KEY,
            "name": settings.DEFAULT_SITE_NAME,
            "domain": settings.DEFAULT_SITE_DOMAIN,
            "user_id": current_user["id"],
            "status": "active",
            "secret_key": f"bp_sec_{secrets.token_hex(16)}"
        }
        db.create_website(default_site)
        sites = [default_site]
    return sites

@router.post("", response_model=WebsiteResponse)
def add_website(site_in: WebsiteCreate, current_user: dict = Depends(get_current_user)):
    site_key = f"bp_pub_{site_in.domain.replace('.', '_')}_{secrets.token_hex(4)}"
    site_id = f"site_{secrets.token_hex(6)}"
    secret_key = f"bp_sec_{secrets.token_hex(16)}"

    site_record = {
        "id": f"site_{uuid.uuid4().hex[:8]}",
        "site_id": site_id,
        "site_key": site_key,
        "name": site_in.name,
        "domain": site_in.domain,
        "user_id": current_user["id"],
        "status": "pending",
        "secret_key": secret_key
    }
    db.create_website(site_record)
    return site_record

@router.get("/{site_id}", response_model=WebsiteResponse)
def get_website(site_id: str, current_user: dict = Depends(get_current_user)):
    site = db.get_website_by_key(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Website not found")
    return site

@router.delete("/{site_id}")
def delete_website(site_id: str, current_user: dict = Depends(get_current_user)):
    success = db.delete_website(site_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Website not found or unauthorized")
    return {"status": "deleted", "site_id": site_id}
