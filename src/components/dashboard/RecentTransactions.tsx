import { useState } from "react";
import {
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Tag,
  Wallet,
  User,
  Paperclip,
  X,
  Eye
} from "lucide-react";
import Link from "next/link";

interface TransactionItem {
  id: string;
  title: string;
  type: "income" | "fixed_expense" | "variable_expense";
  amount: number;
  due_date: string;
  status: "paid" | "pending";
  attachment_url?: string | null;
  category?: { name: string; color: string; icon: string } | null;
  account?: { name: string } | null;
  user?: { name: string; email?: string } | null;
}

interface RecentTransactionsProps {
  transactions: TransactionItem[];
  onToggleStatus: (id: string, currentStatus: "paid" | "pending") => void;
}

export default function RecentTransactions({ transactions, onToggleStatus }: RecentTransactionsProps) {
  const [activeReceipt, setActiveReceipt] = useState<{ title: string; url: string; description?: string | null } | null>(null);

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
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold shrink-0">Receita</span>;
      case "fixed_expense":
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-semibold shrink-0">Despesa Fixa</span>;
      case "variable_expense":
        return <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-semibold shrink-0">Gasto Variável</span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass-card p-5 md:p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6 gap-2">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-400 shrink-0" /> Transações Recentes do Mês
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Últimos lançamentos registrados com suporte a auditoria de comprovantes</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1 shrink-0"
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
          {transactions.map((tx: any) => {
            const isIncome = tx.type === "income";
            const isPaid = tx.status === "paid";

            return (
              <div
                key={tx.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
              >
                {/* Left info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    tx.type === "fixed_expense" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                    "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h4 className="font-semibold text-slate-200 text-sm truncate" title={tx.title}>{tx.title}</h4>
                      {getTypeBadge(tx.type)}

                      {tx.attachment_url && (
                        <button
                          onClick={() => setActiveReceipt({ title: tx.title, url: tx.attachment_url!, description: tx.description })}
                          className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 hover:bg-amber-500/20 transition-all shrink-0"
                          title="Clique para abrir e auditar o comprovante/cupom anexado"
                        >
                          <Paperclip className="w-3 h-3 text-amber-400" />
                          Auditoria (Comprovante)
                        </button>
                      )}

                      {tx.user?.name && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 shrink-0">
                          <User className="w-3 h-3 text-indigo-400" />
                          {tx.user.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {tx.category && (
                        <span className="flex items-center gap-1 truncate">
                          <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tx.category.color }} />
                          <span className="truncate">{tx.category.name}</span>
                        </span>
                      )}
                      {tx.account && (
                        <span className="flex items-center gap-1 truncate">
                          <Wallet className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{tx.account.name}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 text-slate-400" /> Venc: {formatDate(tx.due_date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Amount & Status Toggle */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className={`font-bold text-base shrink-0 ${isIncome ? "text-emerald-400" : "text-slate-100"}`}>
                    {isIncome ? "+" : "-"}{formatMoney(Number(tx.amount))}
                  </span>

                  <button
                    onClick={() => onToggleStatus(tx.id, tx.status)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      isPaid
                        ? "bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80"
                        : "bg-amber-950/80 border border-amber-800/80 text-amber-300 hover:bg-amber-900/80"
                    }`}
                    title="Clique para alternar entre Pago e Pendente"
                  >
                    {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
                    <span>{isPaid ? "Pago" : "Pendente"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Image Audit Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-5 space-y-4 relative shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-amber-400" />
                Auditoria de Comprovante: {activeReceipt.title}
              </h3>
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeReceipt.description && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-amber-300/90 font-mono space-y-1">
                <p className="font-bold text-amber-400 flex items-center gap-1">
                  <span>📑 Dossiê de Auditoria PIX / Recibo</span>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{activeReceipt.description}</p>
              </div>
            )}

            <div className="bg-slate-950 rounded-xl p-2 max-h-[50vh] overflow-auto flex items-center justify-center border border-slate-800/80">
              <img
                src={activeReceipt.url}
                alt="Comprovante de Lançamento"
                className="max-w-full h-auto rounded-lg object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Vinculado via Finac Brosco Audit Engine</span>
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs"
              >
                Fechar Dossiê
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
