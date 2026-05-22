import random
from datetime import datetime, timezone

from supabase import Client

from app.services.content_loader import ContentLoader


def open_box(
    box_id: str,
    user_id: str,
    supabase: Client,
    content: ContentLoader,
) -> dict:
    box = content.get_box(box_id)
    if not box:
        msg = f"Box '{box_id}' not found"
        raise ValueError(msg)

    rewards: dict[str, list[dict]] = {"guaranteed": [], "random": []}

    rng = random.Random()

    for item in box.get("guaranteed", []):
        _apply_reward(item, user_id, supabase, rng, item.get("quantity", 1))
        rewards["guaranteed"].append(item)

    pool = box.get("random_drops", [])
    count = box.get("random_drops_count", 0)
    chosen = _weighted_choices(pool, count, rng)
    for item in chosen:
        qty = rng.randint(item["min"], item["max"])
        _apply_reward(item, user_id, supabase, rng, qty)
        rewards["random"].append({**item, "quantity": qty})

    return rewards


def _apply_reward(
    item: dict,
    user_id: str,
    supabase: Client,
    rng: random.Random,
    quantity: int,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    match item["type"]:
        case "xgen" | "stars" | "xp":
            col = f"balance_{item['type']}" if item["type"] != "xp" else "xp"
            supabase.table("users").update({col: quantity}).eq("id", user_id).execute()
        case "ship":
            ship_id = (
                rng.choice(item["pool"])
                if "pool" in item
                else item["item_id"]
            )
            supabase.table("user_ships").insert({
                "user_id": user_id,
                "ship_config_id": ship_id,
                "stability": item.get("stability", 100),
                "acquired_at": now,
            }).execute()
        case "element" | "resource":
            supabase.table("user_inventory").insert({
                "user_id": user_id,
                "item_type": item["type"],
                "item_config_id": item["item_id"],
                "quantity": quantity,
            }).execute()


def _weighted_choices(
    pool: list[dict],
    count: int,
    rng: random.Random,
) -> list[dict]:
    if not pool or count <= 0:
        return []
    total = sum(it["weight"] for it in pool)
    result = []
    for _ in range(count):
        roll = rng.uniform(0, total)
        cumulative = 0
        for entry in pool:
            cumulative += entry["weight"]
            if roll <= cumulative:
                result.append(entry)
                break
    return result
