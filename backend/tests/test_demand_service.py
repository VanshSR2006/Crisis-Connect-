"""
Crisis Connect Backend — M4 Demand Service Tests
Member 4 — AI / Data / Intelligence

Tests the demographic relief-demand calculator.
"""

from app.services.demand_service import calculate_demographic_demand


class TestDemographicDemand:

    def test_calculates_basic_demand(self):
        result = calculate_demographic_demand(
            population=1000,
            households=250,
            vulnerability_index=0.5,
        )

        assert result["food_packets"] == 3000
        assert result["drinking_water_liters"] == 13500
        assert result["medical_kits"] == 25
        assert result["sanitation_kits"] == 200

    def test_vulnerability_affects_medical_kits(self):
        low_vulnerability = calculate_demographic_demand(
            population=1000,
            households=250,
            vulnerability_index=0.2,
        )

        high_vulnerability = calculate_demographic_demand(
            population=1000,
            households=250,
            vulnerability_index=0.8,
        )

        assert high_vulnerability["medical_kits"] > low_vulnerability["medical_kits"]

    def test_larger_population_requires_more_supplies(self):
        small = calculate_demographic_demand(
            population=500,
            households=100,
            vulnerability_index=0.5,
        )

        large = calculate_demographic_demand(
            population=2000,
            households=400,
            vulnerability_index=0.5,
        )

        assert large["food_packets"] > small["food_packets"]
        assert large["drinking_water_liters"] > small["drinking_water_liters"]
        assert large["medical_kits"] > small["medical_kits"]
        assert large["sanitation_kits"] > small["sanitation_kits"]

    def test_zero_population(self):
        result = calculate_demographic_demand(
            population=0,
            households=0,
            vulnerability_index=0.5,
        )

        assert result["food_packets"] == 0
        assert result["drinking_water_liters"] == 0
        assert result["medical_kits"] == 0
        assert result["sanitation_kits"] == 0

    def test_result_contains_input_values(self):
        result = calculate_demographic_demand(
            population=1500,
            households=350,
            vulnerability_index=0.75,
        )

        assert result["population"] == 1500
        assert result["households"] == 350
        assert result["vulnerability_index"] == 0.75