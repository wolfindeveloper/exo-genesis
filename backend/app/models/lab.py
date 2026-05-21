from pydantic import BaseModel


class ExperimentRequest(BaseModel):
    element_ids: list[str]


class ExperimentResponse(BaseModel):
    success: bool
    artifact_id: str | None = None
    artifact_name_key: str | None = None
    artifact_tier: int | None = None
    artifact_rarity: str | None = None
    stats_modifiers: dict | None = None
    is_first_discoverer: bool = False
    xp_gained: int = 0


class WeekInfo(BaseModel):
    week_seed: str
    total_recipes: int
    discoveries_this_week: int
