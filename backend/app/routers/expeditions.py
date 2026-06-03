import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.core.config import settings
from app.core.dependencies import (
    get_content_loader,
    get_current_user_id,
    get_db,
)
from app.models.expedition import Expedition
from app.services.artifact_resolver import resolve_effective_stats
from app.services.content_loader import ContentLoader
from app.services.expedition_logic import calculate_damage, calculate_loot, calculate_zone_stats
from app.services.progression import grant_xp
from app.services.telegram import notify_expedition_complete

router = APIRouter(prefix="/expeditions", tags=["expeditions"])


@router.get("/active", response_model=list[Expedition])
async def get_active_expeditions(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    result = (
        db.table("expeditions")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "active")
        .execute()
    )
    rows = result.data
    now = datetime.now(timezone.utc)

    for row in rows:
        end = datetime.fromisoformat(row["end_time"])
        if end > now:
            continue
        result_data = row.get("result_data") or {}
        if result_data.get("notified"):
            continue
        ship_result = db.table("user_ships").select("ship_config_id").eq("id", row["ship_id"]).execute()
        ship_config_id = ship_result.data[0]["ship_config_id"] if ship_result.data else row["ship_id"]
        ship_cfg = content.get_ship(ship_config_id)
        zone_cfg = content.get_zone(row["zone_config_id"])
        ship_name = ship_cfg.get("name_key", ship_config_id.replace("_", " ")) if ship_cfg else ship_config_id.replace("_", " ")
        zone_name = zone_cfg.get("name_key", row["zone_config_id"].replace("_", " ")) if zone_cfg else row["zone_config_id"].replace("_", " ")
        chat_id = int(user_id)
        await notify_expedition_complete(settings.bot_token, chat_id, ship_name, zone_name, settings.frontend_url)
        result_data["notified"] = True
        db.table("expeditions").update({"result_data": result_data}).eq("id", row["id"]).execute()

    return [Expedition(**row) for row in rows]


class StartExpeditionRequest(BaseModel):
    zone_id: str


class ClaimExpeditionRequest(BaseModel):
    expedition_id: str


def _resolve_item_type(content: ContentLoader, item_config_id: str) -> str:
    if content.get_resource(item_config_id):
        return "resource"
    if content.get_artifact(item_config_id):
        return "artifact"
    return "resource"


