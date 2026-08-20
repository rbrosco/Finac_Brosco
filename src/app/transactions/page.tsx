"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import TransactionModal from "@/components/transactions/TransactionModal";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  Wallet,
  Loader2,
  RefreshCw,
  User,
  Paperclip,
  X,
  FileSpreadsheet
} from "lucide-react";

export default function TransactionsPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "fixed_expense" | "variable_expense">("variable_expense");
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null);
  const [activeReceipt, setActiveReceipt] = useState<{ title: string; url: string; description?: string | null } | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const loadAuxData = useCallback(async () => {
    try {
      const [catRes, accRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/accounts")
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadTransactions = useCallback(async (monthStr: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/transactions?month=${monthStr}`);
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadAuxData();
  }, [loadUserData, loadAuxData]);

  useEffect(() => {
    if (user) loadTransactions(currentMonth);
  }, [user, currentMonth, loadTransactions]);

  const handleToggleStatus = async (id: string, currentStatus: "paid" | "pending") => {
    const newStatus = currentStatus === "paid" ? "pending" : "paid";
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) loadTransactions(currentMonth);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      const res = await fetch(`/api/transactions/${deletingTransaction.id}`, { method: "DELETE" });
      if (res.ok) loadTransactions(currentMonth);
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = (type?: "income" | "fixed_expense" | "variable_expense") => {
    setEditingTransaction(null);
    if (type) setModalType(type);
    setIsModalOpen(true);
  };

  const openEditModal = (tx: any) => {
    setEditingTransaction(tx);
    setModalType(tx.type);
    setIsModalOpen(true);
  };

  const handleProcessRecurring = async () => {
    try {
      const res = await fetch("/api/transactions/process-recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth }),
      });
      const data = await res.json();
      alert(data.message || "Vencimentos recorrentes processados!");
      loadTransactions(currentMonth);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered List
  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchCat = tx.category?.name.toLowerCase().includes(q);
      const matchAcc = tx.account?.name.toLowerCase().includes(q);
      return matchTitle || matchCat || matchAcc;
    }
    return true;
  });

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const confirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      await fetch(`/api/transactions/${deletingTransaction.id}`, { method: "DELETE" });
      loadTransactions(currentMonth);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingTransaction(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        <Header
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onOpenTransactionModal={openNewModal}
          onProcessRecurring={handleProcessRecurring}
          user={user}
        />

        <main className="flex-1 p-4 md:p-6 space-y-6 w-full pb-28 md:pb-8">
          {/* Header Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Receipt className="w-7 h-7 text-brand-500" /> Gestão de Transações
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Controle detalhado de receitas, despesas fixas recorrentes e gastos variáveis
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Link
                href="/agent?tab=receipt"
                className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/20"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" /> 📄 Importar Extrato / Cupom
              </Link>

              <button
                onClick={handleProcessRecurring}
                className="px-3.5 py-2.5 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-800 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-indigo-400" /> Processar Recorrências
              </button>

              <button
                onClick={() => openNewModal("variable_expense")}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
              >
                <Plus className="w-4 h-4" /> Novo Lançamento
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Type Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto w-full md:w-auto">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  typeFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setTypeFilter("income")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  typeFilter === "income" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Receitas
              </button>
              <button
                onClick={() => setTypeFilter("fixed_expense")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  typeFilter === "fixed_expense" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Despesas Fixas
              </button>
              <button
                onClick={() => setTypeFilter("variable_expense")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  typeFilter === "variable_expense" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Gastos Variáveis
              </button>
            </div>

            {/* Search & Status Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar lançamento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="all">Todos os Status</option>
                <option value="paid">Pagos</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Carregando lançamentos...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center text-slate-400">
              Nenhum lançamento encontrado para os filtros selecionados.
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= 768px) */}
              <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Título</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Membro</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Tipo</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Categoria</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Conta</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Vencimento</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Valor</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                        <th className="py-3.5 px-4 text-right whitespace-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredTransactions.map((tx) => {
                        const isIncome = tx.type === "income";
                        const isPaid = tx.status === "paid";

                        return (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-100 text-sm">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-100">{tx.title}</span>
                                {tx.attachment_url && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveReceipt({ title: tx.title, url: tx.attachment_url, description: tx.description })}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 hover:bg-amber-500/20 transition-all shrink-0"
                                    title="Clique para abrir e auditar o comprovante/cupom anexado"
                                  >
                                    <Paperclip className="w-3 h-3 text-amber-400" />
                                    Comprovante
                                  </button>
                                )}
                              </div>
                              {tx.description && (
                                <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">{tx.description}</p>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {tx.user?.name ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  {tx.user.name}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {tx.type === "income" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold whitespace-nowrap">
                                  <ArrowUpRight className="w-3.5 h-3.5" /> Receita
                                </span>
                              )}
                              {tx.type === "fixed_expense" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold whitespace-nowrap">
                                  <ArrowDownRight className="w-3.5 h-3.5" /> Despesa Fixa
                                </span>
                              )}
                              {tx.type === "variable_expense" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold whitespace-nowrap">
                                  <ArrowDownRight className="w-3.5 h-3.5" /> Gasto Variável
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                              {tx.category ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tx.category.color }} />
                                  <span className="font-medium">{tx.category.name}</span>
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap font-medium">
                              {tx.account?.name ? (
                                <span className="flex items-center gap-1.5">
                                  <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {tx.account.name}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {formatDate(tx.due_date)}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`font-bold text-sm ${isIncome ? "text-emerald-400" : "text-slate-100"}`}>
                                {isIncome ? "+" : "-"}{formatMoney(Number(tx.amount))}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleStatus(tx.id, tx.status)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                                  isPaid
                                    ? "bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80"
                                    : "bg-amber-950/80 border border-amber-800/80 text-amber-300 hover:bg-amber-900/80"
                                }`}
                              >
                                {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                <span>{isPaid ? "Pago" : "Pendente"}</span>
                              </button>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditModal(tx)}
                                  className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingTransaction(tx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Touch Cards View (< 768px) */}
              <div className="block md:hidden space-y-3">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === "income";
                  const isPaid = tx.status === "paid";

                  return (
                    <div key={tx.id} className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-sm text-white block">{tx.title}</span>
                          {tx.user?.name && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300">
                              <User className="w-3 h-3 text-indigo-400" /> {tx.user.name}
                            </span>
                          )}
                        </div>

                        <span className={`text-base font-extrabold shrink-0 ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
                          {isIncome ? "+" : "-"}{formatMoney(Number(tx.amount))}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 text-slate-400">
                        <span className="flex items-center gap-1.5">
                          {tx.category?.color && (
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tx.category.color }} />
                          )}
                          {tx.category?.name || "Sem categoria"}
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(tx.due_date)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <button
                          onClick={() => handleToggleStatus(tx.id, tx.status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {isPaid ? "Pago" : "Pendente"}
                        </button>

                        <div className="flex items-center gap-2">
                          {tx.attachment_url && (
                            <button
                              type="button"
                              onClick={() => setActiveReceipt({ title: tx.title, url: tx.attachment_url, description: tx.description })}
                              className="p-2 text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl"
                              title="Comprovante"
                            >
                              <Paperclip className="w-4 h-4 text-amber-400" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(tx)}
                            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 rounded-xl border border-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTransaction(tx)}
                            className="p-2 text-slate-300 hover:text-rose-400 bg-slate-800/80 rounded-xl border border-slate-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadTransactions(currentMonth)}
        initialType={modalType}
        initialData={editingTransaction}
        categories={categories}
        accounts={accounts}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={confirmDelete}
        itemName={deletingTransaction?.title}
      />

      <BottomNav user={user} onOpenTransactionModal={openNewModal} />

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

      {/* Modern Confirm Delete Modal Popup */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingTransaction)}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Lançamento"
        description="Tem certeza que deseja excluir este lançamento financeiro? O valor será removido das suas métricas."
        itemName={deletingTransaction?.title}
        itemDetails={
          deletingTransaction
            ? `Valor: ${formatMoney(Number(deletingTransaction.amount))} | Vencimento: ${formatDate(deletingTransaction.due_date)}`
            : undefined
        }
      />
    </div>
  );
}
