"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Calculator,
  Bot,
  Users,
  Menu,
  HelpCircle,
  X,
  Tags,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  PiggyBank
} from "lucide-react";
import { useState } from "react";
import { useTutorial } from "@/context/TutorialContext";
import { useRouter } from "next/navigation";

interface BottomNavProps {
  user?: { name: string; email: string } | null;
}

export default function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { openTutorial } = useTutorial();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const mainTabs = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Transações", href: "/transactions", icon: Receipt },
    { label: "Divisão", href: "/split-calculator", icon: Calculator },
    { label: "Agente IA", href: "/agent", icon: Bot },
  ];

  const moreNavItems = [
    { label: "Caixinha", href: "/caixinha", icon: PiggyBank },
    { label: "Categorias", href: "/categories", icon: Tags },
    { label: "Contas & Cartões", href: "/accounts", icon: Wallet },
    { label: "Relatórios", href: "/reports", icon: BarChart3 },
    { label: "Controle Familiar", href: "/family", icon: Users },
    { label: "Configurações", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Fixed for Smartphones < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMoreMenuOpen(false)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive
                    ? "text-brand-400 font-extrabold scale-105"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-brand-400" : "text-slate-400"}`} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </Link>
            );
          })}

          {/* More Menu Trigger */}
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              moreMenuOpen || moreNavItems.some(i => i.href === pathname)
                ? "text-brand-400 font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* Mobile "Mais" Slide-up Drawer */}
      {moreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setMoreMenuOpen(false)}
          />

          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl z-10">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2 opacity-60" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center font-bold text-white text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{user?.name || "Usuário"}</p>
                  <p className="text-xs text-slate-400">{user?.email || ""}</p>
                </div>
              </div>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-brand-600/20 border-brand-500/50 text-white font-bold"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-400" : "text-slate-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={() => { setMoreMenuOpen(false); openTutorial(); }}
                className="w-full p-3 bg-brand-950/80 border border-brand-800/80 text-brand-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-brand-400 animate-pulse" />
                <span>(?) Abrir Tutorial & Guia Plataforma</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
