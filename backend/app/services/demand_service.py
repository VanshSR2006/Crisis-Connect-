import math

def calculate_demographic_demand(population: int, households: int, vulnerability_index: float):
    """
    Estimates specific required quantities for relief supplies based on population & demographic profile.
    """
    food_packets = math.ceil(population * 3)
    drinking_water_liters = math.ceil(population * 4.5 * 3)
    medical_kits = math.ceil(population * 0.05 * vulnerability_index)
    sanitation_kits = math.ceil(households * 0.8)

    return {
        "food_packets": food_packets,
        "drinking_water_liters": drinking_water_liters,
        "medical_kits": medical_kits,
        "sanitation_kits": sanitation_kits,
        "population": population,
        "households": households,
        "vulnerability_index": vulnerability_index
    }
