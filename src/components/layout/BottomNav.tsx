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
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { useTutorial } from "@/context/TutorialContext";
import { useRouter } from "next/navigation";

interface BottomNavProps {
  user?: { name: string; email: string } | null;
  onOpenTransactionModal?: (type?: "income" | "fixed_expense" | "variable_expense") => void;
}

export default function BottomNav({ user, onOpenTransactionModal }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { openTutorial } = useTutorial();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const mainTabsLeft = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Transações", href: "/transactions", icon: Receipt },
  ];

  const mainTabsRight = [
    { label: "Agente IA", href: "/agent", icon: Bot },
  ];

  const moreNavItems = [
    { label: "Caixinha", href: "/caixinha", icon: PiggyBank },
    { label: "Divisão Contas", href: "/split-calculator", icon: Calculator },
    { label: "Categorias", href: "/categories", icon: Tags },
    { label: "Contas & Cartões", href: "/accounts", icon: Wallet },
    { label: "Relatórios", href: "/reports", icon: BarChart3 },
    { label: "Controle Familiar", href: "/family", icon: Users },
    { label: "Configurações", href: "/settings", icon: Settings },
  ];

  const triggerModal = (type: "income" | "fixed_expense" | "variable_expense") => {
    setQuickAddOpen(false);
    if (onOpenTransactionModal) {
      onOpenTransactionModal(type);
    } else {
      router.push(`/transactions?action=new&type=${type}`);
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Fixed for Smartphones < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around relative">
          {/* Left Tabs */}
          {mainTabsLeft.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => { setMoreMenuOpen(false); setQuickAddOpen(false); }}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
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

          {/* Center Floating Action Button (+ Novo Lançamento) */}
          <div className="relative -top-3">
            <button
              onClick={() => { setQuickAddOpen(!quickAddOpen); setMoreMenuOpen(false); }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              title="Novo Lançamento Rápido"
            >
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <Plus className={`w-6 h-6 text-emerald-400 transition-transform duration-300 ${quickAddOpen ? "rotate-45 text-rose-400" : ""}`} />
              </div>
            </button>
          </div>

          {/* Right Tabs */}
          {mainTabsRight.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => { setMoreMenuOpen(false); setQuickAddOpen(false); }}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
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
            onClick={() => { setMoreMenuOpen(!moreMenuOpen); setQuickAddOpen(false); }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
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

      {/* Quick Add Speed-Dial Drawer */}
      {quickAddOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setQuickAddOpen(false)} />
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl z-10 animate-in slide-in-from-bottom-5 duration-200">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-1 opacity-60" />
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
                Novo Lançamento Rápido
              </h3>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => triggerModal("income")}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm text-emerald-300">+ Nova Receita</p>
                  <p className="text-[11px] text-emerald-400/80 font-normal">Entrada de salário, pix, vendas, etc.</p>
                </div>
              </button>

              <button
                onClick={() => triggerModal("fixed_expense")}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/25 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Repeat className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm text-purple-300">+ Nova Despesa Fixa</p>
                  <p className="text-[11px] text-purple-400/80 font-normal">Contas recorrentes (aluguel, internet, etc.)</p>
                </div>
              </button>

              <button
                onClick={() => triggerModal("variable_expense")}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/15 to-pink-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/25 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                  <ArrowDownRight className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm text-rose-300">+ Novo Gasto Variável</p>
                  <p className="text-[11px] text-rose-400/80 font-normal">Gastos avulsos do dia a dia (mercado, lazer)</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

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
