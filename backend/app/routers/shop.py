import random

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.core.dependencies import get_content_loader, get_current_user_id, get_db
from app.services.content_loader import ContentLoader

router = APIRouter(prefix="/shop", tags=["shop"])


class BuyRequest(BaseModel):
    item_id: str


def _artifact_to_catalog_item(artifact: dict) -> dict:
    return {
        "id": artifact["id"],
        "category": "artifacts",
        "name_key": artifact["name_key"],
        "description_key": artifact["description_key"],
        "price": artifact["price"],
        "icon_path": artifact.get("icon_path", ""),
        "tier": artifact["tier"],
        "rarity": artifact["rarity"],
        "stats_modifiers": artifact.get("stats_modifiers", {}),
        "type": "artifact",
    }


def _add_or_update_inventory(
    db: Client,
    user_id: str,
    item_type: str,
    item_config_id: str,
    qty: int,
    metadata: dict | None = None,
) -> None:
    existing = (
        db.table("user_inventory")
        .select("id, quantity")
        .eq("user_id", user_id)
        .eq("item_type", item_type)
        .eq("item_config_id", item_config_id)
        .execute()
    )
    if existing.data:
        new_qty = existing.data[0]["quantity"] + qty
        db.table("user_inventory").update({"quantity": new_qty}).eq("id", existing.data[0]["id"]).execute()
    else:
        row = {"user_id": user_id, "item_type": item_type, "item_config_id": item_config_id, "quantity": qty}
        if metadata is not None:
            row["metadata"] = metadata
        db.table("user_inventory").insert(row).execute()


@router.get("/catalog")
async def get_catalog(content: ContentLoader = Depends(get_content_loader)):
    shop_items = list(content.shop)
    artifact_items = [
        _artifact_to_catalog_item(a)
        for a in content.artifacts
        if a.get("shop_available", True)
    ]
    return shop_items + artifact_items


@router.post("/buy")
async def buy_item(
    body: BuyRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    artifact = next(
        (a for a in content.artifacts if a["id"] == body.item_id and a.get("shop_available", True)),
        None,
    )
    shop_item = next((i for i in content.shop if i["id"] == body.item_id), None)

    if artifact:
        price = artifact["price"]
        currency = price["currency"]
        amount = price["amount"]
        is_artifact = True
    elif shop_item:
        price = shop_item["price"]
        currency = price["currency"]
        amount = price["amount"]
        is_artifact = False
    else:
        raise HTTPException(status_code=404, detail="Item not found in catalog")

    user = db.table("users").select("*").eq("id", user_id).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = user.data[0]

    if currency == "xgen":
        balance = int(user.get("balance_xgen", 0) or 0)
        if balance < amount:
            raise HTTPException(status_code=400, detail="Недостаточно ✦ xGen")
    elif currency == "stars":
        balance = int(user.get("balance_stars", 0) or 0)
        if balance < amount:
            raise HTTPException(status_code=400, detail="Недостаточно ⭐ Stars")
    else:
        raise HTTPException(status_code=400, detail="Unknown currency")

    granted: list[dict] = []

    if is_artifact:
        _add_or_update_inventory(db, user_id, "artifact", artifact["id"], 1, metadata={})
        granted.append({
            "type": "artifact",
            "item_config_id": artifact["id"],
            "name_key": artifact["name_key"],
            "tier": artifact["tier"],
        })
    else:
        rewards = shop_item.get("rewards", [])
        for reward in rewards:
            rtype = reward["type"]
            qty = reward.get("quantity", 1)

            if rtype == "item":
                item_type = reward["item_type"]
                item_config_id = reward["item_config_id"]

                if item_type == "fragment":
                    cur = db.table("users").select("balance_fragments").eq("id", user_id).execute().data
                    new_frags = (cur[0]["balance_fragments"] if cur else 0) + qty
                    db.table("users").update({"balance_fragments": new_frags}).eq("id", user_id).execute()
                else:
                    _add_or_update_inventory(db, user_id, item_type, item_config_id, qty)

                granted.append({
                    "type": rtype if item_type == "fragment" else item_type,
                    "item_config_id": item_config_id,
                    "name_key": _resolve_name(content, item_type, item_config_id),
                    "quantity": qty,
                })

            elif rtype == "mystery_box":
                _add_or_update_inventory(db, user_id, "resource", "repair_kit", qty * 3)
                granted.append({
                    "type": "resource",
                    "item_config_id": "repair_kit",
                    "name_key": _resolve_name(content, "resource", "repair_kit"),
                    "quantity": qty * 3,
                })

                pool = [a for a in content.artifacts if a.get("tier") and a["tier"] <= 3 and a.get("shop_available", True)]
                if pool:
                    ra = random.choice(pool)
                    _add_or_update_inventory(db, user_id, "artifact", ra["id"], 1, metadata={})
                    granted.append({
                        "type": "artifact",
                        "item_config_id": ra["id"],
                        "name_key": ra["name_key"],
                        "tier": ra.get("tier"),
                    })

            elif rtype == "instant_finish":
                _add_or_update_inventory(db, user_id, "resource", "repair_kit", qty * 5)
                _add_or_update_inventory(db, user_id, "resource", "fuel", qty * 10)
                granted.append({
                    "type": "resource",
                    "item_config_id": "repair_kit",
                    "name_key": _resolve_name(content, "resource", "repair_kit"),
                    "quantity": qty * 5,
                })
                granted.append({
                    "type": "resource",
                    "item_config_id": "fuel",
                    "name_key": _resolve_name(content, "resource", "fuel"),
                    "quantity": qty * 10,
                })

    if currency == "xgen":
        db.table("users").update({"balance_xgen": int(user.get("balance_xgen", 0) or 0) - amount}).eq("id", user_id).execute()
    elif currency == "stars":
        db.table("users").update({"balance_stars": int(user.get("balance_stars", 0) or 0) - amount}).eq("id", user_id).execute()

    updated_user = db.table("users").select("*").eq("id", user_id).execute()
    updated = updated_user.data[0] if updated_user.data else user

    return {
        "status": "ok",
        "granted": granted,
        "balance_xgen": int(updated.get("balance_xgen", 0) or 0),
        "balance_stars": int(updated.get("balance_stars", 0) or 0),
    }


def _resolve_name(content: ContentLoader, item_type: str, item_config_id: str) -> str:
    if item_type == "resource":
        r = next((x for x in content.resources if x["id"] == item_config_id), None)
        if r:
            return r.get("name_key", item_config_id)
    return item_config_id
