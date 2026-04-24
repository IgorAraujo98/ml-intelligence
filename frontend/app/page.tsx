"use client";
import Link from "next/link";

const modules = [
  {
    id: 1,
    href: "/module1",
    icon: "🔍",
    title: "Análise de Mercado",
    description:
      "Coleta inteligência de mercado: preço médio, concorrência, keywords, público-alvo, logística e canal ideal (orgânico ou Ads).",
    color: "from-blue-600 to-blue-800",
    badge: "Passo 1",
  },
  {
    id: 2,
    href: "/module2",
    icon: "📝",
    title: "Estrutura do Anúncio",
    description:
      "Gera título otimizado, descrição persuasiva, ficha técnica no padrão ML, keywords ranqueadas, preço sugerido e imagens via IA.",
    color: "from-yellow-500 to-yellow-700",
    badge: "Passo 2",
  },
  {
    id: 3,
    href: "/module3",
    icon: "💰",
    title: "Calculadora de Margem",
    description:
      "Calculadora interativa com margem líquida em tempo real, lucro por unidade, ponto de equilíbrio e ROI.",
    color: "from-green-600 to-green-800",
    badge: "Passo 3",
  },
  {
    id: 4,
    href: "/module4",
    icon: "🚀",
    title: "Estratégia de Campanha",
    description:
      "Recomendação fundamentada sobre Ads com plano de escalonamento por fases, orçamento sugerido e KPIs.",
    color: "from-purple-600 to-purple-800",
    badge: "Passo 4",
  },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">
          ML Intelligence
        </h1>
        <p className="text-slate-400 text-lg">
          Plataforma completa para vender mais no Mercado Livre — da análise de mercado à estratégia de campanha.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => (
          <Link key={mod.id} href={mod.href}>
            <div className="card hover:border-[#3483FA] transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className={`text-4xl`}>{mod.icon}</div>
                <span className="badge-blue">{mod.badge}</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#FFE600] transition-colors">
                {mod.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">{mod.description}</p>
              <div className="mt-4 flex items-center text-[#3483FA] text-sm font-medium">
                Acessar módulo →
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 card">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">FLUXO RECOMENDADO</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {modules.map((mod, i) => (
            <div key={mod.id} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{mod.icon}</span>
                <span className="text-sm text-white font-medium">{mod.title}</span>
              </div>
              {i < modules.length - 1 && (
                <span className="text-slate-600">→</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Os dados de cada módulo alimentam automaticamente os próximos. Comece pelo Módulo 1.
        </p>
      </div>
    </div>
  );
}
