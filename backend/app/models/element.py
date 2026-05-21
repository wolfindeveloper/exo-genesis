from pydantic import BaseModel


class Element(BaseModel):
    id: str
    name_key: str
    tier: int
    rarity: str
    icon_path: str
    description_key: str
