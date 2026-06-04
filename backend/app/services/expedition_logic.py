import hashlib
import random
from datetime import datetime, timezone

from app.services.content_loader import ContentLoader


def _rng(seed_base: str, zone_id: str, user_id: str) -> random.Random:
    combined = f"{seed_base}:{zone_id}:{user_id}:{datetime.now(timezone.utc).strftime('%Y%m%d%H')}"
    digest = hashlib.sha256(combined.encode()).hexdigest()
    return random.Random(int(digest[:8], 16))


def calculate_zone_stats(
    zone_config: dict,
    ship_stability: float,
    ship_speed_mod: float,
    ship_fuel_current: int,
    artifact_bonuses: list[dict] | None = None,
) -> dict:
    total_speed_bonus = sum(a.get("speed_mod", 0) for a in (artifact_bonuses or []))
    total_stability_bonus = sum(a.get("stability_bonus", 0) for a in (artifact_bonuses or []))
    total_fuel_efficiency = sum(a.get("fuel_efficiency", 0) for a in (artifact_bonuses or []))

    risk_factor = zone_config.get("risk_factor", 0.1)
    fuel_cost = zone_config.get("fuel_cost", 10)
    duration_hours = zone_config.get("duration_hours", 4)

    effective_risk = risk_factor * (1 - ship_stability / 200) - total_stability_bonus
    effective_fuel_cost = fuel_cost * (1 - total_fuel_efficiency)
    effective_duration = duration_hours / ship_speed_mod * (1 - total_speed_bonus)

    return {
        "effective_risk": round(max(0, effective_risk), 4),
        "effective_fuel_cost": max(0, round(effective_fuel_cost)),
        "effective_duration": max(0.017, round(effective_duration, 3)),
        "fuel_ok": ship_fuel_current >= max(0, round(effective_fuel_cost)),
        "estimated_max_damage": round(max(0, effective_risk * 15), 1),
    }


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
    return round(max(0, stability - damage), 1)
