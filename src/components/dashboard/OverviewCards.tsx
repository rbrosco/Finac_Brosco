"use client";

import { TrendingUp, ArrowDownRight, ArrowUpRight, Scale, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface OverviewCardsProps {
  stats: {
    totalIncome: number;
    receivedIncome?: number;
    pendingIncome?: number;
    totalFixedExpenses: number;
    paidFixedExpenses?: number;
    pendingFixedExpenses?: number;
    totalVariableExpenses: number;
    paidVariableExpenses?: number;
    pendingVariableExpenses?: number;
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

  const pendingInc = stats.pendingIncome !== undefined ? stats.pendingIncome : 0;
  const receivedInc = stats.receivedIncome !== undefined ? stats.receivedIncome : Math.max(0, stats.totalIncome - pendingInc);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {/* 1. Receitas Card */}
      <div className="glass-card p-4 sm:p-5 md:p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Receitas Totais</span>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight truncate" title={formatMoney(stats.totalIncome)}>
            {formatMoney(stats.totalIncome)}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-x-2 gap-y-1 text-[11px] sm:text-xs font-medium">
            <span className="text-emerald-400 flex items-center gap-1 truncate" title={`Recebido: ${formatMoney(receivedInc)}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Rec: {formatMoney(receivedInc)}
            </span>
            <span className="text-amber-400 flex items-center gap-1 truncate" title={`Pendente: ${formatMoney(pendingInc)}`}>
              <Clock className="w-3.5 h-3.5 shrink-0" /> Pend: {formatMoney(pendingInc)}
            </span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Despesas Fixas Card */}
      <div className="glass-card p-4 sm:p-5 md:p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Despesas Fixas</span>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-purple-400 tracking-tight truncate" title={formatMoney(stats.totalFixedExpenses)}>
            {formatMoney(stats.totalFixedExpenses)}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-400">
            <span className="truncate">{fixedPercentage}% dos gastos</span>
            <span className="text-purple-300 font-medium shrink-0">Recorrentes</span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. Gastos Variáveis Card */}
      <div className="glass-card p-4 sm:p-5 md:p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Gastos Variáveis</span>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-rose-400 tracking-tight truncate" title={formatMoney(stats.totalVariableExpenses)}>
            {formatMoney(stats.totalVariableExpenses)}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-400">
            <span className="truncate">{variablePercentage}% dos gastos</span>
            <span className="text-rose-300 font-medium shrink-0">Avulsos</span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4. Balanço / Saldo Restante Card */}
      <div className={`glass-card p-4 sm:p-5 md:p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] border ${
        stats.netBalance >= 0 ? "border-indigo-500/30" : "border-rose-500/40"
      }`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Saldo Líquido</span>
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
            stats.netBalance >= 0 ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
          }`}>
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4">
          <h3 className={`text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate ${
            stats.netBalance >= 0 ? "text-indigo-400" : "text-rose-400"
          }`} title={formatMoney(stats.netBalance)}>
            {formatMoney(stats.netBalance)}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-x-2 gap-y-1 text-[11px] sm:text-xs font-medium">
            <span className="text-emerald-400 flex items-center gap-1 truncate" title={`Pago: ${formatMoney(stats.paidExpenses)}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Pago: {formatMoney(stats.paidExpenses)}
            </span>
            <span className="text-amber-400 flex items-center gap-1 truncate" title={`Pendente: ${formatMoney(stats.pendingExpenses)}`}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Pend: {formatMoney(stats.pendingExpenses)}
            </span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>
    </div>
  );
}
