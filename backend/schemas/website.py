from pydantic import BaseModel
from typing import Optional

class WebsiteCreate(BaseModel):
    name: str
    domain: str

class WebsiteResponse(BaseModel):
    id: str
    site_id: str
    site_key: str
    name: str
    domain: str
    status: str
    created_at: str
