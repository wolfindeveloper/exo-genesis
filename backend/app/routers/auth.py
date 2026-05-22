from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.core.dependencies import get_content_loader
from app.models.user import UserProfile
from app.services.auth import _validate_init_data
from app.services.box_opener import open_box
from app.services.content_loader import ContentLoader
from app.services.supabase import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    init_data: str


class AuthResponse(UserProfile):
    is_new: bool = False


@router.post("/validate", response_model=AuthResponse)
async def validate_auth(
    body: AuthRequest,
    supabase: Client = Depends(get_supabase),
    content: ContentLoader = Depends(get_content_loader),
):
    payload = _validate_init_data(body.init_data)
    tg_user = payload["user"]
    user_id = str(tg_user["id"])

    existing = supabase.table("users").select("*").eq("id", user_id).execute()

    if existing.data:
        supabase.table("users").update({
            "last_login": datetime.now(timezone.utc).isoformat(),
            "username": tg_user.get("username", ""),
        }).eq("id", user_id).execute()
        row = existing.data[0]
        row["last_login"] = datetime.now(timezone.utc).isoformat()
        return AuthResponse(**row, is_new=False)

    now = datetime.now(timezone.utc).isoformat()
    new_user = {
        "id": user_id,
        "username": tg_user.get("username", ""),
        "language_code": tg_user.get("language_code", "en"),
        "balance_xgen": 0,
        "balance_stars": 0,
        "level": 1,
        "xp": 0,
        "streak_days": 0,
        "created_at": now,
        "last_login": now,
    }
    result = supabase.table("users").insert(new_user).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    open_box("starter_box", user_id, supabase, content)

    return AuthResponse(**result.data[0], is_new=True)
