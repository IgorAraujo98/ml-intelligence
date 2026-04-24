"use client";
import { useState, useEffect, useCallback } from "react";
import { api, store } from "@/lib/api";
import Link from "next/link";

type MarginResult = {
  sale_price: number;
  cost_price: number;
  ml_commission: number;
  ml_commission_pct: number;
  tax: number;
  tax_pct: number;
  shipping_cost: number;
  packaging_cost: number;
  other_costs: number;
  total_costs: number;
  profit_per_unit: number;
  gross_margin: number;
  net_margin: number;
  break_even_units: number;
  roi: number;
};

function Slider({ label, value, onChange, min, max, step, prefix, suffix }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; prefix?: string; suffix?: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="label mb-0">{label}</label>
        <span className="text-white font-semibold text-sm">
          {prefix}{value.toFixed(step < 1 ? 2 : 0)}{suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-[#0F3460] rounded-lg appearance-none cursor-pointer accent-[#FFE600]" />
      <div className="flex justify-between text-xs text-slate-600 mt-1">
        <span>{prefix}{min}{suffix}</span><span>{prefix}{max}{suffix}</span>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, prefix }: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>}
        <input type="number" step="0.01" min="0" value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`input ${prefix ? "pl-8" : ""}`} />
      </div>
    </div>
  );
}

export default function Module3() {
  const [form, setForm] = useState({
    cost_price: 50,
    sale_price: 120,
    ml_commission_pct: 11,
    shipping_cost: 0,
    packaging_cost: 2,
    tax_pct: 6,
    other_costs: 0,
  });
  const [result, setResult] = useState<MarginResult | null>(null);

  const update = (key: keyof typeof form) => (v: number) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const calculate = useCallback(async () => {
    try {
      const data = (await api.margin.calculate(form)) as MarginResult;
      setResult(data);
      store.save("margin", data);
    } catch {
      // silently ignore on auto-calculate
    }
  }, [form]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  useEffect(() => {
    const listing = store.load<{ price_suggestion: number }>("listing");
    if (listing?.price_suggestion) {
      setForm((prev) => ({ ...prev, sale_price: listing.price_suggestion }));
    }
  }, []);

  const getMarginColor = (margin: number) => {
    if (margin < 10) return "text-red-400";
    if (margin < 20) return "text-yellow-400";
    return "text-green-400";
  };

  const profitColor = result && result.profit_per_unit < 0 ? "text-red-400" : "text-green-400";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
          <Link href="/" className="hover:text-white">Dashboard</Link> / Módulo 3
        </div>
        <h1 className="text-3xl font-bold text-white">💰 Calculadora de Margem</h1>
        <p className="text-slate-400 mt-1">Calcule margem líquida, lucro e ponto de equilíbrio em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="section-title">Preços</h2>
            <div className="space-y-5">
              <Slider label="Preço de Venda" value={form.sale_price} onChange={update("sale_price")}
                min={10} max={2000} step={1} prefix="R$ " />
              <Slider label="Custo do Produto" value={form.cost_price} onChange={update("cost_price")}
                min={1} max={1500} step={1} prefix="R$ " />
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Comissão e Impostos</h2>
            <div className="space-y-5">
              <Slider label="Comissão ML" value={form.ml_commission_pct} onChange={update("ml_commission_pct")}
                min={5} max={20} step={0.5} suffix="%" />
              <Slider label="Impostos (Simples / MEI)" value={form.tax_pct} onChange={update("tax_pct")}
                min={0} max={20} step={0.5} suffix="%" />
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Outros Custos</h2>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="Frete (R$)" value={form.shipping_cost} onChange={update("shipping_cost")} prefix="R$" />
              <NumberInput label="Embalagem (R$)" value={form.packaging_cost} onChange={update("packaging_cost")} prefix="R$" />
              <NumberInput label="Outros Custos (R$)" value={form.other_costs} onChange={update("other_costs")} prefix="R$" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result && (
            <>
              {/* KPIs principais */}
              <div className="card">
                <h2 className="section-title">Resultado por Unidade</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="stat-card border border-[#0F3460]">
                    <div className={`text-3xl font-bold ${profitColor}`}>
                      R$ {result.profit_per_unit.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Lucro por unidade</div>
                  </div>
                  <div className="stat-card border border-[#0F3460]">
                    <div className={`text-3xl font-bold ${getMarginColor(result.net_margin)}`}>
                      {result.net_margin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Margem líquida</div>
                  </div>
                  <div className="stat-card border border-[#0F3460]">
                    <div className="text-3xl font-bold text-blue-400">
                      {result.gross_margin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Margem bruta</div>
                  </div>
                  <div className="stat-card border border-[#0F3460]">
                    <div className="text-3xl font-bold text-purple-400">
                      {result.roi.toFixed(0)}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">ROI</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-[#0F3460] rounded-lg flex items-center justify-between">
                  <span className="text-sm text-slate-400">Ponto de equilíbrio</span>
                  <span className="text-white font-bold">{result.break_even_units.toFixed(0)} unidades</span>
                </div>
              </div>

              {/* Breakdown de custos */}
              <div className="card">
                <h2 className="section-title">Breakdown de Custos</h2>
                <div className="space-y-2">
                  {[
                    { label: "Preço de venda", value: result.sale_price, color: "text-[#FFE600]" },
                    { label: "(-) Custo do produto", value: -result.cost_price, color: "text-red-400" },
                    { label: `(-) Comissão ML (${result.ml_commission_pct}%)`, value: -result.ml_commission, color: "text-red-400" },
                    { label: `(-) Impostos (${result.tax_pct}%)`, value: -result.tax, color: "text-red-400" },
                    ...(result.shipping_cost > 0 ? [{ label: "(-) Frete", value: -result.shipping_cost, color: "text-red-400" }] : []),
                    ...(result.packaging_cost > 0 ? [{ label: "(-) Embalagem", value: -result.packaging_cost, color: "text-red-400" }] : []),
                    ...(result.other_costs > 0 ? [{ label: "(-) Outros", value: -result.other_costs, color: "text-red-400" }] : []),
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-[#0F3460] last:border-0">
                      <span className="text-sm text-slate-400">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.color}`}>
                        R$ {Math.abs(row.value).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-[#3483FA]">
                    <span className="text-sm font-bold text-white">= Lucro líquido</span>
                    <span className={`text-lg font-bold ${profitColor}`}>
                      R$ {result.profit_per_unit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alerta */}
              {result.net_margin < 10 && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-300">
                  ⚠️ Margem líquida abaixo de 10% — risco alto ao investir em Ads. Revise custos ou aumente o preço.
                </div>
              )}
              {result.net_margin >= 20 && (
                <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg text-sm text-green-300">
                  ✅ Boa margem! Você tem espaço para investir em Ads com segurança.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Link href="/module4">
          <button className="btn-primary">Usar no Módulo 4 → Estratégia de Campanha</button>
        </Link>
      </div>
    </div>
  );
}
