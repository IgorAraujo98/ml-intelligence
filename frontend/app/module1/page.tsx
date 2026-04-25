"use client";
import { useState } from "react";
import { api, store } from "@/lib/api";
import Link from "next/link";

type MarketResult = {
  query: string;
  source: string;
  market: {
    total: number;
    prices: { avg: number; min: number; max: number; median: number };
    keywords: { word: string; count: number }[];
    top_sellers: { nickname: string; items: number; total_sold: number }[];
    quality: { free_shipping_pct: number; fulfillment_pct: number };
  };
  insights: {
    audience: string;
    logistics_tip: string;
    channel_recommendation: string;
    channel_justification: string;
    complaints_common: string[];
    opportunity: string;
    competition_level: string;
    market_summary: string;
  };
};

type Source = "api" | "manual" | "url";

export default function Module1() {
  const [source, setSource] = useState<Source>("api");
  const [query, setQuery] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [manual, setManual] = useState({
    avg_price: "",
    min_price: "",
    max_price: "",
    total_listings: "",
    top_keywords: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MarketResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body =
        source === "url"
          ? { query: productUrl, source: "url" as const, product_url: productUrl }
          : source === "api"
          ? { query, source: "api" as const }
          : {
              query,
              source: "manual" as const,
              manual_data: {
                avg_price: parseFloat(manual.avg_price),
                min_price: parseFloat(manual.min_price),
                max_price: parseFloat(manual.max_price),
                total_listings: parseInt(manual.total_listings),
                top_keywords: manual.top_keywords.split(",").map((k) => k.trim()).filter(Boolean),
              },
            };

      const data = (await api.market.analyze(body)) as MarketResult;
      setResult(data);
      store.save("market", data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const levelColor = (level: string) => {
    if (level === "alta") return "badge-red";
    if (level === "baixa") return "badge-green";
    return "badge-yellow";
  };

  const sources: { id: Source; icon: string; label: string }[] = [
    { id: "url", icon: "🔗", label: "Link do Produto ML" },
    { id: "api", icon: "🌐", label: "Busca na API" },
    { id: "manual", icon: "✏️", label: "Entrada Manual" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
          <Link href="/" className="hover:text-white">Dashboard</Link> / Módulo 1
        </div>
        <h1 className="text-3xl font-bold text-white">🔍 Análise de Mercado</h1>
        <p className="text-slate-400 mt-1">Cole o link de um anúncio ou busque por produto para coletar inteligência de mercado.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-6">
          <h2 className="section-title">Fonte dos dados</h2>

          <div className="flex gap-3 mb-6 flex-wrap">
            {sources.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  source === s.id
                    ? "bg-[#3483FA] text-white"
                    : "bg-[#0F3460] text-slate-400 hover:text-white"
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {source === "url" && (
            <div>
              <label className="label">Link do anúncio no Mercado Livre</label>
              <input
                className="input"
                placeholder="https://www.mercadolivre.com.br/produto/MLB-1234567890-..."
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Cole a URL completa do anúncio. O sistema extrai os dados do produto e analisa o mercado ao redor dele.
              </p>
            </div>
          )}

          {source === "api" && (
            <div>
              <label className="label">Produto / Nicho</label>
              <input
                className="input"
                placeholder="Ex: fone bluetooth, tênis masculino, suplemento vitamina C..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
            </div>
          )}

          {source === "manual" && (
            <div className="space-y-4">
              <div>
                <label className="label">Produto / Nicho</label>
                <input
                  className="input"
                  placeholder="Nome do produto ou nicho"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#0F3460] rounded-lg">
                <div>
                  <label className="label">Preço médio (R$)</label>
                  <input className="input" type="number" step="0.01" placeholder="150.00"
                    value={manual.avg_price} onChange={(e) => setManual({ ...manual, avg_price: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Preço mínimo (R$)</label>
                  <input className="input" type="number" step="0.01" placeholder="80.00"
                    value={manual.min_price} onChange={(e) => setManual({ ...manual, min_price: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Preço máximo (R$)</label>
                  <input className="input" type="number" step="0.01" placeholder="300.00"
                    value={manual.max_price} onChange={(e) => setManual({ ...manual, max_price: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Total de anúncios</label>
                  <input className="input" type="number" placeholder="1500"
                    value={manual.total_listings} onChange={(e) => setManual({ ...manual, total_listings: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <label className="label">Keywords principais (separadas por vírgula)</label>
                  <input className="input" placeholder="fone bluetooth, fone sem fio, headphone"
                    value={manual.top_keywords} onChange={(e) => setManual({ ...manual, top_keywords: e.target.value })} required />
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="loader" /> Analisando mercado...</span>
            : "Analisar Mercado"}
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">

          {/* Termo pesquisado */}
          {result.source === "url" && (
            <div className="p-3 bg-[#0F3460] border border-[#1a4a8a] rounded-lg text-sm text-slate-300 flex items-center gap-2">
              <span className="text-slate-500">Análise baseada em:</span>
              <span className="text-white font-medium">&quot;{result.query}&quot;</span>
            </div>
          )}

          {/* Preços */}
          <div className="card">
            <h2 className="section-title">📊 Dados de Preço do Mercado</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Preço Médio", value: `R$ ${result.market.prices.avg.toFixed(2)}`, highlight: true },
                { label: "Preço Mediano", value: `R$ ${result.market.prices.median.toFixed(2)}` },
                { label: "Mínimo", value: `R$ ${result.market.prices.min.toFixed(2)}` },
                { label: "Máximo", value: `R$ ${result.market.prices.max.toFixed(2)}` },
              ].map((s) => (
                <div key={s.label} className={`stat-card ${s.highlight ? "border border-[#FFE600]" : ""}`}>
                  <div className={`text-2xl font-bold ${s.highlight ? "text-[#FFE600]" : "text-white"}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-slate-400 flex-wrap">
              <span>Total de anúncios: <span className="text-white font-semibold">{result.market.total.toLocaleString()}</span></span>
              {result.market.quality?.free_shipping_pct !== undefined && (
                <>
                  <span>Frete grátis: <span className="text-white font-semibold">{result.market.quality.free_shipping_pct}%</span></span>
                  <span>Fulfillment: <span className="text-white font-semibold">{result.market.quality.fulfillment_pct}%</span></span>
                </>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="card">
            <h2 className="section-title">🧠 Insights de IA</h2>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-sm text-slate-400">Concorrência:</span>
              <span className={levelColor(result.insights.competition_level)}>{result.insights.competition_level}</span>
              <span className="ml-4 text-sm text-slate-400">Canal recomendado:</span>
              <span className={result.insights.channel_recommendation === "ads" ? "badge-yellow" : "badge-green"}>
                {result.insights.channel_recommendation === "ads" ? "Ads" : "Orgânico"}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-4">{result.insights.market_summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0F3460] rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">PÚBLICO-ALVO</div>
                <p className="text-sm text-slate-300">{result.insights.audience}</p>
              </div>
              <div className="bg-[#0F3460] rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">LOGÍSTICA</div>
                <p className="text-sm text-slate-300">{result.insights.logistics_tip}</p>
              </div>
              <div className="bg-[#0F3460] rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">CANAL — JUSTIFICATIVA</div>
                <p className="text-sm text-slate-300">{result.insights.channel_justification}</p>
              </div>
              <div className="bg-[#0F3460] rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">OPORTUNIDADE</div>
                <p className="text-sm text-slate-300">{result.insights.opportunity}</p>
              </div>
            </div>

            {result.insights.complaints_common?.length > 0 && (
              <div className="mt-4 bg-red-900/20 border border-red-800 rounded-lg p-4">
                <div className="text-xs text-red-400 mb-2">RECLAMAÇÕES COMUNS DA CONCORRÊNCIA</div>
                <ul className="space-y-1">
                  {result.insights.complaints_common.map((c, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Keywords */}
          {result.market.keywords?.length > 0 && (
            <div className="card">
              <h2 className="section-title">🔑 Top Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {result.market.keywords.map((k, i) => (
                  <span key={i} className="px-3 py-1 bg-[#0F3460] text-slate-300 text-sm rounded-full flex items-center gap-1">
                    {k.word}
                    {k.count > 1 && <span className="text-xs text-slate-500">×{k.count}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top sellers */}
          {result.market.top_sellers?.length > 0 && (
            <div className="card">
              <h2 className="section-title">🏆 Top Vendedores</h2>
              <div className="space-y-2">
                {result.market.top_sellers.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#0F3460] rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-sm">#{i + 1}</span>
                      <span className="text-white font-medium">{s.nickname || `Vendedor ${i + 1}`}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <span>{s.items} anúncios</span>
                      <span className="text-white font-semibold">{s.total_sold.toLocaleString()} vendidos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Link href="/module2">
              <button className="btn-primary">Usar no Módulo 2 → Estrutura do Anúncio</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
