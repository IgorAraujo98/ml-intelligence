import re
import httpx
from collections import Counter

ML_BASE = "https://api.mercadolibre.com"
SITE = "MLB"


def extract_item_id_from_url(url: str) -> str | None:
    """Extrai o ID do item (ex: MLB1234567890) de qualquer URL do Mercado Livre."""
    match = re.search(r"MLB-?(\d+)", url, re.IGNORECASE)
    if match:
        return f"MLB{match.group(1)}"
    return None


async def search_products(query: str, limit: int = 50) -> dict:
    url = f"{ML_BASE}/sites/{SITE}/search"
    params = {"q": query, "limit": limit}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()


async def get_item_details(item_id: str) -> dict:
    url = f"{ML_BASE}/items/{item_id}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()


async def get_category(category_id: str) -> dict:
    url = f"{ML_BASE}/categories/{category_id}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()


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
        "dos", "das", "nos", "nas", "ao", "pelo", "pela",
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


def extract_item_attributes(item: dict) -> list[dict]:
    """Converte os atributos da API do ML em lista de key/value."""
    attrs = []
    for a in item.get("attributes", []):
        name = a.get("name", "")
        value = a.get("value_name") or a.get("value_struct", {}).get("number", "")
        if name and value:
            attrs.append({"key": name, "value": str(value)})
    return attrs[:15]


def analyze_listing_quality(items: list) -> dict:
    with_free_shipping = sum(1 for i in items if i.get("shipping", {}).get("free_shipping"))
    with_full = sum(1 for i in items if i.get("shipping", {}).get("logistic_type") == "fulfillment")
    total = len(items) or 1
    return {
        "free_shipping_pct": round(with_free_shipping / total * 100, 1),
        "fulfillment_pct": round(with_full / total * 100, 1),
    }
