"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", icon: "🏠", label: "Dashboard" },
  { href: "/module1", icon: "🔍", label: "Análise de Mercado", sub: "Módulo 1" },
  { href: "/module2", icon: "📝", label: "Estrutura do Anúncio", sub: "Módulo 2" },
  { href: "/module3", icon: "💰", label: "Calculadora de Margem", sub: "Módulo 3" },
  { href: "/module4", icon: "🚀", label: "Estratégia de Campanha", sub: "Módulo 4" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#16213E] border-r border-[#0F3460] flex flex-col">
      <div className="p-6 border-b border-[#0F3460]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FFE600] rounded-lg flex items-center justify-center text-[#1A1A2E] font-bold text-sm">
            ML
          </div>
          <div>
            <div className="text-white font-bold text-sm">ML Intelligence</div>
            <div className="text-slate-500 text-xs">Plataforma de vendas</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all cursor-pointer ${
                  active
                    ? "bg-[#3483FA] text-white"
                    : "text-slate-400 hover:bg-[#0F3460] hover:text-white"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  {item.sub && (
                    <div className={`text-xs ${active ? "text-blue-200" : "text-slate-600"}`}>
                      {item.sub}
                    </div>
                  )}
                  <div className="text-sm font-medium">{item.label}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#0F3460]">
        <div className="text-xs text-slate-600 text-center">
          Powered by Google Gemini 2.0
        </div>
      </div>
    </aside>
  );
}
