import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

logger = logging.getLogger(__name__)

from app.core.dependencies import (
    get_content_loader,
    get_current_user_id,
    get_db,
)
from app.services.artifact_resolver import resolve_effective_stats
from app.services.content_loader import ContentLoader

router = APIRouter(prefix="/user/ships", tags=["user_ships"])


class ShipActionRequest(BaseModel):
    resource_id: str


async def _get_ship_or_404(ship_id: str, user_id: str, db: Client) -> dict:
    result = db.table("user_ships").select("*").eq("id", ship_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ship not found")
    return result.data[0]


def _resolve_inventory(user_id: str, resource_id: str, db: Client) -> dict:
    result = db.table("user_inventory").select("*").eq("user_id", user_id).eq("item_config_id", resource_id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="No such resource in inventory")
    return result.data[0]


def _enrich_ship(ship: dict, content: ContentLoader) -> dict:
    ship_config = content.get_ship(ship.get("ship_config_id", "")) or {}
    resolved = resolve_effective_stats(
        ship_config,
        ship.get("equipped_artifacts", []),
        content,
    )
    ship["resolved_artifacts"] = resolved["resolved_artifacts"]
    ship["effective_stats"] = resolved["effective_stats"]
    return ship


RESOURCE_TYPE_MAP = {
    "fuel": {"field": "fuel_current", "resource_type": "fuel"},
    "repair_kit": {"field": "stability", "resource_type": "repair_kit"},
}


def _use_resource_on_ship(
    ship: dict,
    resource: dict,
    max_val: float,
    restore_per_unit: int,
    db: Client,
) -> dict:
    field = RESOURCE_TYPE_MAP[resource["id"]]["field"]
    current = ship[field]
    if current >= max_val:
        return {"applied": 0}

    needed = max_val - current
    units_needed = -(-needed // restore_per_unit)

    inv_item = _resolve_inventory(ship["user_id"], resource["id"], db)
    actual_used = min(inv_item["quantity"], units_needed)
    raw = current + actual_used * restore_per_unit
    new_val = min(max_val, raw)
    if field == "fuel_current":
        new_val = int(new_val)

    db.table("user_ships").update({field: new_val}).eq("id", ship["id"]).execute()
    db.table("user_inventory").update({
        "quantity": int(inv_item["quantity"] - actual_used),
    }).eq("id", inv_item["id"]).execute()

    return {"applied": actual_used * restore_per_unit}


@router.post("/{ship_id}/refuel")
async def refuel_ship(
    ship_id: str,
    body: ShipActionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    try:
        ship = await _get_ship_or_404(ship_id, user_id, db)
        if ship["status"] != "idle":
            raise HTTPException(status_code=400, detail="Ship must be idle")

        resource = content.get_resource(body.resource_id)
        if not resource or resource.get("resource_type") != "fuel":
            raise HTTPException(status_code=400, detail="Not a fuel resource")

        ship_config = content.get_ship(ship["ship_config_id"]) or {}
        resolved = resolve_effective_stats(ship_config, ship.get("equipped_artifacts", []), content)
        max_fuel = resolved["effective_stats"]["max_fuel"]

        if ship["fuel_current"] >= max_fuel:
            raise HTTPException(status_code=400, detail="Fuel already full")

        _use_resource_on_ship(ship, resource, max_fuel, 10, db)

        updated_ship = _enrich_ship(
            db.table("user_ships").select("*").eq("id", ship_id).execute().data[0], content,
        )
        updated_inv = db.table("user_inventory").select("*").eq("user_id", user_id).execute().data or []
        return {"ship": updated_ship, "inventory": updated_inv}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("refuel_ship failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Refuel failed: {e}")


@router.post("/{ship_id}/repair")
async def repair_ship(
    ship_id: str,
    body: ShipActionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    try:
        ship = await _get_ship_or_404(ship_id, user_id, db)
        if ship["status"] != "idle":
            raise HTTPException(status_code=400, detail="Ship must be idle")

        resource = content.get_resource(body.resource_id)
        if not resource or resource.get("resource_type") != "repair_kit":
            raise HTTPException(status_code=400, detail="Not a repair resource")

        ship_config = content.get_ship(ship["ship_config_id"]) or {}
        resolved = resolve_effective_stats(ship_config, ship.get("equipped_artifacts", []), content)
        max_stability = resolved["effective_stats"]["max_stability"]

        if ship["stability"] >= max_stability:
            raise HTTPException(status_code=400, detail="Stability already full")

        _use_resource_on_ship(ship, resource, max_stability, 10, db)

        updated_ship = _enrich_ship(
            db.table("user_ships").select("*").eq("id", ship_id).execute().data[0], content,
        )
        updated_inv = db.table("user_inventory").select("*").eq("user_id", user_id).execute().data or []
        return {"ship": updated_ship, "inventory": updated_inv}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("repair_ship failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Repair failed: {e}")


class EquipRequest(BaseModel):
    slot_index: int
    artifact_id: str


class UnequipRequest(BaseModel):
    slot_index: int


@router.post("/{ship_id}/equip")
async def equip_slot(
    ship_id: str,
    body: EquipRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    if body.slot_index < 0 or body.slot_index > 7:
        raise HTTPException(status_code=400, detail="Slot index must be 0-7")

    artifact = content.get_artifact(body.artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")

    ship = await _get_ship_or_404(ship_id, user_id, db)
    if ship["status"] != "idle":
        raise HTTPException(status_code=400, detail="Ship must be idle")

    inv_item = _resolve_inventory(user_id, body.artifact_id, db)

    equipped = list(ship.get("equipped_artifacts", []))

    while len(equipped) < 8:
        equipped.append(None)

    old_artifact_id = equipped[body.slot_index]
    equipped[body.slot_index] = body.artifact_id

    db.table("user_ships").update({"equipped_artifacts": equipped}).eq("id", ship_id).execute()

    if old_artifact_id:
        old_inv = db.table("user_inventory").select("*").eq("user_id", user_id).eq("item_config_id", old_artifact_id).execute()
        if old_inv.data:
            db.table("user_inventory").update({"quantity": old_inv.data[0]["quantity"] + 1}).eq("id", old_inv.data[0]["id"]).execute()
        else:
            db.table("user_inventory").insert({
                "user_id": user_id,
                "item_type": "artifact",
                "item_config_id": old_artifact_id,
                "quantity": 1,
            }).execute()

    new_qty = inv_item["quantity"] - 1
    if new_qty <= 0:
        db.table("user_inventory").delete().eq("id", inv_item["id"]).execute()
    else:
        db.table("user_inventory").update({"quantity": new_qty}).eq("id", inv_item["id"]).execute()

    updated_ship = _enrich_ship(
        db.table("user_ships").select("*").eq("id", ship_id).execute().data[0],
        content,
    )
    updated_inv = db.table("user_inventory").select("*").eq("user_id", user_id).execute().data or []

    return {"ship": updated_ship, "inventory": updated_inv}


@router.post("/{ship_id}/unequip")
async def unequip_slot(
    ship_id: str,
    body: UnequipRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    if body.slot_index < 0 or body.slot_index > 7:
        raise HTTPException(status_code=400, detail="Slot index must be 0-7")

    ship = await _get_ship_or_404(ship_id, user_id, db)
    if ship["status"] != "idle":
        raise HTTPException(status_code=400, detail="Ship must be idle")

    equipped = list(ship.get("equipped_artifacts", []))
    if body.slot_index >= len(equipped) or not equipped[body.slot_index]:
        raise HTTPException(status_code=400, detail="Slot is empty")

    artifact_id = equipped[body.slot_index]
    equipped[body.slot_index] = None

    db.table("user_ships").update({"equipped_artifacts": equipped}).eq("id", ship_id).execute()

    existing = db.table("user_inventory").select("*").eq("user_id", user_id).eq("item_config_id", artifact_id).execute()
    if existing.data:
        db.table("user_inventory").update({"quantity": existing.data[0]["quantity"] + 1}).eq("id", existing.data[0]["id"]).execute()
    else:
        db.table("user_inventory").insert({
            "user_id": user_id,
            "item_type": "artifact",
            "item_config_id": artifact_id,
            "quantity": 1,
        }).execute()

    updated_ship = _enrich_ship(
        db.table("user_ships").select("*").eq("id", ship_id).execute().data[0],
        content,
    )
    updated_inv = db.table("user_inventory").select("*").eq("user_id", user_id).execute().data or []

    return {"ship": updated_ship, "inventory": updated_inv}
