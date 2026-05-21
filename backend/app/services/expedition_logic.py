import hashlib
import random
from datetime import datetime, timezone

from app.services.content_loader import ContentLoader


def _rng(seed_base: str, zone_id: str, user_id: str) -> random.Random:
    combined = f"{seed_base}:{zone_id}:{user_id}:{datetime.now(timezone.utc).strftime('%Y%m%d%H')}"
    digest = hashlib.sha256(combined.encode()).hexdigest()
    return random.Random(int(digest[:8], 16))


def calculate_loot(
    zone_config: dict,
    user_id: str,
    content: ContentLoader,
    seed_base: str = "exo-genesis-2026",
) -> list[dict]:
    rng = _rng(seed_base, zone_config["id"], user_id)
    loot_table = zone_config.get("loot_table", [])
    if not loot_table:
        return []

    total_weight = sum(item["weight"] for item in loot_table)
    roll = rng.uniform(0, total_weight)
    cumulative = 0
    chosen = loot_table[0]
    for item in loot_table:
        cumulative += item["weight"]
        if roll <= cumulative:
            chosen = item
            break

    quantity = rng.randint(chosen["min"], chosen["max"])
    return [{"item_config_id": chosen["item_id"], "quantity": quantity}]


def calculate_damage(risk_factor: float, stability: float, rng: random.Random) -> float:
    damage = risk_factor * rng.uniform(5, 15)
    return round(max(0, min(stability - damage, stability)), 1)
