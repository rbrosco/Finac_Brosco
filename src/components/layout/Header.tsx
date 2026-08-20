"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
  currentMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  onOpenTransactionModal: (type?: "income" | "fixed_expense" | "variable_expense") => void;
  onProcessRecurring?: () => void;
  onSeedDemoData?: () => void;
  user?: { name: string; email: string } | null;
}

export default function Header({
  currentMonth,
  onMonthChange,
  onOpenTransactionModal,
  user,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Format YYYY-MM to full month name in Portuguese (e.g. "Agosto de 2026")
  const [yearStr, monthStr] = currentMonth.split("-");
  const monthDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const handlePrevMonth = () => {
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 2, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, "0");
    onMonthChange(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, "0");
    onMonthChange(`${newY}-${newM}`);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-4 md:px-6 py-3.5 w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        {/* Left: Mobile Title / Sidebar Toggle / Month Navigator */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Drawer Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden text-slate-300 hover:text-white bg-slate-800/60 rounded-xl"
            title="Menu mobile"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Month Navigator */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner max-w-full">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 min-w-0 justify-center">
              <Calendar className="w-4 h-4 text-brand-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-100 capitalize truncate max-w-[150px] sm:max-w-none">
                {monthLabel}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Action Suite: Premium Quick Lançamento Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 border border-slate-800/90 rounded-2xl shadow-xl backdrop-blur-xl shrink-0">
            {/* Header Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-slate-400 border-r border-slate-800/80 shrink-0 mr-0.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
              <span>Novo</span>
            </div>

            {/* Receita Button */}
            <button
              onClick={() => onOpenTransactionModal("income")}
              className="group relative flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/30 hover:border-emerald-400/80 rounded-xl transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.12)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:translate-y-0"
              title="Nova Receita (Entrada)"
            >
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 group-hover:scale-110 transition-all">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300 group-hover:rotate-12 transition-transform" />
              </div>
              <span className="tracking-tight">+ Receita</span>
            </button>

            {/* Despesa Fixa Button */}
            <button
              onClick={() => onOpenTransactionModal("fixed_expense")}
              className="group relative flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-purple-300 bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-purple-500/5 hover:from-purple-500/25 hover:to-indigo-500/25 border border-purple-500/30 hover:border-purple-400/80 rounded-xl transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.12)] hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:-translate-y-0.5 active:translate-y-0"
              title="Nova Despesa Fixa (Recorrente)"
            >
              <div className="w-5 h-5 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 group-hover:scale-110 transition-all">
                <Repeat className="w-3.5 h-3.5 text-purple-300 group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <span className="tracking-tight">+ Fixa</span>
            </button>

            {/* Gasto Variável Button */}
            <button
              onClick={() => onOpenTransactionModal("variable_expense")}
              className="group relative flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-300 bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-rose-500/5 hover:from-rose-500/25 hover:to-pink-500/25 border border-rose-500/30 hover:border-rose-400/80 rounded-xl transition-all duration-300 shadow-[0_0_12px_rgba(244,63,94,0.12)] hover:shadow-[0_0_20px_rgba(244,63,94,0.35)] hover:-translate-y-0.5 active:translate-y-0"
              title="Novo Gasto Variável (Avulso)"
            >
              <div className="w-5 h-5 rounded-lg bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/30 group-hover:scale-110 transition-all">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-300 group-hover:-rotate-12 transition-transform" />
              </div>
              <span className="tracking-tight">+ Variável</span>
            </button>

            {/* Importar Extrato / Cupom Button */}
            <Link
              href="/agent?tab=receipt"
              className="group relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-amber-300 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 hover:border-amber-400/80 rounded-xl transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 active:translate-y-0"
              title="Importar Comprovante PIX, Nota Fiscal ou Extrato Bancário"
            >
              <div className="w-5 h-5 rounded-lg bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 group-hover:scale-110 transition-all">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span className="tracking-tight">📄 Importar Extrato / Cupom</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-slate-800 space-y-3">
          <Link
            href="/agent?tab=receipt"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" /> 📄 Importar Extrato / Cupom
          </Link>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { onOpenTransactionModal("income"); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Receita
            </button>
            <button
              onClick={() => { onOpenTransactionModal("fixed_expense"); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              <Repeat className="w-4 h-4 text-purple-400" /> Fixa
            </button>
            <button
              onClick={() => { onOpenTransactionModal("variable_expense"); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              <ArrowDownRight className="w-4 h-4 text-rose-400" /> Variável
            </button>
          </div>

          <nav className="space-y-1 pt-2 border-t border-slate-800">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/dashboard" ? "bg-brand-600 text-white" : "text-slate-300"}`}
            >
              Dashboard
            </Link>
            <Link
              href="/transactions"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/transactions" ? "bg-brand-600 text-white" : "text-slate-300"}`}
            >
              Transações
            </Link>
            <Link
              href="/caixinha"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/caixinha" ? "bg-brand-600 text-white" : "text-slate-300"}`}
            >
              Caixinha
            </Link>
            <Link
              href="/agent"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/agent" ? "bg-brand-600 text-white" : "text-slate-300"}`}
            >
              Agente IA
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/categories" ? "bg-brand-600 text-white" : "text-slate-300"}`}
            >
              Categorias
            </Link>
            <Link
              href="/accounts"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/accounts" ? "bg-brand-600 text-white" : "text-slate-300"}`}
            >
              Contas & Cartões
            </Link>
            <Link
              href="/reports"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/reports" ? "bg-brand-600 text-white" : "text-slate-300"}`}
            >
              Relatórios
            </Link>
            <Link
              href="/family"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/family" ? "bg-brand-600 text-white" : "text-slate-300"}`}
            >
              Controle Familiar
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/settings" ? "bg-brand-600 text-white" : "text-slate-300"}`}
            >
              Configurações
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-rose-400 font-medium flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
