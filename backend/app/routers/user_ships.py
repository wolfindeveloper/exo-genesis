from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.core.dependencies import (
    get_content_loader,
    get_current_user_id,
    get_db,
)
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


@router.post("/{ship_id}/refuel")
async def refuel_ship(
    ship_id: str,
    body: ShipActionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    ship = await _get_ship_or_404(ship_id, user_id, db)
    if ship["status"] != "idle":
        raise HTTPException(status_code=400, detail="Ship must be idle")

    resource = content.get_resource(body.resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource["resource_type"] != "fuel":
        raise HTTPException(status_code=400, detail="Not a fuel resource")

    fuel_capacity = 100
    current_fuel = ship["fuel_current"]
    if current_fuel >= fuel_capacity:
        raise HTTPException(status_code=400, detail="Fuel already full")

    restore_per_unit = 10
    needed = fuel_capacity - current_fuel
    units_needed = -(-needed // restore_per_unit)

    inv_item = _resolve_inventory(user_id, body.resource_id, db)
    if inv_item["quantity"] < units_needed:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough resources. Need {units_needed}, have {inv_item['quantity']}",
        )

    new_fuel = min(fuel_capacity, current_fuel + units_needed * restore_per_unit)
    actual_used = -(-(new_fuel - current_fuel) // restore_per_unit)

    db.table("user_ships").update({"fuel_current": new_fuel}).eq("id", ship_id).execute()
    db.table("user_inventory").update({
        "quantity": inv_item["quantity"] - actual_used,
    }).eq("id", inv_item["id"]).execute()

    updated_ship = db.table("user_ships").select("*").eq("id", ship_id).execute().data[0]
    updated_inv = db.table("user_inventory").select("*").eq("user_id", user_id).execute().data or []

    return {"ship": updated_ship, "inventory": updated_inv}


@router.post("/{ship_id}/repair")
async def repair_ship(
    ship_id: str,
    body: ShipActionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    ship = await _get_ship_or_404(ship_id, user_id, db)
    if ship["status"] != "idle":
        raise HTTPException(status_code=400, detail="Ship must be idle")

    resource = content.get_resource(body.resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource["resource_type"] != "repair_kit":
        raise HTTPException(status_code=400, detail="Not a repair resource")

    current_stability = ship["stability"]
    if current_stability >= 100:
        raise HTTPException(status_code=400, detail="Stability already full")

    restore_per_unit = 10
    needed = 100 - current_stability
    units_needed = -(-needed // restore_per_unit)

    inv_item = _resolve_inventory(user_id, body.resource_id, db)
    if inv_item["quantity"] < units_needed:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough resources. Need {units_needed}, have {inv_item['quantity']}",
        )

    new_stability = min(100, current_stability + units_needed * restore_per_unit)
    actual_used = -(-(new_stability - current_stability) // restore_per_unit)

    db.table("user_ships").update({"stability": new_stability}).eq("id", ship_id).execute()
    db.table("user_inventory").update({
        "quantity": inv_item["quantity"] - actual_used,
    }).eq("id", inv_item["id"]).execute()

    updated_ship = db.table("user_ships").select("*").eq("id", ship_id).execute().data[0]
    updated_inv = db.table("user_inventory").select("*").eq("user_id", user_id).execute().data or []

    return {"ship": updated_ship, "inventory": updated_inv}
