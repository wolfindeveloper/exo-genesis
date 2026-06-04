from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    id: str
    username: str | None = None
    language_code: str | None = "en"


class UserProfile(BaseModel):
    id: str
    username: str | None = None
    language_code: str | None = "en"
    balance_xgen: int = 0
    balance_stars: int = 0
    balance_fragments: int = 0
    level: int = 1
    xp: int = 0
    streak_days: int = 0
    created_at: datetime | None = None
    last_login: datetime | None = None
