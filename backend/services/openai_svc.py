import os
import json
from openai import AsyncOpenAI

def get_client() -> AsyncOpenAI:
    key = os.getenv("OPENAI_API_KEY")
    if not key or key.startswith("sk-coloque"):
        raise ValueError("OPENAI_API_KEY não configurada. Edite o arquivo backend/.env com sua chave real.")
    return AsyncOpenAI(api_key=key)


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

Retorne SOMENTE um JSON válido com esta estrutura:
{{
  "audience": "descrição do público-alvo ideal (perfil, dores, motivações)",
  "logistics_tip": "recomendação de logística com justificativa (Fulfillment ML vs envio próprio)",
  "channel_recommendation": "organico ou ads",
  "channel_justification": "justificativa em 2-3 frases baseada nos dados",
  "complaints_common": ["reclamação típica 1", "reclamação típica 2", "reclamação típica 3"],
  "opportunity": "principal oportunidade de diferenciação identificada",
  "competition_level": "baixa ou media ou alta",
  "market_summary": "resumo estratégico do mercado em 2 frases"
}}"""

    response = await get_client().chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    return json.loads(response.choices[0].message.content)


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

Retorne SOMENTE um JSON válido:
{{
  "title": "título otimizado até 60 caracteres",
  "description": "descrição em HTML com <b>negrito</b>, <ul><li>listas</li></ul>, mínimo 500 palavras",
  "specs": [{{"key": "Atributo", "value": "Valor"}}],
  "keywords": ["keyword1", "keyword2", "...20 keywords ranqueadas por relevância"],
  "price_suggestion": número,
  "price_justification": "justificativa do preço sugerido",
  "image_briefing": "briefing detalhado em inglês para DALL-E gerar imagem profissional do produto"
}}"""

    response = await get_client().chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    return json.loads(response.choices[0].message.content)


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

Retorne SOMENTE um JSON válido:
{{
  "invest_in_ads": true,
  "recommendation_strength": "forte",
  "justification": "justificativa completa em 3-4 frases",
  "min_margin_for_ads": número,
  "suggested_budget_initial": número,
  "expected_roas": número,
  "phases": [
    {{
      "phase": 1,
      "name": "nome da fase",
      "duration": "X dias",
      "objective": "objetivo principal",
      "daily_budget": número,
      "actions": ["ação 1", "ação 2", "ação 3"]
    }}
  ],
  "kpis": ["KPI: meta mensurável"],
  "warnings": ["alerta ou risco a observar"]
}}"""

    response = await get_client().chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    return json.loads(response.choices[0].message.content)


async def generate_image(briefing: str) -> str:
    response = await get_client().images.generate(
        model="dall-e-3",
        prompt=(
            f"Professional e-commerce product photo: {briefing}. "
            "Pure white background, studio lighting, sharp focus, high resolution, "
            "commercial photography style, no text or watermarks."
        ),
        size="1024x1024",
        quality="standard",
        n=1,
    )
    return response.data[0].url
