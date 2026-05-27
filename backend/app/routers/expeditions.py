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
from app.services.content_loader import ContentLoader
from app.services.expedition_logic import calculate_damage, calculate_loot, calculate_zone_stats
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
    ship_id: str
    zone_id: str


class ClaimExpeditionRequest(BaseModel):
    expedition_id: str


def _resolve_item_type(content: ContentLoader, item_config_id: str) -> str:
    if content.get_element(item_config_id):
        return "element"
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
        .eq("id", body.ship_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not ships_result.data:
        raise HTTPException(status_code=404, detail="Ship not found")

    ship = ships_result.data[0]

    if ship["status"] != "idle":
        raise HTTPException(status_code=400, detail="Ship is not idle")

    ship_config = content.get_ship(ship["ship_config_id"])
    if not ship_config:
        raise HTTPException(status_code=404, detail="Ship config not found")

    # Resolve artifact bonuses from equipped artifacts
    artifacts = []
    for a_id in ship.get("equipped_artifacts", []):
        a = content.get_artifact(a_id)
        if a and "stats_modifiers" in a:
            artifacts.append(a["stats_modifiers"])

    stats = calculate_zone_stats(
        zone_config=zone_config,
        ship_stability=ship["stability"],
        ship_speed_mod=ship_config["stats"]["speed_mod"],
        ship_fuel_current=ship["fuel_current"],
        artifact_bonuses=artifacts,
    )

    if not stats["fuel_ok"]:
        raise HTTPException(status_code=400, detail="Insufficient fuel")

    db.table("user_ships").update({
        "status": "expedition",
        "fuel_current": ship["fuel_current"] - stats["effective_fuel_cost"],
    }).eq("id", body.ship_id).execute()

    now = datetime.now(timezone.utc)
    end_time = now + timedelta(hours=stats["effective_duration"])

    expedition_data = {
        "user_id": user_id,
        "ship_id": body.ship_id,
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

    db.table("expeditions").update({
        "status": "completed",
        "result_data": {"loot": loot, "stability_damage": ship["stability"] - new_stability},
    }).eq("id", body.expedition_id).execute()

    return {
        "status": "completed",
        "loot": loot,
        "ship_stability": new_stability,
    }
