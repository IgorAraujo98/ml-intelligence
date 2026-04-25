import os
import re
import time
import httpx
from collections import Counter

ML_BASE = "https://api.mercadolibre.com"
SITE = "MLB"

# Cache do token OAuth (válido por 6h, renovamos antes de expirar)
_token_cache: dict = {"value": None, "expires_at": 0}


async def get_access_token() -> str:
    """Obtém token de acesso da API do ML via client_credentials. Cacheia em memória."""
    now = time.time()
    if _token_cache["value"] and _token_cache["expires_at"] > now + 60:
        return _token_cache["value"]

    client_id = os.getenv("MELI_CLIENT_ID")
    client_secret = os.getenv("MELI_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("MELI_CLIENT_ID e MELI_CLIENT_SECRET precisam estar configurados no .env")

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


async def _ml_get(path: str, params: dict | None = None) -> dict:
    """GET autenticado na API do ML usando OAuth Bearer token."""
    token = await get_access_token()
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    async with httpx.AsyncClient(timeout=20, headers=headers) as client:
        r = await client.get(f"{ML_BASE}{path}", params=params)
        r.raise_for_status()
        return r.json()


def extract_query_from_url(url: str) -> str:
    """Extrai palavras-chave do slug da URL do Mercado Livre."""
    path = re.sub(r"https?://[^/]+", "", url)
    path = re.sub(r"[?#].*$", "", path)
    path = re.sub(r"MLB-?\d+", "", path, flags=re.IGNORECASE)
    path = re.sub(r"/p/", " ", path)
    words = re.sub(r"[-/_]", " ", path).strip()
    tokens = [w for w in words.split() if len(w) > 2 and not w.isdigit()]
    return " ".join(tokens[:7])


async def search_products(query: str, limit: int = 50) -> dict:
    return await _ml_get(f"/sites/{SITE}/search", {"q": query, "limit": limit})


def analyze_prices(items: list) -> dict:
    prices = [i["price"] for i in items if "price" in i and i["price"] > 0]
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


def extract_keywords(items: list) -> list:
    stopwords = {
        "de", "da", "do", "para", "com", "em", "o", "a", "os", "as",
        "e", "ou", "no", "na", "um", "uma", "que", "por", "se", "ao",
        "dos", "das", "nos", "nas", "pelo", "pela", "kit", "jogo", "par",
    }
    words = []
    for item in items:
        title = item.get("title", "").lower()
        for word in title.split():
            clean = "".join(c for c in word if c.isalnum())
            if clean and clean not in stopwords and len(clean) > 2:
                words.append(clean)
    counter = Counter(words)
    return [{"word": w, "count": c} for w, c in counter.most_common(20)]


def analyze_sellers(items: list) -> list:
    sellers: dict = {}
    for item in items:
        seller = item.get("seller", {})
        sid = seller.get("id")
        if not sid:
            continue
        if sid not in sellers:
            sellers[sid] = {
                "id": sid,
                "nickname": seller.get("nickname", ""),
                "items": 0,
                "total_sold": 0,
            }
        sellers[sid]["items"] += 1
        sellers[sid]["total_sold"] += item.get("sold_quantity", 0)
    return sorted(sellers.values(), key=lambda x: x["total_sold"], reverse=True)[:5]


def analyze_listing_quality(items: list) -> dict:
    with_free_shipping = sum(1 for i in items if i.get("shipping", {}).get("free_shipping"))
    with_full = sum(1 for i in items if i.get("shipping", {}).get("logistic_type") == "fulfillment")
    total = len(items) or 1
    return {
        "free_shipping_pct": round(with_free_shipping / total * 100, 1),
        "fulfillment_pct": round(with_full / total * 100, 1),
    }
