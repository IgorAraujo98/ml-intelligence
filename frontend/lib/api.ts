const BASE = "http://localhost:8000/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Erro na requisição");
  }
  return res.json();
}

export const api = {
  market: {
    analyze: (body: {
      query: string;
      source: "api" | "manual" | "url";
      product_url?: string;
      manual_data?: {
        avg_price: number;
        min_price: number;
        max_price: number;
        total_listings: number;
        top_keywords: string[];
      };
    }) => post("/market/analyze", body),
  },

  listing: {
    generate: (body: {
      product_info: { name: string; description: string; category?: string };
      market_data: unknown;
    }) => post("/listing/generate", body),

    generateImage: (briefing: string) =>
      post<{ image_url: string }>("/listing/generate-image", { briefing }),
  },

  margin: {
    calculate: (body: {
      cost_price: number;
      sale_price: number;
      ml_commission_pct: number;
      shipping_cost: number;
      packaging_cost: number;
      tax_pct: number;
      other_costs: number;
    }) => post("/margin/calculate", body),
  },

  campaign: {
    strategy: (body: {
      margin_data: unknown;
      market_data: unknown;
      listing_data?: unknown;
    }) => post("/campaign/strategy", body),
  },
};

// LocalStorage helpers para persistir dados entre módulos
const KEYS = {
  market: "ml_market_data",
  listing: "ml_listing_data",
  margin: "ml_margin_data",
};

export const store = {
  save: (key: keyof typeof KEYS, data: unknown) => {
    localStorage.setItem(KEYS[key], JSON.stringify(data));
  },
  load: <T>(key: keyof typeof KEYS): T | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEYS[key]);
    return raw ? JSON.parse(raw) : null;
  },
};
