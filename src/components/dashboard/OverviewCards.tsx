"use client";

import { TrendingUp, ArrowDownRight, ArrowUpRight, Scale, AlertCircle, CheckCircle2 } from "lucide-react";

interface OverviewCardsProps {
  stats: {
    totalIncome: number;
    totalFixedExpenses: number;
    totalVariableExpenses: number;
    totalExpenses: number;
    netBalance: number;
    paidExpenses: number;
    pendingExpenses: number;
  };
}

export default function OverviewCards({ stats }: OverviewCardsProps) {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  const fixedPercentage = stats.totalExpenses > 0 ? Math.round((stats.totalFixedExpenses / stats.totalExpenses) * 100) : 0;
  const variablePercentage = stats.totalExpenses > 0 ? Math.round((stats.totalVariableExpenses / stats.totalExpenses) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* 1. Receitas Card */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Receitas Totais</span>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-400 tracking-tight">
            {formatMoney(stats.totalIncome)}
          </h3>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total registrado no mês
          </p>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Despesas Fixas Card */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Despesas Fixas</span>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-purple-400 tracking-tight">
            {formatMoney(stats.totalFixedExpenses)}
          </h3>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{fixedPercentage}% dos gastos totais</span>
            <span className="text-purple-300 font-medium">Recorrentes</span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. Gastos Variáveis Card */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gastos Variáveis</span>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-rose-400 tracking-tight">
            {formatMoney(stats.totalVariableExpenses)}
          </h3>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{variablePercentage}% dos gastos totais</span>
            <span className="text-rose-300 font-medium">Avulsos</span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4. Balanço / Saldo Restante Card */}
      <div className={`glass-card p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] border ${
        stats.netBalance >= 0 ? "border-indigo-500/30" : "border-rose-500/40"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Balanço / Saldo Líquido</span>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            stats.netBalance >= 0 ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
          }`}>
            <Scale className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${
            stats.netBalance >= 0 ? "text-indigo-400" : "text-rose-400"
          }`}>
            {formatMoney(stats.netBalance)}
          </h3>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Pago: {formatMoney(stats.paidExpenses)}
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Pendente: {formatMoney(stats.pendingExpenses)}
            </span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>
    </div>
  );
}
