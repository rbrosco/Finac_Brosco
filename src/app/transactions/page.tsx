"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TransactionModal from "@/components/transactions/TransactionModal";
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
  User
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

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
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

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onOpenTransactionModal={openNewModal}
          onProcessRecurring={handleProcessRecurring}
          user={user}
        />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
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

            <div className="flex items-center gap-2">
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
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
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
                            <div className="font-semibold text-slate-100">{tx.title}</div>
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
                                onClick={() => handleDelete(tx.id)}
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
    </div>
  );
}
