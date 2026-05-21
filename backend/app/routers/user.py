from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import Client

from app.core.dependencies import get_current_user_id, get_db
from app.models.user import UserProfile

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile", response_model=UserProfile)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    result = db.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        return UserProfile(id=user_id)
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
