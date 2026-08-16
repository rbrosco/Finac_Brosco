"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  RefreshCw,
  Calendar,
  Menu,
  X,
  TrendingUp,
  Receipt,
  LogOut
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
  onProcessRecurring,
  onSeedDemoData,
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
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Title / Month Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden text-slate-300 hover:text-white bg-slate-800/60 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Month Navigator */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 min-w-[140px] justify-center">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-semibold text-slate-100 capitalize">
                {monthLabel}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {onSeedDemoData && (
            <button
              onClick={onSeedDemoData}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-purple-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 rounded-xl transition-all shadow-sm"
              title="Preencher com lançamentos de exemplo para testar os gráficos"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              Gerar Dados Demo
            </button>
          )}

          {onProcessRecurring && (
            <button
              onClick={onProcessRecurring}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 rounded-xl transition-all shadow-sm"
              title="Gerar despesas fixas recorrentes pendentes no mês atual"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              Processar Mês
            </button>
          )}

          {/* New Transaction Action Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 border border-slate-800/80 rounded-xl shadow-inner">
            <button
              onClick={() => onOpenTransactionModal("income")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all shadow-sm"
              title="Nova Receita"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Receita</span>
            </button>
            <button
              onClick={() => onOpenTransactionModal("fixed_expense")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all shadow-sm"
              title="Nova Despesa Fixa"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Fixa</span>
            </button>
            <button
              onClick={() => onOpenTransactionModal("variable_expense")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all shadow-sm"
              title="Novo Gasto Variável"
            >
              <Plus className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Variável</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { onOpenTransactionModal("income"); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Receita
            </button>
            <button
              onClick={() => { onOpenTransactionModal("fixed_expense"); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-semibold hover:bg-purple-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Fixa
            </button>
            <button
              onClick={() => { onOpenTransactionModal("variable_expense"); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold hover:bg-rose-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Variável
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            {onProcessRecurring && (
              <button
                onClick={() => { onProcessRecurring(); setMobileMenuOpen(false); }}
                className="w-full py-2 bg-indigo-950/80 border border-indigo-800 text-indigo-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Processar Vencimentos
              </button>
            )}
            {onSeedDemoData && (
              <button
                onClick={() => { onSeedDemoData(); setMobileMenuOpen(false); }}
                className="w-full py-2 bg-purple-950/80 border border-purple-800 text-purple-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Gerar Dados Demo
              </button>
            )}
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
