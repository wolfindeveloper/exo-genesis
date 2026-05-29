import hashlib
import random
from datetime import datetime, timezone

from app.services.content_loader import ContentLoader

_WEEKLY_POOL: dict[str, dict[str, dict]] = {}


def week_seed(dt: datetime | None = None) -> str:
    iso = (dt or datetime.now(timezone.utc)).isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}"


def generate_weekly_recipes(content: ContentLoader, seed: str | None = None) -> dict[str, dict]:
    week = seed or week_seed()

    pool = content.artifacts
    if not pool:
        return {}

    if week in _WEEKLY_POOL:
        return _WEEKLY_POOL[week]

    elements = content.elements
    eids = [e["id"] for e in elements]
    if not eids:
        return {}

    rng_seed = int(hashlib.sha256(week.encode()).hexdigest()[:8], 16)
    rng = random.Random(rng_seed)

    shuffled = list(pool)
    rng.shuffle(shuffled)
    weekly_artifacts = shuffled[:15]

    recipes: dict[str, dict] = {}
    used_keys: set[str] = set()

    for artifact in weekly_artifacts:
        stats = artifact.get("stats_modifiers") or {}
        if not stats:
            stats = {"speed_mod": 0.05}

        for _ in range(50):
            n = rng.choice([2, 3])
            combo = rng.sample(eids, n)
            key = ":".join(sorted(combo))
            if key not in used_keys:
                used_keys.add(key)
                recipes[key] = {
                    "artifact_id": artifact["id"],
                    "artifact_name_key": artifact["name_key"],
                    "artifact_desc_key": artifact.get("description_key", ""),
                    "tier": artifact["tier"],
                    "rarity": artifact["rarity"],
                    "input_elements": sorted(combo),
                    "stats_modifiers": stats,
                }
                break

    _WEEKLY_POOL[week] = recipes
    return recipes


def get_weekly_recipes(content: ContentLoader, seed: str | None = None) -> dict[str, dict]:
    return generate_weekly_recipes(content, seed)
