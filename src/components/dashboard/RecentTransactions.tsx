"use client";

import {
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Calendar,
  Tag,
  Wallet
} from "lucide-react";
import Link from "next/link";

interface TransactionItem {
  id: string;
  title: string;
  type: "income" | "fixed_expense" | "variable_expense";
  amount: number;
  due_date: string;
  status: "paid" | "pending";
  category?: { name: string; color: string; icon: string } | null;
  account?: { name: string } | null;
}

interface RecentTransactionsProps {
  transactions: TransactionItem[];
  onToggleStatus: (id: string, currentStatus: "paid" | "pending") => void;
}

export default function RecentTransactions({ transactions, onToggleStatus }: RecentTransactionsProps) {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "income":
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">Receita</span>;
      case "fixed_expense":
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-semibold">Despesa Fixa</span>;
      case "variable_expense":
        return <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-semibold">Gasto Variável</span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-400" /> Transações Recentes do Mês
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Últimos lançamentos registrados</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1"
        >
          Ver todas &rarr;
        </Link>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Nenhuma transação cadastrada neste mês.
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const isIncome = tx.type === "income";
            const isPaid = tx.status === "paid";

            return (
              <div
                key={tx.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left info */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    tx.type === "fixed_expense" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                    "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-200 text-sm">{tx.title}</h4>
                      {getTypeBadge(tx.type)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {tx.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.category.color }} />
                          {tx.category.name}
                        </span>
                      )}
                      {tx.account && (
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-slate-400" /> {tx.account.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> Venc: {formatDate(tx.due_date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Amount & Status Toggle */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className={`font-bold text-base ${isIncome ? "text-emerald-400" : "text-slate-100"}`}>
                    {isIncome ? "+" : "-"}{formatMoney(Number(tx.amount))}
                  </span>

                  <button
                    onClick={() => onToggleStatus(tx.id, tx.status)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isPaid
                        ? "bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80"
                        : "bg-amber-950/80 border border-amber-800/80 text-amber-300 hover:bg-amber-900/80"
                    }`}
                    title="Clique para alternar entre Pago e Pendente"
                  >
                    {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {isPaid ? "Pago" : "Pendente"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
