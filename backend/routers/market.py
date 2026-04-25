from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import ml_api, gemini_svc

router = APIRouter()


class ManualMarketData(BaseModel):
    avg_price: float
    min_price: float
    max_price: float
    total_listings: int
    top_keywords: list[str]


class MarketAnalysisRequest(BaseModel):
    query: str
    source: str  # "api" | "manual" | "url"
    manual_data: Optional[ManualMarketData] = None
    product_url: Optional[str] = None


class InsightsRequest(BaseModel):
    query: str
    market_data: dict


def _build_market_data(search_result: dict) -> dict:
    items = search_result.get("items", [])
    products = search_result.get("products", [])
    return {
        "total": search_result.get("total", 0),
        "prices": ml_api.analyze_prices(items),
        "keywords": ml_api.extract_keywords(products),
        "top_sellers": ml_api.analyze_sellers(items),
        "quality": ml_api.analyze_listing_quality(items),
    }


@router.post("/analyze")
async def analyze_market(req: MarketAnalysisRequest):
    """Coleta dados de mercado no ML (com OAuth) e gera insights de IA."""
    try:
        if req.source == "url":
            if not req.product_url:
                raise HTTPException(status_code=400, detail="product_url é obrigatório quando source='url'")
            search_query = ml_api.extract_query_from_url(req.product_url)
            if not search_query:
                raise HTTPException(status_code=400, detail="Não foi possível extrair palavras-chave da URL.")
            search_result = await ml_api.search_market(search_query)
            market_data = _build_market_data(search_result)
            query_for_insights = search_query

        elif req.source == "api":
            search_result = await ml_api.search_market(req.query)
            market_data = _build_market_data(search_result)
            query_for_insights = req.query

        else:  # manual
            if not req.manual_data:
                raise HTTPException(status_code=400, detail="manual_data é obrigatório quando source='manual'")
            md = req.manual_data
            market_data = {
                "total": md.total_listings,
                "prices": {
                    "avg": md.avg_price,
                    "min": md.min_price,
                    "max": md.max_price,
                    "median": md.avg_price,
                },
                "keywords": [{"word": k, "count": 1} for k in md.top_keywords],
                "top_sellers": [],
                "quality": {},
            }
            query_for_insights = req.query

        insights = await gemini_svc.generate_market_insights(query_for_insights, market_data)
        return {
            "query": query_for_insights,
            "source": req.source,
            "market": market_data,
            "insights": insights,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights")
async def generate_insights(req: InsightsRequest):
    """Gera insights a partir de dados de mercado já coletados (compatibilidade)."""
    try:
        insights = await gemini_svc.generate_market_insights(req.query, req.market_data)
        return {"query": req.query, "market": req.market_data, "insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
