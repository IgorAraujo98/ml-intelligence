from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import ml_api, openai_svc

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


def _build_market_data(search_result: dict, items: list) -> dict:
    return {
        "total": search_result.get("paging", {}).get("total", 0),
        "prices": ml_api.analyze_prices(items),
        "keywords": ml_api.extract_keywords(items),
        "top_sellers": ml_api.analyze_sellers(items),
        "quality": ml_api.analyze_listing_quality(items),
    }


@router.post("/analyze")
async def analyze_market(req: MarketAnalysisRequest):
    try:
        if req.source == "url":
            if not req.product_url:
                raise HTTPException(status_code=400, detail="product_url é obrigatório quando source='url'")

            search_query = ml_api.extract_query_from_url(req.product_url)
            if not search_query:
                raise HTTPException(
                    status_code=400,
                    detail="Não foi possível extrair palavras-chave da URL. Verifique se é uma URL válida do Mercado Livre."
                )

            search_result = await ml_api.search_products(search_query, limit=50)
            items = search_result.get("results", [])
            market_data = _build_market_data(search_result, items)
            query_for_insights = search_query

        elif req.source == "api":
            search_result = await ml_api.search_products(req.query, limit=50)
            items = search_result.get("results", [])
            market_data = _build_market_data(search_result, items)
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

        insights = await openai_svc.generate_market_insights(query_for_insights, market_data)

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
