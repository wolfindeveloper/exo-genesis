from datetime import datetime

from pydantic import BaseModel


class ExpeditionStartRequest(BaseModel):
    zone_id: str


class ExpeditionClaimRequest(BaseModel):
    expedition_id: str


class Expedition(BaseModel):
    id: str
    user_id: str
    ship_id: str
    zone_config_id: str
    start_time: datetime
    end_time: datetime
    status: str = "active"
    result_data: dict | None = None
