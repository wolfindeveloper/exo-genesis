from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from supabase import Client

from app.core.dependencies import get_content_loader, get_current_user_id, get_db, get_init_data_payload
from app.models.user import UserProfile
from app.services.artifact_resolver import resolve_effective_stats
from app.services.content_loader import ContentLoader
from app.services.progression import check_streak

def _grant_starter_pack(user_id: str, supabase: Client, now: str) -> None:
    existing = supabase.table("user_ships").select("id").eq("user_id", user_id).execute()
    if not existing.data:
        supabase.table("user_ships").insert({
            "user_id": user_id,
            "ship_config_id": "vega_mk2",
            "stability": 100,
            "acquired_at": now,
        }).execute()

    items = [
        ("resource", "fuel", 20),
        ("resource", "repair_kit", 5),
    ]
    for item_type, config_id, qty in items:
        supabase.table("user_inventory").insert({
            "user_id": user_id,
            "item_type": item_type,
            "item_config_id": config_id,
            "quantity": qty,
        }).execute()


router = APIRouter(prefix="/user", tags=["user"])


class ProfileResponse(UserProfile):
    is_new: bool = False
    box_rewards: dict | None = None
    streak_broken: bool | None = None
    daily_reward: bool | None = None
    daily_reward_items: dict | None = None


class ProfileUpdate(BaseModel):
    username: str | None = None
    add_xgen: int = Field(default=0, ge=0, le=10000)


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    payload: dict = Depends(get_init_data_payload),
    db: Client = Depends(get_db),
):
    now = datetime.now(timezone.utc).isoformat()
    tg_user = payload["user"]

    result = db.table("users").select("*").eq("id", user_id).execute()
    if result.data:
        streak_info = check_streak(user_id, db)
        db.table("users").update({
            "last_login": now,
            "username": tg_user.get("username", result.data[0].get("username", "")),
        }).eq("id", user_id).execute()
        profile = db.table("users").select("*").eq("id", user_id).execute().data[0]
        profile.update(streak_info)
        return ProfileResponse(**profile, is_new=False)

    new_user = {
        "id": user_id,
        "username": tg_user.get("username", ""),
        "language_code": tg_user.get("language_code", "en"),
        "balance_xgen": 10,
        "balance_stars": 0,
        "balance_fragments": 0,
        "level": 1,
        "xp": 0,
        "streak_days": 0,
        "created_at": now,
        "last_login": now,
    }
    result = db.table("users").insert(new_user).execute()
    if not result.data:
        return ProfileResponse(id=user_id, is_new=True)

    _grant_starter_pack(user_id, db, now)
    return ProfileResponse(**result.data[0], is_new=True)


@router.patch("/profile", response_model=UserProfile)
async def patch_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    updates = {}
    if body.username is not None:
        updates["username"] = body.username
    if body.add_xgen > 0:
        current = db.table("users").select("balance_xgen").eq("id", user_id).execute().data
        if not current:
            raise HTTPException(status_code=404, detail="User not found")
        new_balance = int(current[0].get("balance_xgen", 0)) + body.add_xgen
        db.table("users").update({"balance_xgen": new_balance}).eq("id", user_id).execute()
    if updates:
        db.table("users").update(updates).eq("id", user_id).execute()
    result = db.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
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
    content: ContentLoader = Depends(get_content_loader),
):
    result = (
        db.table("user_ships")
        .select("*")
        .eq("user_id", user_id)
        .order("acquired_at")
        .execute()
    )
    ships = result.data or []
    enriched = []
    for ship in ships:
        ship_config = content.get_ship(ship["ship_config_id"]) or {}
        resolved = resolve_effective_stats(
            ship_config,
            ship.get("equipped_artifacts", []),
            content,
        )
        ship["resolved_artifacts"] = resolved["resolved_artifacts"]
        ship["effective_stats"] = resolved["effective_stats"]
        enriched.append(ship)
    return enriched


class UserStats(BaseModel):
    total_expeditions: int = 0
    completed_expeditions: int = 0
    failed_expeditions: int = 0
    artifacts_crafted: int = 0
    joined_days: int = 0


@router.get("/stats", response_model=UserStats)
async def get_stats(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    exps = db.table("expeditions").select("status").eq("user_id", user_id).execute().data or []
    inv = db.table("user_inventory").select("item_type,quantity").eq("user_id", user_id).execute().data or []
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
        joined_days=joined_days,
    )
