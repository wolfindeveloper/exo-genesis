"""Verify all box content references are valid."""

from app.services.content_loader import ContentLoader

content = ContentLoader()
content.load_all()


def _check_item(item: dict, label: str) -> None:
    item_type = item["type"]
    if item_type == "ship":
        if "pool" in item:
            for sid in item["pool"]:
                assert content.get_ship(sid), f"{label}: ship '{sid}' not found"
        else:
            assert content.get_ship(item["item_id"]), f"{label}: ship '{item['item_id']}' not found"
    elif item_type == "element":
        assert content.get_element(item["item_id"]), f"{label}: element '{item['item_id']}' not found"
    elif item_type == "resource":
        assert content.get_resource(item["item_id"]), f"{label}: resource '{item['item_id']}' not found"


class TestBoxesIntegrity:
    def test_all_boxes_exist(self):
        assert len(content.boxes) >= 1

    def test_starter_box_structure(self):
        box = content.get_box("nothing_extra_starter_pack")
        assert box is not None
        assert box["id"] == "nothing_extra_starter_pack"
        assert "name_key" in box
        assert "description_key" in box
        assert "legend" in box
        assert "icon_path" in box
        assert isinstance(box["guaranteed"], list)
        assert isinstance(box["random_drops"], list)
        assert isinstance(box["random_drops_count"], int)
        assert box["random_drops_count"] > 0

    def test_starter_box_guaranteed_references(self):
        box = content.get_box("nothing_extra_starter_pack")
        for i, item in enumerate(box["guaranteed"]):
            _check_item(item, f"guaranteed[{i}]")

    def test_starter_box_random_drops_references(self):
        box = content.get_box("nothing_extra_starter_pack")
        for i, item in enumerate(box["random_drops"]):
            assert "weight" in item, f"random_drops[{i}]: missing weight"
            assert "min" in item, f"random_drops[{i}]: missing min"
            assert "max" in item, f"random_drops[{i}]: missing max"
            assert item["min"] <= item["max"], f"random_drops[{i}]: min > max"
            _check_item(item, f"random_drops[{i}]")