@router.post("/start", response_model=Expedition)
async def start_expedition(
    body: StartExpeditionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    zone_config = content.get_zone(body.zone_id)
    if not zone_config:
        raise HTTPException(status_code=404, detail="Zone not found")

    ships_result = (
        db.table("user_ships")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    if not ships_result.data:
        raise HTTPException(status_code=404, detail="No ships found")
    ship = ships_result.data[0]

    active_exp = (
        db.table("expeditions")
        .select("id")
        .eq("user_id", user_id)
        .eq("status", "active")
        .execute()
    )
    if active_exp.data:
        raise HTTPException(status_code=400, detail="Expedition already in progress")

    if ship["status"] != "idle":
        raise HTTPException(status_code=400, detail="Ship is not idle")

    ship_config = content.get_ship(ship["ship_config_id"]) or {}
    ship_speed_mod = (ship_config.get("stats") or {}).get("speed_mod", 1.0)

    resolved = resolve_effective_stats(
        ship_config,
        ship.get("equipped_artifacts", []),
        content,
    )
    eff = resolved["effective_stats"]
    artifacts = [{
        "speed_mod": eff["total_speed_bonus"],
        "stability_bonus": eff["total_stability_bonus"],
        "fuel_efficiency": eff["total_fuel_efficiency"],
    }] if (eff["total_speed_bonus"] or eff["total_stability_bonus"] or eff["total_fuel_efficiency"]) else []

    stats = calculate_zone_stats(
        zone_config=zone_config,
        ship_stability=ship["stability"],
        ship_speed_mod=ship_speed_mod,
        ship_fuel_current=ship["fuel_current"],
        artifact_bonuses=artifacts,
    )

    if not stats["fuel_ok"]:
        raise HTTPException(status_code=400, detail="Insufficient fuel")

    new_fuel = ship["fuel_current"] - stats["effective_fuel_cost"]
    db.table("user_ships").update({
        "status": "expedition",
        "fuel_current": new_fuel,
    }).eq("id", ship["id"]).execute()

    if 0 < new_fuel <= 5:
        existing = db.table("user_events").select("id").eq("user_id", user_id).eq("event_key", "fuel_below_5").execute()
        if not existing.data:
            db.table("user_events").insert({"user_id": user_id, "event_key": "fuel_below_5"}).execute()

    now = datetime.now(timezone.utc)
    end_time = now + timedelta(hours=stats["effective_duration"])

    expedition_data = {
        "user_id": user_id,
        "ship_id": ship["id"],
        "zone_config_id": body.zone_id,
        "start_time": now.isoformat(),
        "end_time": end_time.isoformat(),
        "status": "active",
    }
    result = db.table("expeditions").insert(expedition_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create expedition")

    return Expedition(**result.data[0])


@router.post("/claim", response_model=dict)
async def claim_expedition(
    body: ClaimExpeditionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    exp_result = (
        db.table("expeditions")
        .select("*")
        .eq("id", body.expedition_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not exp_result.data:
        raise HTTPException(status_code=404, detail="Expedition not found")

    expedition = exp_result.data[0]

    if expedition["status"] != "active":
        raise HTTPException(status_code=400, detail="Expedition already completed")

    now = datetime.now(timezone.utc)
    end_time = datetime.fromisoformat(expedition["end_time"])
    if now < end_time:
        remaining = (end_time - now).total_seconds()
        raise HTTPException(
            status_code=400,
            detail=f"Expedition not finished yet. {int(remaining)}s remaining",
        )

    zone_config = content.get_zone(expedition["zone_config_id"])
    if not zone_config:
        raise HTTPException(status_code=404, detail="Zone config not found")

    loot = calculate_loot(zone_config, user_id, content)
    ship = (
        db.table("user_ships")
        .select("*")
        .eq("id", expedition["ship_id"])
        .execute()
    ).data[0]

    rng = random.Random()
    new_stability = calculate_damage(
        zone_config.get("risk_factor", 0.1),
        ship["stability"],
        rng,
    )

    db.table("user_ships").update({
        "status": "idle",
        "stability": new_stability,
        "fuel_current": max(0, ship["fuel_current"]),
    }).eq("id", expedition["ship_id"]).execute()

    for item in loot:
        if item["item_config_id"] == "fragments":
            cur = db.table("users").select("balance_fragments").eq("id", user_id).execute().data
            new_val = (cur[0]["balance_fragments"] if cur else 0) + item["quantity"]
            db.table("users").update({"balance_fragments": new_val}).eq("id", user_id).execute()
        else:
            existing = (
                db.table("user_inventory")
                .select("*")
                .eq("user_id", user_id)
                .eq("item_config_id", item["item_config_id"])
                .execute()
            )
            if existing.data:
                db.table("user_inventory").update({
                    "quantity": existing.data[0]["quantity"] + item["quantity"],
                }).eq("id", existing.data[0]["id"]).execute()
            else:
                item_type = _resolve_item_type(content, item["item_config_id"])
                db.table("user_inventory").insert({
                    "user_id": user_id,
                    "item_type": item_type,
                    "item_config_id": item["item_config_id"],
                    "quantity": item["quantity"],
                    "metadata": {},
                }).execute()

    zone_tier = zone_config.get("tier", 1)
    xp_reward = zone_tier * 25
    xp_result = grant_xp(user_id, xp_reward, db)

    db.table("expeditions").update({
        "status": "completed",
        "result_data": {"loot": loot, "stability_damage": ship["stability"] - new_stability, "xp_gained": xp_reward},
    }).eq("id", body.expedition_id).execute()

    return {
        "status": "completed",
        "loot": loot,
        "ship_stability": new_stability,
        "xp_gained": xp_reward,
        "level": xp_result["level"],
        "leveled_up": xp_result["leveled_up"],
    }
