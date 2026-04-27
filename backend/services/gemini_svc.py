import os
import json
import asyncio
from google import genai
from google.genai import types
from google.genai.errors import ServerError, ClientError

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

DASHBOARD_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "overview": {
            "type": "OBJECT",
            "properties": {
                "status": {"type": "STRING"},
                "strength": {"type": "STRING"},
                "weakness": {"type": "STRING"},
                "growth_potential": {"type": "STRING", "enum": ["alto", "medio", "baixo"]},
                "competitiveness_level": {"type": "STRING", "enum": ["alta", "media", "baixa"]},
            },
            "required": ["status", "strength", "weakness", "growth_potential", "competitiveness_level"],
        },
        "performance": {
            "type": "OBJECT",
            "properties": {
                "trend": {"type": "STRING", "enum": ["crescendo", "estavel", "queda", "indisponivel"]},
                "summary": {"type": "STRING"},
                "metrics": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "label": {"type": "STRING"},
                            "value": {"type": "STRING"},
                            "context": {"type": "STRING"},
                        },
                        "required": ["label", "value", "context"],
                    },
                },
            },
            "required": ["trend", "summary", "metrics"],
        },
        "traffic_conversion": {
            "type": "OBJECT",
            "properties": {
                "main_issue": {"type": "STRING", "enum": ["trafego", "conversao", "preco", "oferta", "indisponivel"]},
                "explanation": {"type": "STRING"},
            },
            "required": ["main_issue", "explanation"],
        },
        "price_competitiveness": {
            "type": "OBJECT",
            "properties": {
                "classification": {
                    "type": "STRING",
                    "enum": ["muito_competitivo", "competitivo", "neutro", "acima_do_mercado", "pouco_competitivo"],
                },
                "price_diff_pct": {"type": "NUMBER"},
                "summary": {"type": "STRING"},
            },
            "required": ["classification", "price_diff_pct", "summary"],
        },
        "ranking_visibility": {
            "type": "OBJECT",
            "properties": {
                "visibility_trend": {"type": "STRING", "enum": ["ganhando", "estavel", "perdendo", "indisponivel"]},
                "summary": {"type": "STRING"},
            },
            "required": ["visibility_trend", "summary"],
        },
        "competition": {
            "type": "OBJECT",
            "properties": {
                "main_competitor": {"type": "STRING"},
                "best_seller": {"type": "STRING"},
                "best_price": {"type": "STRING"},
                "what_to_copy": {"type": "STRING"},
                "what_to_avoid": {"type": "STRING"},
            },
            "required": ["main_competitor", "best_seller", "best_price", "what_to_copy", "what_to_avoid"],
        },
        "diagnosis": {
            "type": "OBJECT",
            "properties": {
                "category": {
                    "type": "STRING",
                    "enum": [
                        "vencedor", "com_potencial", "estagnado", "em_queda",
                        "pouco_competitivo", "problema_conversao", "problema_trafego", "problema_preco",
                    ],
                },
                "reason": {"type": "STRING"},
            },
            "required": ["category", "reason"],
        },
        "recommendations": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "area": {"type": "STRING"},
                    "priority": {"type": "STRING", "enum": ["alta", "media", "baixa"]},
                    "expected_impact": {"type": "STRING"},
                    "justification": {"type": "STRING"},
                    "action": {"type": "STRING"},
                },
                "required": ["area", "priority", "expected_impact", "justification", "action"],
            },
        },
        "alerts": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "type": {"type": "STRING"},
                    "severity": {"type": "STRING", "enum": ["critica", "alta", "media", "baixa"]},
                    "message": {"type": "STRING"},
                },
                "required": ["type", "severity", "message"],
            },
        },
        "executive_summary": {"type": "STRING"},
    },
    "required": [
        "overview", "performance", "traffic_conversion", "price_competitiveness",
        "ranking_visibility", "competition", "diagnosis", "recommendations",
        "alerts", "executive_summary",
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


async def _call_structured(prompt: str, schema: dict, max_retries: int = 3) -> dict:
    """
    Chama Gemini com saída JSON estruturada e retorna o dict parseado.
    Com retry exponencial para 503 (overload) e 429 (rate limit).
    """
    last_error: Exception | None = None
    for attempt in range(max_retries):
        try:
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
        except ServerError as e:
            last_error = e
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            raise
        except ClientError as e:
            # 429 = rate limit, retry; outros 4xx = falha permanente
            if "429" in str(e) and attempt < max_retries - 1:
                last_error = e
                await asyncio.sleep(2 ** attempt + 1)
                continue
            raise
    if last_error:
        raise last_error
    raise RuntimeError("Falha após múltiplas tentativas")


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


async def generate_dashboard_analysis(target: dict, competitors: list, market_summary: dict) -> dict:
    """Gera o dashboard completo de 10 seções com base nos dados reais coletados do ML."""
    target_brief = {
        "name": target.get("name"),
        "category_id": target.get("category_id"),
        "buy_box_price": (target.get("buy_box") or {}).get("price"),
        "buy_box_original_price": (target.get("buy_box") or {}).get("original_price"),
        "free_shipping": (target.get("buy_box") or {}).get("free_shipping"),
        "logistic_type": (target.get("buy_box") or {}).get("logistic_type"),
        "listing_type": (target.get("buy_box") or {}).get("listing_type"),
        "items_count": target.get("items_count"),
        "price_avg": target.get("price_avg"),
        "price_min": target.get("price_min"),
        "price_max": target.get("price_max"),
        "free_shipping_pct": target.get("free_shipping_pct"),
        "fulfillment_pct": target.get("fulfillment_pct"),
        "discount_count": target.get("discount_count"),
        "key_attributes": [
            f"{a.get('name')}: {a.get('value_name')}"
            for a in (target.get("attributes") or [])[:6]
        ],
    }

    competitors_brief = [
        {
            "name": c.get("name"),
            "buy_box_price": (c.get("buy_box") or {}).get("price"),
            "free_shipping": (c.get("buy_box") or {}).get("free_shipping"),
            "logistic_type": (c.get("buy_box") or {}).get("logistic_type"),
            "listing_type": (c.get("buy_box") or {}).get("listing_type"),
            "items_count": c.get("items_count"),
            "price_avg": c.get("price_avg"),
            "free_shipping_pct": c.get("free_shipping_pct"),
            "discount_count": c.get("discount_count"),
        }
        for c in competitors[:9]
    ]

    prompt = f"""Você é um gestor experiente de e-commerce no Mercado Livre Brasil.
Faça uma análise completa do anúncio abaixo, gerando um dashboard com 10 seções.

ANÚNCIO ANALISADO:
{json.dumps(target_brief, ensure_ascii=False, indent=2)}

CONCORRENTES DIRETOS ({len(competitors_brief)}):
{json.dumps(competitors_brief, ensure_ascii=False, indent=2)}

MERCADO TOTAL:
- Total de anúncios na categoria: {market_summary.get("total_listings", 0)}
- Produtos analisados: {market_summary.get("products_analyzed", 0)}
- Anúncios analisados: {market_summary.get("items_analyzed", 0)}

INSTRUÇÕES IMPORTANTES:
1. Toda conclusão deve estar baseada nos DADOS REAIS acima — não invente números.
2. Para métricas que NÃO estão nos dados (visitas, conversão, faturamento, histórico temporal),
   marque o campo correspondente como "indisponivel" e explique no summary que esses dados só
   estão disponíveis via login do vendedor na API do ML.
3. Seja direto, analítico e profissional, como um gestor sênior de marketplace.
4. Recomendações devem ser ESPECÍFICAS (com números, percentuais, ações concretas), não genéricas.

Gere as 10 seções:
1. Visão geral (status, ponto forte, ponto fraco, potencial, competitividade)
2. Performance comercial (tendência, métricas como cards)
3. Tráfego e conversão (qual o problema principal)
4. Preço e competitividade (classificação do preço, % vs mercado)
5. Ranking e exposição (tendência de visibilidade)
6. Análise de concorrência (principais comparações)
7. Diagnóstico automático (categoria + razão)
8. Recomendações práticas (com prioridade, impacto, justificativa, ação)
9. Alertas automáticos (severidade + mensagem)
10. Conclusão executiva (tom de gestor de e-commerce, direto e prático)"""

    return await _call_structured(prompt, DASHBOARD_SCHEMA)


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
