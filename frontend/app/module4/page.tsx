"use client";
import { useState, useEffect } from "react";
import { api, store } from "@/lib/api";
import Link from "next/link";

type Phase = {
  phase: number;
  name: string;
  duration: string;
  objective: string;
  daily_budget: number;
  actions: string[];
};

type CampaignResult = {
  invest_in_ads: boolean;
  recommendation_strength: string;
  justification: string;
  min_margin_for_ads: number;
  suggested_budget_initial: number;
  expected_roas: number;
  phases: Phase[];
  kpis: string[];
  warnings: string[];
};

export default function Module4() {
  const [marketData, setMarketData] = useState<unknown>(null);
  const [marginData, setMarginData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CampaignResult | null>(null);

  useEffect(() => {
    const market = store.load("market");
    const margin = store.load("margin");
    const listing = store.load("listing");
    if (market) setMarketData(market);
    if (margin) setMarginData(margin);
    // listing is passed via campaign request if present
    if (listing) store.save("listing", listing);
  }, []);

  async function handleGenerate() {
    if (!marginData) {
      setError("Execute o Módulo 3 (Calculadora de Margem) antes de gerar a estratégia.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const listing = store.load("listing");
      const data = (await api.campaign.strategy({
        margin_data: marginData as object,
        market_data: marketData || {},
        listing_data: listing || undefined,
      })) as CampaignResult;
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const strengthColor = (s: string) => {
    if (s === "forte") return "badge-green";
    if (s === "fraca") return "badge-red";
    return "badge-yellow";
  };

  const margin = marginData as { net_margin?: number; profit_per_unit?: number; sale_price?: number } | null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
          <Link href="/" className="hover:text-white">Dashboard</Link> / Módulo 4
        </div>
        <h1 className="text-3xl font-bold text-white">🚀 Estratégia de Campanha</h1>
        <p className="text-slate-400 mt-1">Recomendação fundamentada sobre Ads e plano de escalonamento.</p>
      </div>

      {/* Dados disponíveis */}
      <div className="card mb-6">
        <h2 className="section-title">Dados carregados dos módulos anteriores</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg text-sm ${marketData ? "bg-green-900/20 border border-green-800 text-green-300" : "bg-[#0F3460] text-slate-500"}`}>
            {marketData ? "✅ Módulo 1 — Análise de Mercado" : "⬜ Módulo 1 não executado"}
          </div>
          <div className={`p-3 rounded-lg text-sm ${store.load("listing") ? "bg-green-900/20 border border-green-800 text-green-300" : "bg-[#0F3460] text-slate-500"}`}>
            {store.load("listing") ? "✅ Módulo 2 — Estrutura do Anúncio" : "⬜ Módulo 2 não executado"}
          </div>
          <div className={`p-3 rounded-lg text-sm ${marginData ? "bg-green-900/20 border border-green-800 text-green-300" : "bg-red-900/20 border border-red-800 text-red-300"}`}>
            {marginData ? "✅ Módulo 3 — Margem calculada" : "❌ Módulo 3 obrigatório"}
          </div>
        </div>

        {margin && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="stat-card">
              <div className="text-xl font-bold text-white">R$ {(margin.sale_price ?? 0).toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">Preço de venda</div>
            </div>
            <div className="stat-card">
              <div className={`text-xl font-bold ${(margin.net_margin ?? 0) < 10 ? "text-red-400" : "text-green-400"}`}>
                {(margin.net_margin ?? 0).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Margem líquida</div>
            </div>
            <div className="stat-card">
              <div className="text-xl font-bold text-white">R$ {(margin.profit_per_unit ?? 0).toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">Lucro/unidade</div>
            </div>
          </div>
        )}
      </div>

      {!marginData && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-300">
          ❌ Execute o <Link href="/module3" className="underline font-semibold">Módulo 3 — Calculadora de Margem</Link> antes de continuar.
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">{error}</div>
      )}

      <button onClick={handleGenerate} className="btn-primary w-full mb-8" disabled={loading || !marginData}>
        {loading
          ? <span className="flex items-center justify-center gap-2"><span className="loader" /> Gerando estratégia com IA...</span>
          : "Gerar Estratégia de Campanha"}
      </button>

      {result && (
        <div className="space-y-6">
          {/* Recomendação principal */}
          <div className={`card border-2 ${result.invest_in_ads ? "border-green-600" : "border-slate-600"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`text-4xl`}>{result.invest_in_ads ? "✅" : "⛔"}</div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {result.invest_in_ads ? "Investir em Ads" : "Focar no Orgânico"}
                  </div>
                  <span className={strengthColor(result.recommendation_strength)}>
                    Recomendação {result.recommendation_strength}
                  </span>
                </div>
              </div>
              {result.invest_in_ads && (
                <div className="text-right">
                  <div className="text-xs text-slate-500">ORÇAMENTO INICIAL</div>
                  <div className="text-2xl font-bold text-[#FFE600]">
                    R$ {result.suggested_budget_initial.toFixed(0)}/mês
                  </div>
                  <div className="text-xs text-slate-500">ROAS esperado: {result.expected_roas}×</div>
                </div>
              )}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{result.justification}</p>
          </div>

          {/* Fases */}
          {result.phases?.length > 0 && (
            <div className="card">
              <h2 className="section-title">📅 Plano de Escalonamento</h2>
              <div className="space-y-4">
                {result.phases.map((phase) => (
                  <div key={phase.phase} className="bg-[#0F3460] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#3483FA] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {phase.phase}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{phase.name}</div>
                          <div className="text-xs text-slate-500">{phase.duration}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Orçamento diário</div>
                        <div className="text-[#FFE600] font-bold">R$ {phase.daily_budget.toFixed(0)}/dia</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{phase.objective}</p>
                    <ul className="space-y-1">
                      {phase.actions.map((action, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-[#3483FA] mt-0.5">→</span> {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs */}
          {result.kpis?.length > 0 && (
            <div className="card">
              <h2 className="section-title">📊 KPIs para Monitorar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.kpis.map((kpi, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#0F3460] rounded-lg p-3">
                    <span className="text-[#FFE600] text-sm mt-0.5">◆</span>
                    <span className="text-sm text-slate-300">{kpi}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avisos */}
          {result.warnings?.length > 0 && (
            <div className="card border border-yellow-800">
              <h2 className="section-title text-yellow-400">⚠️ Pontos de Atenção</h2>
              <ul className="space-y-2">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-yellow-300 flex items-start gap-2">
                    <span className="mt-0.5">•</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <Link href="/">
              <button className="btn-secondary">← Voltar ao Dashboard</button>
            </Link>
            <Link href="/module1">
              <button className="btn-primary">Nova Análise →</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
