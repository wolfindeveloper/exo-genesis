import random

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.core.dependencies import get_content_loader, get_current_user_id, get_db
from app.services.content_loader import ContentLoader

router = APIRouter(prefix="/shop", tags=["shop"])


class BuyRequest(BaseModel):
    item_id: str


@router.get("/catalog")
async def get_catalog(content: ContentLoader = Depends(get_content_loader)):
    return content.shop


@router.post("/buy")
async def buy_item(
    body: BuyRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    shop_item = next((i for i in content.shop if i["id"] == body.item_id), None)
    if not shop_item:
        raise HTTPException(status_code=404, detail="Item not found in catalog")

    price = shop_item["price"]
    currency = price["currency"]
    amount = price["amount"]

    user = db.table("users").select("*").eq("id", user_id).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = user.data[0]

    if currency == "xgen":
        balance = user.get("balance_xgen", 0)
        if (balance or 0) < amount:
            raise HTTPException(status_code=400, detail="Недостаточно ✦ xGen")
    elif currency == "stars":
        balance = user.get("balance_stars", 0)
        if (balance or 0) < amount:
            raise HTTPException(status_code=400, detail="Недостаточно ⭐ Stars")
    else:
        raise HTTPException(status_code=400, detail="Unknown currency")

    rewards = shop_item.get("rewards", [])
    granted: list[dict] = []

    for reward in rewards:
        rtype = reward["type"]
        qty = reward.get("quantity", 1)

        if rtype == "item":
            item_type = reward["item_type"]
            item_config_id = reward["item_config_id"]

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
                db.table("user_inventory").insert({
                    "user_id": user_id,
                    "item_type": item_type,
                    "item_config_id": item_config_id,
                    "quantity": qty,
                }).execute()

            granted.append({"type": rtype, "item_config_id": item_config_id, "quantity": qty})

        elif rtype == "random_artifact":
            tier = reward["tier"]
            pool = [a for a in content.artifacts if a.get("tier") == tier]
            if not pool:
                raise HTTPException(status_code=500, detail="No artifacts found for this tier")

            artifact = random.choice(pool)

            existing = (
                db.table("user_inventory")
                .select("id, quantity")
                .eq("user_id", user_id)
                .eq("item_type", "artifact")
                .eq("item_config_id", artifact["id"])
                .execute()
            )

            if existing.data:
                new_qty = existing.data[0]["quantity"] + qty
                db.table("user_inventory").update({"quantity": new_qty}).eq("id", existing.data[0]["id"]).execute()
            else:
                db.table("user_inventory").insert({
                    "user_id": user_id,
                    "item_type": "artifact",
                    "item_config_id": artifact["id"],
                    "quantity": qty,
                    "metadata": {},
                }).execute()

            granted.append({"type": rtype, "item_config_id": artifact["id"], "tier": tier, "quantity": qty})

        elif rtype == "mystery_box":
            db.table("user_inventory").insert({
                "user_id": user_id,
                "item_type": "resource",
                "item_config_id": "repair_kit",
                "quantity": qty * 3,
            }).execute()

            pool = [a for a in content.artifacts if a.get("tier") and a["tier"] <= 3]
            if pool:
                artifact = random.choice(pool)
                db.table("user_inventory").insert({
                    "user_id": user_id,
                    "item_type": "artifact",
                    "item_config_id": artifact["id"],
                    "quantity": 1,
                    "metadata": {},
                }).execute()
                granted.append({"type": "artifact", "item_config_id": artifact["id"], "tier": artifact.get("tier")})

            granted.append({"type": "resource", "item_config_id": "repair_kit", "quantity": qty * 3})

        elif rtype == "instant_finish":
            db.table("user_inventory").insert({
                "user_id": user_id,
                "item_type": "resource",
                "item_config_id": "repair_kit",
                "quantity": qty * 5,
            }).execute()
            db.table("user_inventory").insert({
                "user_id": user_id,
                "item_type": "resource",
                "item_config_id": "fuel",
                "quantity": qty * 10,
            }).execute()
            granted.append({"type": "resource", "item_config_id": "repair_kit", "quantity": qty * 5})
            granted.append({"type": "resource", "item_config_id": "fuel", "quantity": qty * 10})

    if currency == "xgen":
        db.table("users").update({"balance_xgen": (user.get("balance_xgen", 0) or 0) - amount}).eq("id", user_id).execute()
    elif currency == "stars":
        db.table("users").update({"balance_stars": (user.get("balance_stars", 0) or 0) - amount}).eq("id", user_id).execute()

    updated_user = db.table("users").select("*").eq("id", user_id).execute()
    updated = updated_user.data[0] if updated_user.data else user

    return {
        "status": "ok",
        "granted": granted,
        "balance_xgen": updated.get("balance_xgen", 0),
        "balance_stars": updated.get("balance_stars", 0),
    }
