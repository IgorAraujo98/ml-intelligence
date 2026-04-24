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


@router.post("/analyze")
async def analyze_market(req: MarketAnalysisRequest):
    try:
        target_item = None

        if req.source == "url":
            if not req.product_url:
                raise HTTPException(status_code=400, detail="product_url é obrigatório quando source='url'")

            item_id, id_type = ml_api.extract_item_id_from_url(req.product_url)
            if not item_id:
                raise HTTPException(
                    status_code=400,
                    detail="URL inválida. Cole a URL completa de um anúncio do Mercado Livre (ex: https://produto.mercadolivre.com.br/MLB-...)."
                )

            # Tenta buscar o item — com fallback em caso de 403/404
            if id_type == "catalog":
                target_item = await ml_api.get_catalog_item(item_id)
            else:
                target_item = await ml_api.get_item_details_safe(item_id)

            # Se não conseguiu acessar o item, usa keywords extraídas da URL
            if target_item:
                search_query = target_item.get("title", "")
            else:
                search_query = ml_api.extract_query_from_url(req.product_url)

            if not search_query:
                raise HTTPException(
                    status_code=400,
                    detail="Não foi possível acessar o produto e o nome não pôde ser extraído da URL."
                )

            search_result = await ml_api.search_products(search_query, limit=50)
            items = search_result.get("results", [])

            prices = ml_api.analyze_prices(items)
            keywords = ml_api.extract_keywords(items)
            top_sellers = ml_api.analyze_sellers(items)
            quality = ml_api.analyze_listing_quality(items)

            # Monta target_item se tiver dados, senão None
            if target_item:
                item_price = target_item.get("price", 0)
                all_prices = sorted([i["price"] for i in items if "price" in i])
                position = None
                if all_prices:
                    below = sum(1 for p in all_prices if p < item_price)
                    position = round(below / len(all_prices) * 100)

                target_item_data = {
                    "id": target_item.get("id"),
                    "title": target_item.get("title"),
                    "price": item_price,
                    "sold_quantity": target_item.get("sold_quantity", 0),
                    "condition": target_item.get("condition"),
                    "thumbnail": target_item.get("thumbnail"),
                    "free_shipping": target_item.get("shipping", {}).get("free_shipping", False),
                    "logistic_type": target_item.get("shipping", {}).get("logistic_type"),
                    "attributes": ml_api.extract_item_attributes(target_item),
                    "price_position_pct": position,
                }
            else:
                target_item_data = None

            market_data = {
                "total": search_result.get("paging", {}).get("total", 0),
                "prices": prices,
                "keywords": keywords,
                "top_sellers": top_sellers,
                "quality": quality,
                "target_item": target_item_data,
                "url_fallback": target_item is None,
            }
            query_for_insights = search_query

        elif req.source == "api":
            search_result = await ml_api.search_products(req.query, limit=50)
            items = search_result.get("results", [])

            prices = ml_api.analyze_prices(items)
            keywords = ml_api.extract_keywords(items)
            top_sellers = ml_api.analyze_sellers(items)
            quality = ml_api.analyze_listing_quality(items)

            market_data = {
                "total": search_result.get("paging", {}).get("total", 0),
                "prices": prices,
                "keywords": keywords,
                "top_sellers": top_sellers,
                "quality": quality,
            }
            query_for_insights = req.query

        else:
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
