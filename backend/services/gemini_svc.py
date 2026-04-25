import os
import json
from google import genai
from google.genai import types

MODEL = "gemini-2.5-flash"


def get_client() -> genai.Client:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY não configurada. Edite o arquivo backend/.env.")
    return genai.Client(api_key=key)


# Schemas estruturados (formato OpenAPI compatível com Gemini)
INSIGHTS_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "audience": {"type": "STRING"},
        "logistics_tip": {"type": "STRING"},
        "channel_recommendation": {"type": "STRING", "enum": ["organico", "ads"]},
        "channel_justification": {"type": "STRING"},
        "complaints_common": {"type": "ARRAY", "items": {"type": "STRING"}},
        "opportunity": {"type": "STRING"},
        "competition_level": {"type": "STRING", "enum": ["baixa", "media", "alta"]},
        "market_summary": {"type": "STRING"},
    },
    "required": [
        "audience", "logistics_tip", "channel_recommendation", "channel_justification",
        "complaints_common", "opportunity", "competition_level", "market_summary",
    ],
}

LISTING_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "title": {"type": "STRING"},
        "description": {"type": "STRING"},
        "specs": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "key": {"type": "STRING"},
                    "value": {"type": "STRING"},
                },
                "required": ["key", "value"],
            },
        },
        "keywords": {"type": "ARRAY", "items": {"type": "STRING"}},
        "price_suggestion": {"type": "NUMBER"},
        "price_justification": {"type": "STRING"},
        "image_briefing": {"type": "STRING"},
    },
    "required": [
        "title", "description", "specs", "keywords",
        "price_suggestion", "price_justification", "image_briefing",
    ],
}

CAMPAIGN_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "invest_in_ads": {"type": "BOOLEAN"},
        "recommendation_strength": {"type": "STRING", "enum": ["forte", "moderada", "fraca"]},
        "justification": {"type": "STRING"},
        "min_margin_for_ads": {"type": "NUMBER"},
        "suggested_budget_initial": {"type": "NUMBER"},
        "expected_roas": {"type": "NUMBER"},
        "phases": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "phase": {"type": "INTEGER"},
                    "name": {"type": "STRING"},
                    "duration": {"type": "STRING"},
                    "objective": {"type": "STRING"},
                    "daily_budget": {"type": "NUMBER"},
                    "actions": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
                "required": ["phase", "name", "duration", "objective", "daily_budget", "actions"],
            },
        },
        "kpis": {"type": "ARRAY", "items": {"type": "STRING"}},
        "warnings": {"type": "ARRAY", "items": {"type": "STRING"}},
    },
    "required": [
        "invest_in_ads", "recommendation_strength", "justification",
        "min_margin_for_ads", "suggested_budget_initial", "expected_roas",
        "phases", "kpis", "warnings",
    ],
}


async def _call_structured(prompt: str, schema: dict) -> dict:
    """Chama Gemini com saída JSON estruturada e retorna o dict parseado."""
    response = await get_client().aio.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.7,
        ),
    )
    return json.loads(response.text)


async def generate_market_insights(query: str, market_data: dict) -> dict:
    prices = market_data.get("prices", {})
    keywords = market_data.get("keywords", [])
    top_sellers = market_data.get("top_sellers", [])

    prompt = f"""Você é um especialista em Mercado Livre Brasil com 10 anos de experiência.
Analise os dados abaixo para o produto/nicho "{query}" e retorne insights estratégicos.

DADOS DE MERCADO:
- Total de anúncios: {market_data.get("total", 0)}
- Preço médio: R$ {prices.get("avg", 0):.2f}
- Faixa de preço: R$ {prices.get("min", 0):.2f} – R$ {prices.get("max", 0):.2f}
- Preço mediano: R$ {prices.get("median", 0):.2f}
- Top keywords: {", ".join([k["word"] for k in keywords[:10]])}
- Top vendedores (por volume): {[s.get("nickname") for s in top_sellers[:3]]}

Forneça insights estratégicos sobre público-alvo, logística, canal recomendado (orgânico ou ads),
reclamações comuns no nicho, oportunidade de diferenciação, nível de concorrência e um resumo do mercado."""

    return await _call_structured(prompt, INSIGHTS_SCHEMA)


async def generate_listing(product_info: dict, market_data: dict) -> dict:
    prices = market_data.get("prices", {})
    keywords = market_data.get("keywords", [])
    insights = market_data.get("insights", {})

    prompt = f"""Você é um copywriter especialista em Mercado Livre Brasil.
Crie um anúncio completo e otimizado para o produto abaixo.

PRODUTO: {product_info.get("name")}
DESCRIÇÃO DO VENDEDOR: {product_info.get("description", "não informada")}
CATEGORIA: {product_info.get("category", "não informada")}

INTELIGÊNCIA DE MERCADO:
- Preço médio: R$ {prices.get("avg", 0):.2f} | Faixa: R$ {prices.get("min", 0):.2f}–{prices.get("max", 0):.2f}
- Público-alvo: {insights.get("audience", "não informado")}
- Top keywords: {", ".join([k["word"] for k in keywords[:15]])}
- Reclamações comuns: {", ".join(insights.get("complaints_common", []))}
- Oportunidade: {insights.get("opportunity", "não informada")}

REGRAS DO MERCADO LIVRE:
- Título: máximo 60 caracteres, sem caracteres especiais (!@#$%), incluir keyword principal
- Descrição: mínimo 500 palavras, HTML básico (<b>, <ul>, <li>), benefícios > features
- Ficha técnica: mínimo 5 atributos relevantes
- Keywords: 20 ranqueadas por relevância
- Image briefing: detalhado em inglês, pronto para usar em ferramentas de geração (Midjourney, Leonardo, DALL-E)"""

    return await _call_structured(prompt, LISTING_SCHEMA)


async def generate_campaign_strategy(data: dict) -> dict:
    prompt = f"""Você é um especialista em performance e tráfego pago no Mercado Livre.
Analise os dados e crie uma estratégia de campanha completa.

DADOS FINANCEIROS:
- Margem líquida: {data.get("net_margin", 0):.1f}%
- Lucro por unidade: R$ {data.get("profit_per_unit", 0):.2f}
- Preço de venda: R$ {data.get("sale_price", 0):.2f}
- Preço médio da concorrência: R$ {data.get("avg_market_price", 0):.2f}

DADOS DE MERCADO:
- Canal recomendado (módulo 1): {data.get("channel_recommendation", "organico")}
- Total de concorrentes: {data.get("total_competitors", 0)}
- Nível de concorrência: {data.get("competition_level", "media")}

Recomende se vale investir em Ads, com justificativa, orçamento sugerido, ROAS esperado,
plano de fases (com objetivos, ações e orçamento diário), KPIs e alertas."""

    return await _call_structured(prompt, CAMPAIGN_SCHEMA)
