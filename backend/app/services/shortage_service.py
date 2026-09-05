from sqlalchemy.orm import Session

from ..models import DemandForecast, Resource


def calculate_zone_shortages(zone_id: str, db: Session):
    """
    Compare demand forecasts against available resources
    and identify shortages.
    """

    forecasts = (
        db.query(DemandForecast)
        .filter(DemandForecast.zone_id == zone_id)
        .all()
    )

    shortages = []

    for forecast in forecasts:

        resources = (
            db.query(Resource)
            .filter(
                Resource.zone_id == zone_id,
                Resource.type == forecast.resource_type
            )
            .all()
        )

        available = sum(
            r.quantity_available
            for r in resources
            if r.status != "depleted"
        )

        required = forecast.quantity_needed
        shortage = max(0, required - available)

        if shortage == 0:
            status = "sufficient"
        elif shortage < required * 0.25:
            status = "low"
        elif shortage < required * 0.75:
            status = "high"
        else:
            status = "critical"

        shortages.append({
            "resource_type": forecast.resource_type,
            "required": required,
            "available": available,
            "shortage": shortage,
            "status": status,
            "reorder_required": shortage > 0
        })

    total_shortage = sum(
        item["shortage"]
        for item in shortages
    )

    return {
        "zone_id": zone_id,
        "total_shortage": total_shortage,
        "shortages": shortages
    }