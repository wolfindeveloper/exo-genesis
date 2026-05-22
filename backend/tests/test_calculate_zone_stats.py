"""Snapshot tests: must match frontend calculateZoneStats() in expeditionCalc.ts"""

from app.services.expedition_logic import calculate_zone_stats


class TestCalculateZoneStats:
    """Ensures calculate_zone_stats() output stays consistent.
    If you change the formula here, update expeditionCalc.ts too."""

    def test_baseline_no_artifacts(self):
        zone = {"risk_factor": 0.1, "fuel_cost": 10, "duration_hours": 4}
        result = calculate_zone_stats(zone, 100, 1.2, 100)
        assert result == {
            "effective_risk": 0.05,
            "effective_fuel_cost": 10,
            "effective_duration": 3.3,
            "fuel_ok": True,
            "estimated_max_damage": 0.8,
        }

    def test_high_stability_low_risk(self):
        zone = {"risk_factor": 0.5, "fuel_cost": 20, "duration_hours": 8}
        result = calculate_zone_stats(zone, 180, 2.0, 200)
        assert result == {
            "effective_risk": 0.05,
            "effective_fuel_cost": 20,
            "effective_duration": 4.0,
            "fuel_ok": True,
            "estimated_max_damage": 0.7,
        }

    def test_low_stability_insufficient_fuel(self):
        zone = {"risk_factor": 0.3, "fuel_cost": 15, "duration_hours": 6}
        result = calculate_zone_stats(zone, 30, 0.8, 5)
        assert result == {
            "effective_risk": 0.255,
            "effective_fuel_cost": 15,
            "effective_duration": 7.5,
            "fuel_ok": False,
            "estimated_max_damage": 3.8,
        }

    def test_with_artifact_bonuses(self):
        zone = {"risk_factor": 0.1, "fuel_cost": 10, "duration_hours": 4}
        bonuses = [
            {"stability_bonus": 0.02},
            {"fuel_efficiency": 0.1},
            {"speed_mod": 0.2},
            {"stability_bonus": 0.01},
        ]
        result = calculate_zone_stats(zone, 100, 1.2, 100, bonuses)
        assert result == {
            "effective_risk": 0.02,
            "effective_fuel_cost": 9,
            "effective_duration": 2.7,
            "fuel_ok": True,
            "estimated_max_damage": 0.3,
        }
