from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class MarginRequest(BaseModel):
    cost_price: float
    sale_price: float
    ml_commission_pct: float = 11.0
    shipping_cost: float = 0.0
    packaging_cost: float = 0.0
    tax_pct: float = 6.0
    other_costs: float = 0.0


@router.post("/calculate")
def calculate_margin(req: MarginRequest):
    ml_commission = req.sale_price * (req.ml_commission_pct / 100)
    tax = req.sale_price * (req.tax_pct / 100)

    total_costs = (
        req.cost_price
        + ml_commission
        + req.shipping_cost
        + req.packaging_cost
        + tax
        + req.other_costs
    )

    profit = req.sale_price - total_costs
    gross_margin = ((req.sale_price - req.cost_price) / req.sale_price * 100) if req.sale_price > 0 else 0
    net_margin = (profit / req.sale_price * 100) if req.sale_price > 0 else 0

    # Contribution margin per unit (variable costs only, excluding product cost)
    variable_cost_per_unit = ml_commission + tax + req.shipping_cost + req.packaging_cost
    contribution_margin = req.sale_price - variable_cost_per_unit
    break_even_units = (req.cost_price / contribution_margin) if contribution_margin > 0 else 0

    roi = ((profit / req.cost_price) * 100) if req.cost_price > 0 else 0

    return {
        "sale_price": round(req.sale_price, 2),
        "cost_price": round(req.cost_price, 2),
        "ml_commission": round(ml_commission, 2),
        "ml_commission_pct": req.ml_commission_pct,
        "tax": round(tax, 2),
        "tax_pct": req.tax_pct,
        "shipping_cost": round(req.shipping_cost, 2),
        "packaging_cost": round(req.packaging_cost, 2),
        "other_costs": round(req.other_costs, 2),
        "total_costs": round(total_costs, 2),
        "profit_per_unit": round(profit, 2),
        "gross_margin": round(gross_margin, 2),
        "net_margin": round(net_margin, 2),
        "break_even_units": round(break_even_units, 1),
        "roi": round(roi, 2),
    }
