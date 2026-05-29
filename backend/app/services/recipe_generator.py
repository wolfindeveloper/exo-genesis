import hashlib
import random
from datetime import datetime, timezone

from app.services.content_loader import ContentLoader

_recipe_cache: dict[str, dict[str, dict]] = {}


def week_seed(dt: datetime | None = None) -> str:
    iso = (dt or datetime.now(timezone.utc)).isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}"


def _recipe_key(element_ids: list[str]) -> str:
    return ":".join(sorted(element_ids))


def _make_artifact(combo: list[str], elements: list[dict], rng: random.Random, artifacts_pool: list[dict]) -> dict:
    combo_els = [e for e in elements if e["id"] in combo]
    avg_tier = sum(e["tier"] for e in combo_els) / len(combo_els)
    result_tier = max(1, min(5, round(avg_tier + rng.uniform(-0.5, 1.0))))

    rarities = ["common", "uncommon", "rare", "epic", "legendary"]
    result_rarity = rarities[result_tier - 1]

    digest = hashlib.md5(":".join(sorted(combo)).encode()).hexdigest()[:8]
    artifact_id = f"artifact_{digest}"

    stats = {}
    if rng.random() < 0.4:
        stats["speed_mod"] = round(rng.uniform(0.05, 0.15) * result_tier, 2)
    if rng.random() < 0.4:
        stats["stability_bonus"] = round(rng.uniform(2, 5) * result_tier, 1)
    if rng.random() < 0.3:
        stats["fuel_efficiency"] = round(rng.uniform(0.05, 0.1) * result_tier, 2)

    name_entry = artifacts_pool[int(digest, 16) % len(artifacts_pool)] if artifacts_pool else None
    artifact_name = name_entry["name_key"] if name_entry else artifact_id
    artifact_desc = name_entry.get("description_key", "") if name_entry else ""

    return {
        "artifact_id": artifact_id,
        "artifact_name_key": artifact_name,
        "artifact_desc_key": artifact_desc,
        "tier": result_tier,
        "rarity": result_rarity,
        "input_elements": sorted(combo),
        "stats_modifiers": stats or {"speed_mod": 0.05},
    }


def generate_recipes(content: ContentLoader, seed: str | None = None) -> dict[str, dict]:
    week = seed or week_seed()
    if week in _recipe_cache:
        return _recipe_cache[week]

    elements = content.elements
    artifacts_pool = content.artifacts or []
    digest = hashlib.sha256(week.encode()).hexdigest()[:8]
    rng = random.Random(int(digest, 16))

    recipes: dict[str, dict] = {}
    eids = [e["id"] for e in elements]

    for i in range(len(eids)):
        for j in range(i + 1, len(eids)):
            if rng.random() < 0.3:
                key = _recipe_key([eids[i], eids[j]])
                recipes[key] = _make_artifact([eids[i], eids[j]], elements, rng, artifacts_pool)

    for i in range(len(eids)):
        for j in range(i + 1, len(eids)):
            for k in range(j + 1, len(eids)):
                if rng.random() < 0.15:
                    key = _recipe_key([eids[i], eids[j], eids[k]])
                    recipes[key] = _make_artifact([eids[i], eids[j], eids[k]], elements, rng, artifacts_pool)

    _recipe_cache[week] = recipes
    return recipes


def get_weekly_recipes(content: ContentLoader, seed: str | None = None) -> dict[str, dict]:
    return generate_recipes(content, seed)
