from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.core.dependencies import get_content_loader, get_current_user_id, get_db
from app.models.lab import ExperimentRequest, ExperimentResponse
from app.services.content_loader import ContentLoader
from app.services.recipe_generator import get_weekly_recipes, week_seed

router = APIRouter(prefix="/lab", tags=["lab"])


def _consume_elements(db: Client, user_id: str, element_ids: list[str]) -> None:
    for eid in element_ids:
        rows = (
            db.table("user_inventory")
            .select("*")
            .eq("user_id", user_id)
            .eq("item_config_id", eid)
            .eq("item_type", "element")
            .execute()
        ).data
        if rows:
            new_qty = rows[0]["quantity"] - 1
            if new_qty <= 0:
                db.table("user_inventory").delete().eq("id", rows[0]["id"]).execute()
            else:
                db.table("user_inventory").update({"quantity": new_qty}).eq("id", rows[0]["id"]).execute()


@router.post("/experiment", response_model=ExperimentResponse)
async def experiment(
    body: ExperimentRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
    content: ContentLoader = Depends(get_content_loader),
):
    if len(body.element_ids) < 2 or len(body.element_ids) > 3:
        raise HTTPException(status_code=400, detail="Need 2 or 3 elements")

    if len(set(body.element_ids)) != len(body.element_ids):
        raise HTTPException(status_code=400, detail="Duplicate elements not allowed")

    for eid in body.element_ids:
        if not content.get_element(eid):
            raise HTTPException(status_code=404, detail=f"Element not found: {eid}")

    for eid in body.element_ids:
        rows = (
            db.table("user_inventory")
            .select("*")
            .eq("user_id", user_id)
            .eq("item_config_id", eid)
            .eq("item_type", "element")
            .execute()
        ).data
        if not rows or rows[0]["quantity"] < 1:
            raise HTTPException(status_code=400, detail=f"Not enough {eid} in inventory")

    week = week_seed()
    recipes = get_weekly_recipes(content)
    recipe_key = ":".join(sorted(body.element_ids))
    recipe = recipes.get(recipe_key)

    _consume_elements(db, user_id, body.element_ids)

    if not recipe:
        user_row = db.table("users").select("xp").eq("id", user_id).execute().data
        if user_row:
            db.table("users").update({"xp": (user_row[0]["xp"] or 0) + 5}).eq("id", user_id).execute()
        return ExperimentResponse(success=False, xp_gained=5)

    is_first = False
    existing = (
        db.table("discoveries")
        .select("*")
        .eq("artifact_config_id", recipe["artifact_id"])
        .eq("week_seed", week)
        .execute()
    ).data
    if not existing:
        is_first = True
        db.table("discoveries").insert({
            "artifact_config_id": recipe["artifact_id"],
            "week_seed": week,
            "discoverer_user_id": user_id,
        }).execute()

    existing_inv = (
        db.table("user_inventory")
        .select("*")
        .eq("user_id", user_id)
        .eq("item_config_id", recipe["artifact_id"])
        .eq("item_type", "artifact")
        .execute()
    ).data
    if existing_inv:
        db.table("user_inventory").update({
            "quantity": existing_inv[0]["quantity"] + 1,
        }).eq("id", existing_inv[0]["id"]).execute()
    else:
        db.table("user_inventory").insert({
            "user_id": user_id,
            "item_type": "artifact",
            "item_config_id": recipe["artifact_id"],
            "quantity": 1,
            "metadata": recipe.get("stats_modifiers", {}),
        }).execute()

    xp_gain = 25 if is_first else 10
    user_row = db.table("users").select("xp").eq("id", user_id).execute().data
    if user_row:
        db.table("users").update({"xp": (user_row[0]["xp"] or 0) + xp_gain}).eq("id", user_id).execute()

    return ExperimentResponse(
        success=True,
        artifact_id=recipe["artifact_id"],
        artifact_name_key=recipe["artifact_name_key"],
        artifact_tier=recipe["tier"],
        artifact_rarity=recipe["rarity"],
        stats_modifiers=recipe.get("stats_modifiers", {}),
        is_first_discoverer=is_first,
        xp_gained=xp_gain,
    )
