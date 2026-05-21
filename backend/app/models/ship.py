from datetime import datetime

from pydantic import BaseModel


class ShipStats(BaseModel):
    stability: float = 100.0
    fuel_capacity: int = 50
    speed_mod: float = 1.0


class ShipConfig(BaseModel):
    id: str
    name_key: str
    tier: int
    stats: ShipStats
    required_level: int = 1
    art_path: str


class UserShip(BaseModel):
    id: str
    user_id: str
    ship_config_id: str
    status: str = "idle"
    stability: float = 100.0
    fuel_current: int = 0
    equipped_artifacts: list[str] = []
    acquired_at: datetime | None = None
