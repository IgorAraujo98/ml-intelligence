from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import openai_svc

router = APIRouter()


class InsightsRequest(BaseModel):
    query: str
    market_data: dict


@router.post("/insights")
async def generate_insights(req: InsightsRequest):
    """
    Gera insights de IA a partir de dados de mercado já coletados.
    A coleta dos dados é feita no frontend (browser do usuário) para evitar
    bloqueios 403 que o Mercado Livre aplica em IPs de datacenter.
    """
    try:
        insights = await openai_svc.generate_market_insights(req.query, req.market_data)
        return {
            "query": req.query,
            "market": req.market_data,
            "insights": insights,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
