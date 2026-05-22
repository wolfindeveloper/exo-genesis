from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import Client

from app.core.dependencies import get_content_loader, get_current_user_id, get_db, get_init_data_payload
from app.models.user import UserProfile
from app.services.box_opener import open_box
from app.services.content_loader import ContentLoader

router = APIRouter(prefix="/user", tags=["user"])


class ProfileResponse(UserProfile):
    is_new: bool = False
    box_rewards: dict | None = None


class ProfileUpdate(BaseModel):
    username: str | None = None


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    payload: dict = Depends(get_init_data_payload),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    now = datetime.now(timezone.utc).isoformat()
    tg_user = payload["user"]

    result = db.table("users").select("*").eq("id", user_id).execute()
    if result.data:
        db.table("users").update({
            "last_login": now,
            "username": tg_user.get("username", result.data[0].get("username", "")),
        }).eq("id", user_id).execute()
        return ProfileResponse(**result.data[0], is_new=False)

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
    result = db.table("users").insert(new_user).execute()
    if not result.data:
        return ProfileResponse(id=user_id, is_new=True)

    rewards = open_box("nothing_extra_starter_pack", user_id, db, content)
    return ProfileResponse(**result.data[0], is_new=True, box_rewards=rewards)


@router.patch("/profile", response_model=UserProfile)
async def patch_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    updates = {}
    if body.username is not None:
        updates["username"] = body.username
    if updates:
        db.table("users").update(updates).eq("id", user_id).execute()
    result = db.table("users").select("*").eq("id", user_id).execute()
    return UserProfile(**result.data[0])


@router.get("/inventory")
async def get_inventory(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    result = (
        db.table("user_inventory")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    return result.data or []


@router.get("/ships")
async def get_ships(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    result = (
        db.table("user_ships")
        .select("*")
        .eq("user_id", user_id)
        .order("acquired_at")
        .execute()
    )
    return result.data or []


class UserStats(BaseModel):
    total_expeditions: int = 0
    completed_expeditions: int = 0
    failed_expeditions: int = 0
    artifacts_crafted: int = 0
    discoveries_made: int = 0
    total_elements: int = 0
    joined_days: int = 0


@router.get("/stats", response_model=UserStats)
async def get_stats(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    exps = db.table("expeditions").select("status").eq("user_id", user_id).execute().data or []
    inv = db.table("user_inventory").select("item_type,quantity").eq("user_id", user_id).execute().data or []
    disc = db.table("discoveries").select("*", count="exact").eq("discoverer_user_id", user_id).execute()
    profile = db.table("users").select("created_at").eq("id", user_id).execute().data

    joined_days = 0
    if profile:
        created = datetime.fromisoformat(profile[0]["created_at"])
        joined_days = (datetime.now(timezone.utc) - created).days

    return UserStats(
        total_expeditions=len(exps),
        completed_expeditions=sum(1 for e in exps if e["status"] == "completed"),
        failed_expeditions=sum(1 for e in exps if e["status"] == "failed"),
        artifacts_crafted=sum(i["quantity"] for i in inv if i["item_type"] == "artifact"),
        discoveries_made=len(disc.data or []),
        total_elements=sum(i["quantity"] for i in inv if i["item_type"] == "element"),
        joined_days=joined_days,
    )
