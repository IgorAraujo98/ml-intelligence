// Cliente da API pública do Mercado Livre — chamado DIRETO do browser
// para evitar bloqueio 403 que acontece quando a chamada vem de IPs de datacenter.

const ML_BASE = "https://api.mercadolibre.com";
const SITE = "MLB";

const STOPWORDS = new Set([
  "de", "da", "do", "para", "com", "em", "o", "a", "os", "as",
  "e", "ou", "no", "na", "um", "uma", "que", "por", "se", "ao",
  "dos", "das", "nos", "nas", "pelo", "pela", "kit", "jogo", "par",
]);

export type MLItem = {
  id: string;
  title: string;
  price: number;
  sold_quantity?: number;
  seller?: { id: number; nickname?: string };
  shipping?: { free_shipping?: boolean; logistic_type?: string };
};

export type MarketData = {
  total: number;
  prices: { avg: number; min: number; max: number; median: number };
  keywords: { word: string; count: number }[];
  top_sellers: { id: number; nickname: string; items: number; total_sold: number }[];
  quality: { free_shipping_pct: number; fulfillment_pct: number };
};

export function extractKeywordsFromUrl(url: string): string {
  let path = url.replace(/https?:\/\/[^/]+/, "");
  path = path.replace(/[?#].*$/, "");
  path = path.replace(/MLB-?\d+/gi, "");
  path = path.replace(/\/p\//, " ");
  const words = path.replace(/[-/_]/g, " ").trim();
  const tokens = words.split(/\s+/).filter((w) => w.length > 2 && !/^\d+$/.test(w));
  return tokens.slice(0, 7).join(" ");
}

export async function searchML(query: string, limit = 50): Promise<MLItem[]> {
  const url = `${ML_BASE}/sites/${SITE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Não foi possível consultar o Mercado Livre (status ${res.status}). Tente novamente em alguns segundos.`
    );
  }
  const data = await res.json();
  return data;
}

export async function fetchMarketData(query: string): Promise<MarketData> {
  const url = `${ML_BASE}/sites/${SITE}/search?q=${encodeURIComponent(query)}&limit=50`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mercado Livre indisponível (${res.status}). Tente novamente.`);
  }
  const data = await res.json();
  const items: MLItem[] = data.results ?? [];
  const total: number = data.paging?.total ?? items.length;

  return {
    total,
    prices: analyzePrices(items),
    keywords: extractTopKeywords(items),
    top_sellers: analyzeTopSellers(items),
    quality: analyzeListingQuality(items),
  };
}

function analyzePrices(items: MLItem[]) {
  const prices = items.map((i) => i.price).filter((p): p is number => typeof p === "number" && p > 0);
  if (prices.length === 0) return { avg: 0, min: 0, max: 0, median: 0 };
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    avg: round(prices.reduce((a, b) => a + b, 0) / prices.length, 2),
    min: Math.min(...prices),
    max: Math.max(...prices),
    median: round(median, 2),
  };
}

function extractTopKeywords(items: MLItem[]) {
  const counter = new Map<string, number>();
  for (const item of items) {
    const title = (item.title ?? "").toLowerCase();
    for (const word of title.split(/\s+/)) {
      const clean = word.replace(/[^\p{L}\p{N}]/gu, "");
      if (clean && clean.length > 2 && !STOPWORDS.has(clean)) {
        counter.set(clean, (counter.get(clean) ?? 0) + 1);
      }
    }
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

function analyzeTopSellers(items: MLItem[]) {
  const sellers = new Map<number, { id: number; nickname: string; items: number; total_sold: number }>();
  for (const item of items) {
    const sid = item.seller?.id;
    if (!sid) continue;
    const existing = sellers.get(sid) ?? {
      id: sid,
      nickname: item.seller?.nickname ?? "",
      items: 0,
      total_sold: 0,
    };
    existing.items += 1;
    existing.total_sold += item.sold_quantity ?? 0;
    sellers.set(sid, existing);
  }
  return [...sellers.values()].sort((a, b) => b.total_sold - a.total_sold).slice(0, 5);
}

function analyzeListingQuality(items: MLItem[]) {
  const freeShipping = items.filter((i) => i.shipping?.free_shipping).length;
  const fulfillment = items.filter((i) => i.shipping?.logistic_type === "fulfillment").length;
  const total = items.length || 1;
  return {
    free_shipping_pct: round((freeShipping / total) * 100, 1),
    fulfillment_pct: round((fulfillment / total) * 100, 1),
  };
}

function round(n: number, decimals: number) {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
