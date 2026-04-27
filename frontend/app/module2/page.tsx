"use client";
import { useState, useEffect } from "react";
import { api, store } from "@/lib/api";
import Link from "next/link";

type ListingResult = {
  title: string;
  description: string;
  specs: { key: string; value: string }[];
  keywords: string[];
  price_suggestion: number;
  price_justification: string;
  image_briefing: string;
};

type TargetCache = { target?: { name?: string; pictures?: string[]; buy_box?: { price?: number } } };

export default function Module2() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [marketData, setMarketData] = useState<unknown>(null);
  const [autoTarget, setAutoTarget] = useState<TargetCache["target"] | null>(null);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ListingResult | null>(null);
  const [activeTab, setActiveTab] = useState<"title" | "description" | "specs" | "keywords" | "image">("title");

  useEffect(() => {
    const market = store.load("market");
    if (market) setMarketData(market);
    const cached = store.load<TargetCache>("listing");
    if (cached?.target) {
      setAutoTarget(cached.target);
      setMode("auto");
    } else {
      setMode("manual");
    }
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body =
        mode === "auto" && autoTarget
          ? { market_data: { ...(marketData as object || {}), target: autoTarget } }
          : {
              product_info: { name, description, category: category || undefined },
              market_data: marketData || {},
            };

      const data = (await api.listing.generate(body)) as ListingResult;
      setResult(data);
      store.save("listing", { ...data, target: autoTarget });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const titleLength = result?.title?.length ?? 0;
  const titleColor = titleLength > 55 ? "text-red-400" : titleLength > 45 ? "text-yellow-400" : "text-green-400";

  const tabs = [
    { id: "title", label: "Título" },
    { id: "description", label: "Descrição" },
    { id: "specs", label: "Ficha Técnica" },
    { id: "keywords", label: "Keywords" },
    { id: "image", label: "Briefing de Imagem" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
          <Link href="/" className="hover:text-white">Dashboard</Link> / Módulo 2
        </div>
        <h1 className="text-3xl font-bold text-white">📝 Estrutura do Anúncio</h1>
        <p className="text-slate-400 mt-1">Gera o anúncio completo com copy persuasivo, otimizado para ML.</p>
      </div>

      {marketData ? (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg text-sm text-green-300 flex items-center gap-2">
          ✅ Dados do Módulo 1 carregados automaticamente
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg text-sm text-yellow-300 flex items-center gap-2">
          ⚠️ <Link href="/module1" className="underline">Execute o Módulo 1</Link> para melhores resultados (opcional)
        </div>
      )}

      <form onSubmit={handleGenerate}>
        {autoTarget && (
          <div className="card mb-6">
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setMode("auto")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "auto" ? "bg-[#3483FA] text-white" : "bg-[#0F3460] text-slate-400 hover:text-white"
                }`}>
                ⚡ Automático (do Módulo 1)
              </button>
              <button type="button" onClick={() => setMode("manual")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "manual" ? "bg-[#3483FA] text-white" : "bg-[#0F3460] text-slate-400 hover:text-white"
                }`}>
                ✏️ Manual
              </button>
            </div>
            {mode === "auto" && (
              <div className="flex gap-3 items-center bg-[#0F3460] rounded-lg p-3">
                {autoTarget.pictures?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={autoTarget.pictures[0].replace("http://", "https://")} alt={autoTarget.name}
                    className="w-16 h-16 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 mb-1">PRODUTO IDENTIFICADO</div>
                  <p className="text-sm text-white font-medium leading-tight">{autoTarget.name}</p>
                  {autoTarget.buy_box?.price && (
                    <p className="text-[#FFE600] font-bold text-sm mt-1">R$ {autoTarget.buy_box.price.toFixed(2)}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div className="card mb-6">
            <h2 className="section-title">Informações do Produto</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Nome do Produto *</label>
                <input className="input" placeholder="Ex: Fone de Ouvido Bluetooth 5.0 com Cancelamento de Ruído"
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Descrição básica / diferenciais *</label>
                <textarea className="input h-24 resize-none" placeholder="Descreva os principais atributos, diferenciais e público do produto..."
                  value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div>
                <label className="label">Categoria (opcional)</label>
                <input className="input" placeholder="Ex: Eletrônicos, Moda, Casa e Jardim..."
                  value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">{error}</div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="loader" /> Gerando anúncio com IA...</span>
            : mode === "auto" ? "✨ Gerar Anúncio Automaticamente" : "Gerar Anúncio Completo"}
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          {/* Preço sugerido */}
          <div className="card flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-1">PREÇO SUGERIDO</div>
              <div className="text-3xl font-bold text-[#FFE600]">
                R$ {result.price_suggestion.toFixed(2)}
              </div>
              <p className="text-sm text-slate-400 mt-1">{result.price_justification}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="flex gap-2 mb-6 flex-wrap">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id ? "bg-[#3483FA] text-white" : "bg-[#0F3460] text-slate-400 hover:text-white"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "title" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">TÍTULO OTIMIZADO</span>
                  <span className={`text-xs font-mono ${titleColor}`}>{titleLength}/60 caracteres</span>
                </div>
                <div className="bg-[#0F3460] rounded-lg p-4 text-white font-semibold text-lg">
                  {result.title}
                </div>
                <button onClick={() => navigator.clipboard.writeText(result.title)}
                  className="mt-2 text-xs text-slate-500 hover:text-white transition-colors">
                  📋 Copiar título
                </button>
              </div>
            )}

            {activeTab === "description" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">DESCRIÇÃO PERSUASIVA</span>
                  <button onClick={() => navigator.clipboard.writeText(result.description)}
                    className="text-xs text-slate-500 hover:text-white transition-colors">
                    📋 Copiar HTML
                  </button>
                </div>
                <div className="bg-[#0F3460] rounded-lg p-4 text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: result.description }} />
              </div>
            )}

            {activeTab === "specs" && (
              <div>
                <div className="text-xs text-slate-500 mb-3">FICHA TÉCNICA</div>
                <div className="space-y-2">
                  {result.specs.map((s, i) => (
                    <div key={i} className="flex items-center bg-[#0F3460] rounded-lg px-4 py-3">
                      <span className="text-slate-400 text-sm w-1/3">{s.key}</span>
                      <span className="text-white text-sm font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "keywords" && (
              <div>
                <div className="text-xs text-slate-500 mb-3">KEYWORDS RANQUEADAS POR RELEVÂNCIA</div>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((k, i) => (
                    <span key={i} className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                      i < 5 ? "bg-[#3483FA] text-white" : i < 10 ? "bg-[#0F3460] text-slate-200" : "bg-[#16213E] text-slate-500"
                    }`}>
                      <span className="text-xs opacity-60">#{i + 1}</span> {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "image" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500">BRIEFING PRONTO PARA GERAR IMAGEM</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(result.image_briefing)}
                    className="text-xs text-[#3483FA] hover:text-white transition-colors"
                  >
                    📋 Copiar briefing
                  </button>
                </div>
                <div className="bg-[#0F3460] rounded-lg p-4 text-slate-300 text-sm mb-4 italic">
                  &quot;{result.image_briefing}&quot;
                </div>
                <div className="bg-[#16213E] border border-[#0F3460] rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-3">
                    Copie o briefing acima e cole em uma destas ferramentas para gerar a imagem do produto:
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <a href="https://www.midjourney.com" target="_blank" rel="noopener noreferrer"
                      className="bg-[#0F3460] hover:bg-[#1a4a8a] rounded px-3 py-2 text-sm text-white text-center transition-colors">
                      🎨 Midjourney
                    </a>
                    <a href="https://leonardo.ai" target="_blank" rel="noopener noreferrer"
                      className="bg-[#0F3460] hover:bg-[#1a4a8a] rounded px-3 py-2 text-sm text-white text-center transition-colors">
                      🖼️ Leonardo AI
                    </a>
                    <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer"
                      className="bg-[#0F3460] hover:bg-[#1a4a8a] rounded px-3 py-2 text-sm text-white text-center transition-colors">
                      🤖 ChatGPT (DALL-E)
                    </a>
                    <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer"
                      className="bg-[#0F3460] hover:bg-[#1a4a8a] rounded px-3 py-2 text-sm text-white text-center transition-colors">
                      ✨ Google Gemini
                    </a>
                    <a href="https://playground.com" target="_blank" rel="noopener noreferrer"
                      className="bg-[#0F3460] hover:bg-[#1a4a8a] rounded px-3 py-2 text-sm text-white text-center transition-colors">
                      🎭 Playground
                    </a>
                    <a href="https://firefly.adobe.com" target="_blank" rel="noopener noreferrer"
                      className="bg-[#0F3460] hover:bg-[#1a4a8a] rounded px-3 py-2 text-sm text-white text-center transition-colors">
                      🔥 Adobe Firefly
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Link href="/module3">
              <button className="btn-primary">Usar no Módulo 3 → Calculadora de Margem</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
