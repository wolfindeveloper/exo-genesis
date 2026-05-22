import json
from functools import lru_cache
from pathlib import Path

from app.models.element import Element
from app.models.ship import ShipConfig


class ContentLoader:
    _ships: list[dict] = []
    _zones: list[dict] = []
    _elements: list[dict] = []
    _artifacts: list[dict] = []

    @property
    def ships(self) -> list[dict]:
        return self._ships

    @property
    def zones(self) -> list[dict]:
        return self._zones

    @property
    def elements(self) -> list[dict]:
        return self._elements

    @property
    def artifacts(self) -> list[dict]:
        return self._artifacts

    def get_ship(self, ship_id: str) -> dict | None:
        return next((s for s in self._ships if s["id"] == ship_id), None)

    def get_zone(self, zone_id: str) -> dict | None:
        return next((z for z in self._zones if z["id"] == zone_id), None)

    def get_element(self, element_id: str) -> dict | None:
        return next((e for e in self._elements if e["id"] == element_id), None)

    def get_artifact(self, artifact_id: str) -> dict | None:
        return next((a for a in self._artifacts if a["id"] == artifact_id), None)

    def load_all(self) -> None:
        content_dir = Path(__file__).resolve().parent.parent.parent / "content"
        self._ships = self._load_json(content_dir / "ships.json")
        self._zones = self._load_json(content_dir / "zones.json")
        self._elements = self._load_json(content_dir / "elements.json")
        self._artifacts = self._load_json(content_dir / "artifacts.json")

    @staticmethod
    def _load_json(path: Path) -> list[dict]:
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        return []
