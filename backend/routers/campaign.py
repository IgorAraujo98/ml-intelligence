from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import gemini_svc

router = APIRouter()


class CampaignRequest(BaseModel):
    margin_data: dict
    market_data: dict
    listing_data: Optional[dict] = None


@router.post("/strategy")
async def campaign_strategy(req: CampaignRequest):
    try:
        combined = {
            "net_margin": req.margin_data.get("net_margin", 0),
            "profit_per_unit": req.margin_data.get("profit_per_unit", 0),
            "sale_price": req.margin_data.get("sale_price", 0),
            "avg_market_price": req.market_data.get("market", {}).get("prices", {}).get("avg", 0),
            "channel_recommendation": req.market_data.get("insights", {}).get("channel_recommendation", "organico"),
            "competition_level": req.market_data.get("insights", {}).get("competition_level", "media"),
            "total_competitors": req.market_data.get("market", {}).get("total", 0),
        }

        strategy = await gemini_svc.generate_campaign_strategy(combined)
        return strategy
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
