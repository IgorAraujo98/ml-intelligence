"use client";

export type DashboardData = {
  target: {
    name: string;
    buy_box?: { price?: number; original_price?: number; free_shipping?: boolean; logistic_type?: string; listing_type?: string };
    items_count: number;
    price_avg: number;
    price_min: number;
    price_max: number;
    free_shipping_pct: number;
    fulfillment_pct: number;
    discount_count: number;
    pictures?: string[];
    attributes?: { name: string; value_name: string }[];
  };
  competitors: Array<{
    name: string;
    buy_box?: { price?: number; free_shipping?: boolean; logistic_type?: string; listing_type?: string };
    items_count: number;
    price_avg: number;
    free_shipping_pct: number;
    discount_count: number;
  }>;
  market_summary: { total_listings: number; products_analyzed: number; items_analyzed: number };
  analysis: {
    overview: { status: string; strength: string; weakness: string; growth_potential: string; competitiveness_level: string };
    performance: { trend: string; summary: string; metrics: { label: string; value: string; context: string }[] };
    traffic_conversion: { main_issue: string; explanation: string };
    price_competitiveness: { classification: string; price_diff_pct: number; summary: string };
    ranking_visibility: { visibility_trend: string; summary: string };
    competition: { main_competitor: string; best_seller: string; best_price: string; what_to_copy: string; what_to_avoid: string };
    diagnosis: { category: string; reason: string };
    recommendations: { area: string; priority: string; expected_impact: string; justification: string; action: string }[];
    alerts: { type: string; severity: string; message: string }[];
    executive_summary: string;
  };
};

const PRIORITY_BADGE: Record<string, string> = {
  alta: "badge-red",
  media: "badge-yellow",
  baixa: "badge-blue",
};
const SEVERITY_BADGE: Record<string, string> = {
  critica: "badge-red",
  alta: "badge-red",
  media: "badge-yellow",
  baixa: "badge-blue",
};
const TREND_BADGE: Record<string, string> = {
  crescendo: "badge-green",
  ganhando: "badge-green",
  estavel: "badge-blue",
  queda: "badge-red",
  perdendo: "badge-red",
  indisponivel: "badge-yellow",
};
const PRICE_BADGE: Record<string, { label: string; cls: string }> = {
  muito_competitivo: { label: "Muito competitivo", cls: "badge-green" },
  competitivo: { label: "Competitivo", cls: "badge-green" },
  neutro: { label: "Neutro", cls: "badge-blue" },
  acima_do_mercado: { label: "Acima do mercado", cls: "badge-yellow" },
  pouco_competitivo: { label: "Pouco competitivo", cls: "badge-red" },
};
const DIAGNOSIS_BADGE: Record<string, { label: string; cls: string }> = {
  vencedor: { label: "🏆 Anúncio Vencedor", cls: "badge-green" },
  com_potencial: { label: "🌱 Com Potencial", cls: "badge-green" },
  estagnado: { label: "⏸️ Estagnado", cls: "badge-yellow" },
  em_queda: { label: "📉 Em Queda", cls: "badge-red" },
  pouco_competitivo: { label: "⚠️ Pouco Competitivo", cls: "badge-red" },
  problema_conversao: { label: "❌ Problema de Conversão", cls: "badge-red" },
  problema_trafego: { label: "❌ Problema de Tráfego", cls: "badge-red" },
  problema_preco: { label: "❌ Problema de Preço", cls: "badge-red" },
};

