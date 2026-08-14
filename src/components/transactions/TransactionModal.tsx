"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Tag, Wallet, Check, AlertCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
}

interface Account {
  id: string;
  name: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: "income" | "fixed_expense" | "variable_expense";
  initialData?: any;
  categories: Category[];
  accounts: Account[];
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = "variable_expense",
  initialData,
  categories,
  accounts,
}: TransactionModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"income" | "fixed_expense" | "variable_expense">(initialType);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"paid" | "pending">("pending");
  const [frequency, setFrequency] = useState<"monthly" | "annual" | "one_off">("one_off");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialType) setType(initialType);
    if (initialData) {
      setTitle(initialData.title || "");
      setType(initialData.type || initialType);
      setAmount(initialData.amount ? String(initialData.amount) : "");
      setDueDate(initialData.due_date || new Date().toISOString().split("T")[0]);
      setStatus(initialData.status || "pending");
      setFrequency(initialData.frequency || "one_off");
      setCategoryId(initialData.category_id || (initialData.category?.id) || "");
      setAccountId(initialData.account_id || (initialData.account?.id) || "");
      setDescription(initialData.description || "");
    } else {
      setTitle("");
      setAmount("");
      setDueDate(new Date().toISOString().split("T")[0]);
      setStatus(type === "income" || type === "variable_expense" ? "paid" : "pending");
      setFrequency(type === "fixed_expense" ? "monthly" : "one_off");
      setCategoryId(categories.length > 0 ? categories[0].id : "");
      setAccountId(accounts.length > 0 ? accounts[0].id : "");
      setDescription("");
    }
    setError("");
  }, [initialData, initialType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !dueDate) {
      setError("Preencha título, valor e data de vencimento.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        type,
        amount: parseFloat(amount),
        due_date: dueDate,
        status,
        frequency: type === "fixed_expense" ? frequency : "one_off",
        category_id: categoryId || null,
        account_id: accountId || null,
        description: description.trim() || null,
        is_recurring: type === "fixed_expense",
      };

      const url = initialData?.id ? `/api/transactions/${initialData.id}` : "/api/transactions";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar transação");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    type === "income" ? c.type === "income" : c.type === "expense"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-100">
          {initialData ? "Editar Lançamento" : "Novo Lançamento Financeiro"}
        </h2>
        <p className="text-xs text-slate-400 mt-1">Preencha os detalhes da operação</p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Switcher Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setType("income"); setStatus("paid"); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === "income"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => { setType("fixed_expense"); setStatus("pending"); setFrequency("monthly"); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === "fixed_expense"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Despesa Fixa
            </button>
            <button
              type="button"
              onClick={() => { setType("variable_expense"); setStatus("paid"); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === "variable_expense"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Gasto Variável
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Título / Descrição Curta</label>
            <input
              type="text"
              placeholder="ex: Salário Mensal, Supermercado, Aluguel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data de Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="">Sem Categoria</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Conta / Forma Pagto</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="">Nenhuma Selecionada</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Frequency (if fixed) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setStatus("paid")}
                  className={`py-1.5 rounded-lg font-medium transition-all ${
                    status === "paid" ? "bg-emerald-600 text-white" : "text-slate-400"
                  }`}
                >
                  Pago
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("pending")}
                  className={`py-1.5 rounded-lg font-medium transition-all ${
                    status === "pending" ? "bg-amber-600 text-white" : "text-slate-400"
                  }`}
                >
                  Pendente
                </button>
              </div>
            </div>

            {type === "fixed_expense" ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Frequência</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="monthly">Mensal</option>
                  <option value="annual">Anual</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observações (opcional)</label>
                <input
                  type="text"
                  placeholder="ex: Comprovante #123"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
            >
              {loading ? "Salvando..." : initialData ? "Atualizar Lançamento" : "Cadastrar Lançamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
