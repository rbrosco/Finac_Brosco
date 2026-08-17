"use client";

import { useState } from "react";
import { CheckCircle2, X, Loader2, ArrowUpRight, ArrowDownRight, Wallet, User, Tag, ShieldCheck } from "lucide-react";

export interface StatementImportItem {
  id: string;
  title: string;
  amount: number;
  type: "income" | "fixed_expense" | "variable_expense";
  due_date: string;
  category_id?: string | null;
  account_id?: string | null;
  user_id?: string | null;
  selected: boolean;
  already_exists?: boolean;
}

interface ConfirmStatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  items: StatementImportItem[];
  accountName?: string;
  categories: any[];
  familyMembers: any[];
  isSaving: boolean;
}

export default function ConfirmStatementImportModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  accountName,
  categories,
  familyMembers,
  isSaving
}: ConfirmStatementImportModalProps) {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(true);

  if (!isOpen) return null;

  const selectedItems = items.filter(i => i.selected);

  const totalIncome = selectedItems
    .filter(i => i.type === "income")
    .reduce((acc, i) => acc + Number(i.amount), 0);

  const totalExpense = selectedItems
    .filter(i => i.type !== "income")
    .reduce((acc, i) => acc + Number(i.amount), 0);

  const getCategoryName = (catId?: string | null) => {
    if (!catId) return "Geral";
    const found = categories.find(c => c.id === catId);
    return found ? found.name : "Geral";
  };

  const getUserName = (userId?: string | null) => {
    if (!userId) return "Titular";
    const found = familyMembers.find(m => m.id === userId);
    return found ? found.name : "Titular";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-card w-full max-w-3xl rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                📑 Aceitar & Confirmar Importação do Extrato
              </h3>
              <p className="text-xs text-slate-400">
                Revise o resumo das movimentações antes da gravação no banco de dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Overview Stats */}
        <div className="p-5 bg-slate-950/50 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
              {selectedItems.length}
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Lançamentos</span>
              <span className="text-xs font-bold text-white">Prontos para Inserção</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-emerald-300 block font-medium">Total Receitas</span>
              <span className="text-xs font-bold text-emerald-400">+R$ {totalIncome.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-rose-300 block font-medium">Total Gastos</span>
              <span className="text-xs font-bold text-rose-400">-R$ {totalExpense.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Items List Preview */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1 max-h-[350px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-400" />
              Conta Destino: <strong className="text-white">{accountName || "Todas as Contas"}</strong>
            </span>
            <span className="text-[11px] text-slate-400">
              Mostrando os {selectedItems.length} selecionados
            </span>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2.5">Título</th>
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">Valor</th>
                  <th className="p-2.5">Categoria</th>
                  <th className="p-2.5">Membro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {selectedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-semibold text-slate-200">
                      {item.title}
                      {item.already_exists && (
                        <span className="ml-2 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                          Duplicado no banco
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-400 font-mono">{item.due_date}</td>
                    <td className={`p-2.5 font-bold ${item.type === "income" ? "text-emerald-400" : "text-slate-100"}`}>
                      {item.type === "income" ? "+" : "-"}R$ {Number(item.amount).toFixed(2)}
                    </td>
                    <td className="p-2.5 text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="w-3 h-3 text-purple-400" />
                        {getCategoryName(item.category_id)}
                      </span>
                    </td>
                    <td className="p-2.5 text-indigo-300 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-400" />
                        {getUserName(item.user_id)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms of Acceptance & Actions Footer */}
        <div className="p-5 bg-slate-900/90 border-t border-slate-800 space-y-4">
          <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-purple-500/50 transition-all">
            <input
              type="checkbox"
              checked={hasAcceptedTerms}
              onChange={(e) => setHasAcceptedTerms(e.target.checked)}
              className="w-4 h-4 accent-purple-500 rounded cursor-pointer shrink-0"
            />
            <span className="text-xs text-slate-300 leading-tight">
              Confirmo a veracidade dos dados do extrato e autorizo o lançamento direto dos <strong className="text-white">{selectedItems.length} itens</strong> no meu controle financeiro.
            </span>
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={!hasAcceptedTerms || isSaving || selectedItems.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirmar & Inserir Lançamentos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
