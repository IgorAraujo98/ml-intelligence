from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import gemini_svc, ml_api

router = APIRouter()


class ProductInfo(BaseModel):
    name: str
    description: str
    category: Optional[str] = None


class ListingRequest(BaseModel):
    product_info: Optional[ProductInfo] = None
    market_data: dict
    product_url: Optional[str] = None


def _extract_from_target(target: dict) -> ProductInfo:
    """Constrói ProductInfo a partir do target product retornado pelo dashboard/ML."""
    name = target.get("name", "")
    features = target.get("main_features") or []
    short = target.get("short_description") or ""
    attributes = target.get("attributes") or []

    parts = []
    if short:
        parts.append(short)
    if features:
        parts.append("Características: " + "; ".join(str(f) for f in features[:8]))
    if attributes:
        attr_str = "; ".join(
            f"{a.get('name')}: {a.get('value_name')}"
            for a in attributes[:8]
            if a.get("name") and a.get("value_name")
        )
        if attr_str:
            parts.append("Atributos: " + attr_str)

    description = "\n".join(parts) or "Produto identificado pelo Mercado Livre."
    category = target.get("category_id")
    return ProductInfo(name=name, description=description, category=category)


@router.post("/generate")
async def generate_listing(req: ListingRequest):
    """
    Gera anúncio completo. O product_info pode ser:
    1. Fornecido manualmente pelo usuário (compatibilidade)
    2. Auto-extraído de uma URL do ML (modo automático)
    3. Auto-extraído do market_data se contiver target product
    """
    try:
        product_info = req.product_info

        # Se não há info manual, tenta extrair automaticamente
        if not product_info:
            target = (req.market_data or {}).get("target")
            if target:
                product_info = _extract_from_target(target)
            elif req.product_url:
                # Coleta o target a partir da URL
                data = await ml_api.fetch_target_with_competitors(req.product_url)
                if data.get("target"):
                    product_info = _extract_from_target(data["target"])

        if not product_info:
            raise HTTPException(
                status_code=400,
                detail="Forneça product_info, ou um product_url, ou rode o dashboard primeiro para auto-popular.",
            )

        listing = await gemini_svc.generate_listing(
            product_info.model_dump(),
            req.market_data,
        )
        return listing
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
