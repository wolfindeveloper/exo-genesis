from app.services.content_loader import ContentLoader


def resolve_effective_stats(
    ship_config: dict,
    equipped_artifact_ids: list[str | None],
    content: ContentLoader,
) -> dict:
    base_stats = ship_config.get("stats", {})
    base_stability = base_stats.get("stability", 100)
    base_fuel = base_stats.get("fuel_capacity", 100)
    base_speed = base_stats.get("speed_mod", 1.0)

    total_stability_bonus = 0.0
    total_speed_bonus = 0.0
    total_fuel_efficiency = 0.0

    resolved_artifacts = []
    for a_id in equipped_artifact_ids:
        if not a_id:
            resolved_artifacts.append(None)
            continue
        a = content.get_artifact(a_id)
        if a:
            resolved_artifacts.append(a)
            mods = a.get("stats_modifiers", {})
            total_stability_bonus += mods.get("stability_bonus", 0)
            total_speed_bonus += mods.get("speed_mod", 0)
            total_fuel_efficiency += mods.get("fuel_efficiency", 0)
        else:
            resolved_artifacts.append(None)

    return {
        "resolved_artifacts": resolved_artifacts,
        "effective_stats": {
            "max_stability": base_stability + total_stability_bonus,
            "max_fuel": base_fuel,
            "speed_mod": base_speed,
            "total_stability_bonus": total_stability_bonus,
            "total_speed_bonus": total_speed_bonus,
            "total_fuel_efficiency": total_fuel_efficiency,
        },
    }
