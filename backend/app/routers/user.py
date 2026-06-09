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


class ResourceSummary(BaseModel):
    fuel: int = 0
    repair_kits: int = 0

class GuideProgress(BaseModel):
    total_chapters: int = 0
    completed_chapters: int = 0
    entries_researched: int = 0

class RecentExpedition(BaseModel):
    id: str
    zone_config_id: str
    status: str
    end_time: str | None = None
    loot_summary: str | None = None

class UserStats(BaseModel):
    total_expeditions: int = 0
    completed_expeditions: int = 0
    failed_expeditions: int = 0
    artifacts_crafted: int = 0
    joined_days: int = 0
    total_xp_earned: int = 0
    zones_explored: int = 0
    equipped_artifacts_count: int = 0
    unique_artifacts: int = 0
    resources: ResourceSummary = ResourceSummary()
    guide_progress: GuideProgress = GuideProgress()
    recent_expeditions: list[RecentExpedition] = []
    glitches_fixed: int = 0
    total_purchases: int = 0


@router.get("/stats", response_model=UserStats)
async def get_stats(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    exps = db.table("expeditions").select("*").eq("user_id", user_id).execute().data or []
    inv = db.table("user_inventory").select("item_type,item_config_id,quantity").eq("user_id", user_id).execute().data or []
    profile = db.table("users").select("created_at,level,xp,glitches_fixed,total_purchases").eq("id", user_id).execute().data

    joined_days = 0
    total_xp_earned = 0
    if profile:
        p = profile[0]
        created = datetime.fromisoformat(p["created_at"])
        joined_days = (datetime.now(timezone.utc) - created).days
        level = p.get("level", 1)
        xp = p.get("xp", 0)
        total_xp_earned = xp + level * (level - 1) // 2 * 100

    zones = set()
    for e in exps:
        z = e.get("zone_config_id")
        if z:
            zones.add(z)

    equipped = db.table("user_ships").select("equipped_artifacts").eq("user_id", user_id).execute().data or []
    equipped_count = 0
    for ship in equipped:
        arts = ship.get("equipped_artifacts", [])
        if isinstance(arts, list):
            equipped_count += len(arts)

    unique_artifact_ids = set()
    total_fuel = 0
    total_repair = 0
    for i in inv:
        if i["item_type"] == "artifact":
            unique_artifact_ids.add(i["item_config_id"])
        elif i["item_config_id"].startswith("fuel"):
            total_fuel += i["quantity"]
        elif i["item_config_id"].startswith("repair_kit"):
            total_repair += i["quantity"]

    guide_researched = db.table("guide_progress").select("id", count="exact").eq("user_id", user_id).eq("status", "researched").execute()
    entries_researched = guide_researched.count if guide_researched.count is not None else 0

    chapters = db.table("chapter_progress").select("id", count="exact").eq("user_id", user_id).eq("reward_claimed", True).execute()
    completed_chapters = chapters.count if chapters.count is not None else 0

    total_guide_chapters = 0
    content_dir = getattr(db, "_content_loader", None)
    if content_dir:
        try:
            guide = get_content_loader().get_guide()
            total_guide_chapters = len(guide.get("chapters", []))
        except Exception:
            pass

    sorted_exps = sorted(exps, key=lambda e: e.get("end_time", "") or "", reverse=True)[:5]
    recent = []
    for e in sorted_exps:
        loot = ""
        rd = e.get("result_data")
        if rd and isinstance(rd, dict):
            items = rd.get("loot", [])
            if items:
                loot = ", ".join(f'{l.get("item_config_id", "")}x{l.get("quantity", 1)}' for l in items[:3])
        recent.append(RecentExpedition(
            id=e["id"],
            zone_config_id=e.get("zone_config_id", ""),
            status=e["status"],
            end_time=e.get("end_time"),
            loot_summary=loot if loot else None,
        ))

    glitches_fixed = profile[0].get("glitches_fixed", 0) if profile else 0
    total_purchases = profile[0].get("total_purchases", 0) if profile else 0

    return UserStats(
        total_expeditions=len(exps),
        completed_expeditions=sum(1 for e in exps if e["status"] == "completed"),
        failed_expeditions=sum(1 for e in exps if e["status"] == "failed"),
        artifacts_crafted=sum(i["quantity"] for i in inv if i["item_type"] == "artifact"),
        joined_days=joined_days,
        total_xp_earned=total_xp_earned,
        zones_explored=len(zones),
        equipped_artifacts_count=equipped_count,
        unique_artifacts=len(unique_artifact_ids),
        resources=ResourceSummary(fuel=total_fuel, repair_kits=total_repair),
        guide_progress=GuideProgress(
            total_chapters=total_guide_chapters,
            completed_chapters=completed_chapters,
            entries_researched=entries_researched,
        ),
        recent_expeditions=recent,
        glitches_fixed=glitches_fixed,
        total_purchases=total_purchases,
    )


class AchievementResponse(BaseModel):
    achievement_id: str
    claimed: bool
    claimed_at: str | None = None


@router.get("/achievements")
async def get_achievements(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    result = db.table("user_achievements").select("*").eq("user_id", user_id).execute()
    claimed = {r["achievement_id"]: r["claimed_at"] for r in (result.data or [])}
    return [
        AchievementResponse(
            achievement_id=aid,
            claimed=aid in claimed,
            claimed_at=claimed.get(aid),
        )
        for aid in ["engineer", "explorer", "veteran", "collector", "hardworker",
                     "mechanic", "scholar", "lucky", "steadfast"]
    ]


class ClaimAchievementBody(BaseModel):
    achievement_id: str


@router.post("/achievements/claim")
async def claim_achievement(
    body: ClaimAchievementBody,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
):
    aid = body.achievement_id

    existing = db.table("user_achievements").select("id").eq("user_id", user_id).eq("achievement_id", aid).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Already claimed")

    stats = await get_stats(user_id, db)

    rewards = {
        "engineer": {"xp": 50, "xgen": 0},
        "explorer": {"xp": 100, "xgen": 10},
        "veteran": {"xp": 200, "xgen": 25},
        "collector": {"xp": 100, "xgen": 10},
        "hardworker": {"xp": 200, "xgen": 25},
        "mechanic": {"xp": 150, "xgen": 15},
        "scholar": {"xp": 150, "xgen": 15},
        "lucky": {"xp": 100, "xgen": 10},
        "steadfast": {"xp": 100, "xgen": 10},
    }

    checks = {
        "engineer": stats.artifacts_crafted > 0,
        "explorer": stats.completed_expeditions >= 10,
        "veteran": stats.joined_days > 30,
        "collector": stats.unique_artifacts >= 5,
        "hardworker": stats.completed_expeditions >= 25,
        "mechanic": stats.equipped_artifacts_count >= 8,
        "scholar": stats.guide_progress.entries_researched >= 20,
        "lucky": stats.glitches_fixed >= 5,
        "steadfast": False,  # checked separately via streak_days
    }

    if aid == "steadfast":
        user = db.table("users").select("streak_days").eq("id", user_id).execute().data
        met = (user and user[0].get("streak_days", 0) >= 7)
    else:
        met = checks.get(aid, False)

    if not met:
        raise HTTPException(status_code=400, detail="Conditions not met")

    reward = rewards.get(aid, {"xp": 0, "xgen": 0})

    from app.services.progression import grant_xp
    grant_xp(user_id, reward["xp"], db)

    if reward["xgen"] > 0:
        current = db.table("users").select("balance_xgen").eq("id", user_id).execute().data
        new_xgen = int(current[0]["balance_xgen"]) + reward["xgen"]
        db.table("users").update({"balance_xgen": new_xgen}).eq("id", user_id).execute()

    db.table("user_achievements").insert({
        "user_id": user_id,
        "achievement_id": aid,
    }).execute()

    return {"status": "ok", "achievement_id": aid, "xp_gained": reward["xp"], "xgen_gained": reward["xgen"]}
