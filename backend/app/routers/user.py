from fastapi import APIRouter, Depends
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
