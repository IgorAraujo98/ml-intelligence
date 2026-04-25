import os
import re
import time
import asyncio
import httpx
from collections import Counter

ML_BASE = "https://api.mercadolibre.com"
SITE = "MLB"

_token_cache: dict = {"value": None, "expires_at": 0}


async def get_access_token() -> str:
    """Obtém token de acesso da API do ML via client_credentials. Cacheia em memória."""
    now = time.time()
    if _token_cache["value"] and _token_cache["expires_at"] > now + 60:
        return _token_cache["value"]

    client_id = os.getenv("MELI_CLIENT_ID")
    client_secret = os.getenv("MELI_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("MELI_CLIENT_ID e MELI_CLIENT_SECRET precisam estar configurados.")

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{ML_BASE}/oauth/token",
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
            },
        )
        r.raise_for_status()
        body = r.json()

    _token_cache["value"] = body["access_token"]
    _token_cache["expires_at"] = now + body.get("expires_in", 21600) - 300
    return _token_cache["value"]


async def _ml_get(client: httpx.AsyncClient, path: str, params: dict | None = None) -> dict | None:
    """GET autenticado. Retorna None em caso de erro (não derruba a análise inteira)."""
    try:
        r = await client.get(f"{ML_BASE}{path}", params=params)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None


def extract_query_from_url(url: str) -> str:
    """Extrai palavras-chave do slug da URL do Mercado Livre."""
    path = re.sub(r"https?://[^/]+", "", url)
    path = re.sub(r"[?#].*$", "", path)
    path = re.sub(r"MLB-?\d+", "", path, flags=re.IGNORECASE)
    path = re.sub(r"/p/", " ", path)
    words = re.sub(r"[-/_]", " ", path).strip()
    tokens = [w for w in words.split() if len(w) > 2 and not w.isdigit()]
    return " ".join(tokens[:7])


async def search_market(query: str) -> dict:
    """
    Coleta dados de mercado combinando dois endpoints:
    1. /products/search → produtos de catálogo (nomes, total, atributos)
    2. /products/{id}/items → anúncios reais de cada produto (preços, vendedores, frete)
    """
    token = await get_access_token()
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

    async with httpx.AsyncClient(timeout=20, headers=headers) as client:
        catalog = await _ml_get(client, "/products/search", {
            "site_id": SITE,
            "q": query,
            "status": "active",
            "limit": 20,
        })
        if not catalog:
            return {"products": [], "items": [], "total": 0}

        products = catalog.get("results", [])
        total = catalog.get("paging", {}).get("total", 0)

        # Busca anúncios reais em paralelo (limite 10 produtos para não exceder rate limit)
        tasks = [
            _ml_get(client, f"/products/{p['id']}/items", {"limit": 5})
            for p in products[:10]
        ]
        items_responses = await asyncio.gather(*tasks)

        all_items = []
        for prod, resp in zip(products[:10], items_responses):
            if not resp:
                continue
            for item in resp.get("results", []):
                item["product_name"] = prod.get("name", "")
                all_items.append(item)

    return {"products": products, "items": all_items, "total": total}


def analyze_prices(items: list) -> dict:
    prices = [i["price"] for i in items if "price" in i and i.get("price", 0) > 0]
    if not prices:
        return {"avg": 0, "min": 0, "max": 0, "median": 0}
    sorted_prices = sorted(prices)
    mid = len(sorted_prices) // 2
    median = (sorted_prices[mid - 1] + sorted_prices[mid]) / 2 if len(sorted_prices) % 2 == 0 else sorted_prices[mid]
    return {
        "avg": round(sum(prices) / len(prices), 2),
        "min": min(prices),
        "max": max(prices),
        "median": round(median, 2),
    }


def extract_keywords(products: list) -> list:
    """Extrai keywords dos nomes dos produtos de catálogo."""
    stopwords = {
        "de", "da", "do", "para", "com", "em", "o", "a", "os", "as",
        "e", "ou", "no", "na", "um", "uma", "que", "por", "se", "ao",
        "dos", "das", "nos", "nas", "pelo", "pela", "kit", "jogo", "par",
    }
    words = []
    for p in products:
        name = p.get("name", "").lower()
        for word in name.split():
            clean = "".join(c for c in word if c.isalnum())
            if clean and clean not in stopwords and len(clean) > 2:
                words.append(clean)
    counter = Counter(words)
    return [{"word": w, "count": c} for w, c in counter.most_common(20)]


def analyze_sellers(items: list) -> list:
    sellers: dict = {}
    for item in items:
        sid = item.get("seller_id")
        if not sid:
            continue
        if sid not in sellers:
            sellers[sid] = {"id": sid, "nickname": f"Vendedor {sid}", "items": 0, "total_sold": 0}
        sellers[sid]["items"] += 1
    return sorted(sellers.values(), key=lambda x: x["items"], reverse=True)[:5]


def analyze_listing_quality(items: list) -> dict:
    if not items:
        return {"free_shipping_pct": 0, "fulfillment_pct": 0}
    free = sum(1 for i in items if i.get("shipping", {}).get("free_shipping"))
    full = sum(1 for i in items if i.get("shipping", {}).get("logistic_type") == "fulfillment")
    total = len(items)
    return {
        "free_shipping_pct": round(free / total * 100, 1),
        "fulfillment_pct": round(full / total * 100, 1),
    }
