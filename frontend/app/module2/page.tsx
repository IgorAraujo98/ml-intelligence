"use client";
import { useState, useEffect } from "react";
import { api, store } from "@/lib/api";
import Image from "next/image";
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

export default function Module2() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [marketData, setMarketData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ListingResult | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"title" | "description" | "specs" | "keywords" | "image">("title");

  useEffect(() => {
    const saved = store.load("market");
    if (saved) setMarketData(saved);
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = (await api.listing.generate({
        product_info: { name, description, category: category || undefined },
        market_data: marketData || {},
      })) as ListingResult;
      setResult(data);
      store.save("listing", data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateImage() {
    if (!result?.image_briefing) return;
    setLoadingImage(true);
    try {
      const { image_url } = await api.listing.generateImage(result.image_briefing);
      setImageUrl(image_url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao gerar imagem");
    } finally {
      setLoadingImage(false);
    }
  }

  const titleLength = result?.title?.length ?? 0;
  const titleColor = titleLength > 55 ? "text-red-400" : titleLength > 45 ? "text-yellow-400" : "text-green-400";

  const tabs = [
    { id: "title", label: "Título" },
    { id: "description", label: "Descrição" },
    { id: "specs", label: "Ficha Técnica" },
    { id: "keywords", label: "Keywords" },
    { id: "image", label: "Imagens" },
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

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">{error}</div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <span className="flex items-center justify-center gap-2"><span className="loader" /> Gerando anúncio com IA...</span> : "Gerar Anúncio Completo"}
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
                <div className="text-xs text-slate-500 mb-3">BRIEFING DA IMAGEM</div>
                <div className="bg-[#0F3460] rounded-lg p-4 text-slate-300 text-sm mb-4 italic">
                  &quot;{result.image_briefing}&quot;
                </div>
                <button onClick={handleGenerateImage} className="btn-secondary" disabled={loadingImage}>
                  {loadingImage
                    ? <span className="flex items-center gap-2"><span className="loader" /> Gerando com DALL-E 3...</span>
                    : "🎨 Gerar Imagem com DALL-E 3"}
                </button>
                {imageUrl && (
                  <div className="mt-4">
                    <Image src={imageUrl} alt="Produto gerado" width={512} height={512}
                      className="rounded-lg border border-[#0F3460]" />
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 block text-xs text-slate-500 hover:text-white transition-colors">
                      🔗 Abrir imagem original
                    </a>
                  </div>
                )}
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
