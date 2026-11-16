from pydantic import BaseModel, model_validator
from typing import Optional, Any

class UserRegister(BaseModel):
    full_name: str
    work_email: Optional[str] = None
    email: Optional[str] = None
    workEmail: Optional[str] = None
    organization: str
    password: str

    @model_validator(mode="before")
    @classmethod
    def normalize_email(cls, data):
        if isinstance(data, dict):
            email_val = data.get("work_email") or data.get("workEmail") or data.get("email")
            if not email_val:
                raise ValueError("Email address is required")
            data["work_email"] = email_val
            data["email"] = email_val
            data["workEmail"] = email_val
        return data

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = ""
    organization: Optional[str] = ""
    role: str
    created_at: Optional[Any] = ""

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