export default function Dashboard({ data }: { data: DashboardData }) {
  const { target, competitors, market_summary, analysis } = data;
  const buy = target.buy_box || {};
  const diagnosis = DIAGNOSIS_BADGE[analysis.diagnosis.category] || { label: analysis.diagnosis.category, cls: "badge-blue" };
  const priceClass = PRICE_BADGE[analysis.price_competitiveness.classification] || { label: analysis.price_competitiveness.classification, cls: "badge-blue" };

  return (
    <div className="space-y-6">

      {/* Header com produto-alvo */}
      <div className="card border border-[#3483FA]">
        <div className="flex gap-4">
          {target.pictures?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={target.pictures[0].replace("http://", "https://")} alt={target.name}
              className="w-24 h-24 rounded-lg object-cover border border-[#0F3460] flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 mb-1">PRODUTO ANALISADO</div>
            <h2 className="text-lg font-bold text-white leading-tight mb-2">{target.name}</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              {buy.price !== undefined && (
                <span className="text-[#FFE600] font-bold text-lg">R$ {buy.price.toFixed(2)}</span>
              )}
              {buy.original_price && buy.original_price > (buy.price ?? 0) && (
                <span className="text-slate-500 line-through text-sm self-center">R$ {buy.original_price.toFixed(2)}</span>
              )}
              {buy.free_shipping && <span className="badge-blue">Frete grátis</span>}
              {buy.logistic_type === "fulfillment" && <span className="badge-yellow">Fulfillment</span>}
              {buy.listing_type && <span className="badge-blue">{buy.listing_type}</span>}
              <span className="text-slate-400 self-center">{target.items_count} anúncios competindo</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Visão geral */}
      <div className="card">
        <h3 className="section-title">1. Visão Geral</h3>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className={diagnosis.cls}>{diagnosis.label}</span>
          <span className="text-slate-400 text-sm">Potencial:</span>
          <span className="badge-blue">{analysis.overview.growth_potential}</span>
          <span className="text-slate-400 text-sm">Competitividade:</span>
          <span className="badge-yellow">{analysis.overview.competitiveness_level}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
            <div className="text-xs text-green-400 mb-1">PONTO FORTE</div>
            <p className="text-sm text-slate-200">{analysis.overview.strength}</p>
          </div>
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
            <div className="text-xs text-red-400 mb-1">PONTO FRACO</div>
            <p className="text-sm text-slate-200">{analysis.overview.weakness}</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 mt-3 italic">{analysis.overview.status}</p>
      </div>

      {/* 2. Performance comercial */}
      <div className="card">
        <h3 className="section-title">2. Performance Comercial</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-slate-400 text-sm">Tendência:</span>
          <span className={TREND_BADGE[analysis.performance.trend] || "badge-blue"}>{analysis.performance.trend}</span>
        </div>
        <p className="text-sm text-slate-300 mb-4">{analysis.performance.summary}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {analysis.performance.metrics.map((m, i) => (
            <div key={i} className="stat-card">
              <div className="text-xl font-bold text-white">{m.value}</div>
              <div className="text-xs text-slate-500 mt-1">{m.label}</div>
              <div className="text-xs text-slate-400 mt-2">{m.context}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tráfego e conversão */}
      <div className="card">
        <h3 className="section-title">3. Tráfego e Conversão</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-slate-400 text-sm">Problema principal:</span>
          <span className="badge-yellow">{analysis.traffic_conversion.main_issue}</span>
        </div>
        <p className="text-sm text-slate-300">{analysis.traffic_conversion.explanation}</p>
      </div>

      {/* 4. Preço e competitividade */}
      <div className="card">
        <h3 className="section-title">4. Preço e Competitividade</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="stat-card">
            <div className="text-2xl font-bold text-[#FFE600]">R$ {(buy.price ?? 0).toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-1">Preço do anúncio</div>
          </div>
          <div className="stat-card">
            <div className="text-2xl font-bold text-white">R$ {target.price_avg.toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-1">Média do mercado</div>
          </div>
          <div className="stat-card">
            <div className={`text-2xl font-bold ${analysis.price_competitiveness.price_diff_pct < 0 ? "text-green-400" : "text-red-400"}`}>
              {analysis.price_competitiveness.price_diff_pct > 0 ? "+" : ""}{analysis.price_competitiveness.price_diff_pct.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Diferença vs mercado</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-slate-400 text-sm">Classificação:</span>
          <span className={priceClass.cls}>{priceClass.label}</span>
        </div>
        <p className="text-sm text-slate-300">{analysis.price_competitiveness.summary}</p>
      </div>

      {/* 5. Ranking e exposição */}
      <div className="card">
        <h3 className="section-title">5. Ranking e Exposição</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-slate-400 text-sm">Visibilidade:</span>
          <span className={TREND_BADGE[analysis.ranking_visibility.visibility_trend] || "badge-blue"}>
            {analysis.ranking_visibility.visibility_trend}
          </span>
        </div>
        <p className="text-sm text-slate-300">{analysis.ranking_visibility.summary}</p>
      </div>

      {/* 6. Análise de concorrência */}
      <div className="card">
        <h3 className="section-title">6. Análise de Concorrência</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-[#0F3460]">
                <th className="text-left py-2 px-2">#</th>
                <th className="text-left py-2 px-2">Anúncio</th>
                <th className="text-right py-2 px-2">Preço</th>
                <th className="text-right py-2 px-2">Anúncios</th>
                <th className="text-center py-2 px-2">Frete grátis</th>
                <th className="text-center py-2 px-2">Promoção</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#0F3460] bg-[#0F3460]/30">
                <td className="py-2 px-2 text-[#FFE600] font-bold">★</td>
                <td className="py-2 px-2 text-white">{target.name.slice(0, 50)}...</td>
                <td className="py-2 px-2 text-right text-[#FFE600] font-semibold">R$ {(buy.price ?? 0).toFixed(2)}</td>
                <td className="py-2 px-2 text-right text-slate-300">{target.items_count}</td>
                <td className="py-2 px-2 text-center">{buy.free_shipping ? "✅" : "—"}</td>
                <td className="py-2 px-2 text-center">{target.discount_count > 0 ? "✅" : "—"}</td>
              </tr>
              {competitors.map((c, i) => (
                <tr key={i} className="border-b border-[#0F3460]">
                  <td className="py-2 px-2 text-slate-500">{i + 1}</td>
                  <td className="py-2 px-2 text-slate-300">{c.name.slice(0, 50)}...</td>
                  <td className="py-2 px-2 text-right text-white">R$ {(c.buy_box?.price ?? 0).toFixed(2)}</td>
                  <td className="py-2 px-2 text-right text-slate-400">{c.items_count}</td>
                  <td className="py-2 px-2 text-center">{c.buy_box?.free_shipping ? "✅" : "—"}</td>
                  <td className="py-2 px-2 text-center">{c.discount_count > 0 ? "✅" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-[#0F3460] rounded p-3">
            <div className="text-xs text-slate-500 mb-1">PRINCIPAL CONCORRENTE</div>
            <p className="text-slate-300">{analysis.competition.main_competitor}</p>
          </div>
          <div className="bg-[#0F3460] rounded p-3">
            <div className="text-xs text-slate-500 mb-1">VENDE MAIS</div>
            <p className="text-slate-300">{analysis.competition.best_seller}</p>
          </div>
          <div className="bg-[#0F3460] rounded p-3">
            <div className="text-xs text-slate-500 mb-1">MELHOR PREÇO</div>
            <p className="text-slate-300">{analysis.competition.best_price}</p>
          </div>
          <div className="bg-green-900/20 border border-green-800 rounded p-3">
            <div className="text-xs text-green-400 mb-1">COPIAR</div>
            <p className="text-slate-300">{analysis.competition.what_to_copy}</p>
          </div>
          <div className="bg-red-900/20 border border-red-800 rounded p-3 md:col-span-2">
            <div className="text-xs text-red-400 mb-1">EVITAR</div>
            <p className="text-slate-300">{analysis.competition.what_to_avoid}</p>
          </div>
        </div>
      </div>

      {/* 7. Diagnóstico */}
      <div className={`card border-2 ${diagnosis.cls.includes("red") ? "border-red-700" : diagnosis.cls.includes("green") ? "border-green-700" : "border-yellow-700"}`}>
        <h3 className="section-title">7. Diagnóstico Automático</h3>
        <div className="text-2xl font-bold mb-3">
          <span className={diagnosis.cls + " !text-base !px-3 !py-2"}>{diagnosis.label}</span>
        </div>
        <p className="text-sm text-slate-300">{analysis.diagnosis.reason}</p>
      </div>

      {/* 8. Recomendações */}
      <div className="card">
        <h3 className="section-title">8. Recomendações Práticas</h3>
        <div className="space-y-3">
          {analysis.recommendations.map((r, i) => (
            <div key={i} className="bg-[#0F3460] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold capitalize">{r.area}</span>
                  <span className={PRIORITY_BADGE[r.priority] || "badge-blue"}>Prioridade {r.priority}</span>
                </div>
                <span className="text-xs text-slate-400">Impacto: {r.expected_impact}</span>
              </div>
              <p className="text-sm text-slate-300 mb-2">{r.justification}</p>
              <div className="bg-[#16213E] rounded p-3 border-l-4 border-[#FFE600]">
                <div className="text-xs text-[#FFE600] mb-1">→ AÇÃO RECOMENDADA</div>
                <p className="text-sm text-white">{r.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Alertas */}
      {analysis.alerts.length > 0 && (
        <div className="card">
          <h3 className="section-title">9. Alertas Automáticos</h3>
          <div className="space-y-2">
            {analysis.alerts.map((a, i) => {
              const sev = SEVERITY_BADGE[a.severity] || "badge-blue";
              const bgColor = a.severity === "critica" || a.severity === "alta"
                ? "bg-red-900/20 border-red-800"
                : a.severity === "media"
                ? "bg-yellow-900/20 border-yellow-800"
                : "bg-blue-900/20 border-blue-800";
              return (
                <div key={i} className={`${bgColor} border rounded-lg p-3 flex items-start gap-3`}>
                  <span className={sev}>{a.severity}</span>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 mb-0.5 capitalize">{a.type}</div>
                    <p className="text-sm text-slate-200">{a.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 10. Conclusão executiva */}
      <div className="card border border-[#FFE600]">
        <h3 className="section-title">10. Conclusão Executiva</h3>
        <p className="text-slate-200 leading-relaxed whitespace-pre-line">{analysis.executive_summary}</p>
      </div>

      <div className="text-center text-xs text-slate-600 pt-4">
        Análise baseada em {market_summary.products_analyzed} produtos e {market_summary.items_analyzed} anúncios da categoria.
      </div>
    </div>
  );
}
