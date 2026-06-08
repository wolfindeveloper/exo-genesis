import json
from pathlib import Path


class ContentLoader:
    _ships: list[dict] = []
    _zones: list[dict] = []
    _artifacts: list[dict] = []
    _resources: list[dict] = []
    _boxes: list[dict] = []
    _ranks: list[dict] = []
    _shop: list[dict] = []
    _guide: dict | None = None

    @property
    def ships(self) -> list[dict]:
        return self._ships

    @property
    def zones(self) -> list[dict]:
        return self._zones

    @property
    def artifacts(self) -> list[dict]:
        return self._artifacts

    @property
    def resources(self) -> list[dict]:
        return self._resources

    @property
    def boxes(self) -> list[dict]:
        return self._boxes

    @property
    def shop(self) -> list[dict]:
        return self._shop

    @property
    def ranks(self) -> list[dict]:
        return self._ranks

    @property
    def guide(self) -> dict | None:
        return self._guide

    def get_ship(self, ship_id: str) -> dict | None:
        return next((s for s in self._ships if s["id"] == ship_id), None)

    def get_zone(self, zone_id: str) -> dict | None:
        return next((z for z in self._zones if z["id"] == zone_id), None)

    def get_artifact(self, artifact_id: str) -> dict | None:
        return next((a for a in self._artifacts if a["id"] == artifact_id), None)

    def get_resource(self, resource_id: str) -> dict | None:
        return next((r for r in self._resources if r["id"] == resource_id), None)

    def get_box(self, box_id: str) -> dict | None:
        return next((b for b in self._boxes if b["id"] == box_id), None)

    def get_guide_entry(self, chapter_id: str, entry_id: str) -> dict | None:
        if not self._guide:
            return None
        for ch in self._guide.get("chapters", []):
            if ch["id"] == chapter_id:
                return next((e for e in ch.get("entries", []) if e["id"] == entry_id), None)
        return None

    def get_guide_chapter(self, chapter_id: str) -> dict | None:
        if not self._guide:
            return None
        return next((ch for ch in self._guide.get("chapters", []) if ch["id"] == chapter_id), None)

    def load_all(self) -> None:
        content_dir = Path(__file__).resolve().parent.parent.parent / "content"
        self._ships = self._load_json(content_dir / "ships.json")
        self._zones = self._load_json(content_dir / "zones.json")
        self._artifacts = self._load_json(content_dir / "artifacts.json")
        self._resources = self._load_json(content_dir / "resources.json")
        self._boxes = self._load_json(content_dir / "boxes.json")
        self._ranks = self._load_json(content_dir / "ranks.json")
        self._shop = self._load_json(content_dir / "shop.json")
        self._guide = self._load_dict_json(content_dir / "guide.json")

    @staticmethod
    def _load_json(path: Path) -> list[dict]:
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        return []

    @staticmethod
    def _load_dict_json(path: Path) -> dict | None:
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        return None
