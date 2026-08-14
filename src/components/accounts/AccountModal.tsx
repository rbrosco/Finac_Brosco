"use client";

import { useState, useEffect } from "react";
import { X, Wallet, AlertCircle } from "lucide-react";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta Corrente" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "cash", label: "Dinheiro / Carteira" },
  { value: "savings", label: "Poupança / Reserva" },
  { value: "investment", label: "Investimentos" },
];

export default function AccountModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AccountModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [initialBalance, setInitialBalance] = useState("0");
  const [color, setColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setType(initialData.type || "checking");
      setInitialBalance(initialData.initial_balance ? String(initialData.initial_balance) : "0");
      setColor(initialData.color || "#3b82f6");
    } else {
      setName("");
      setType("checking");
      setInitialBalance("0");
      setColor("#3b82f6");
    }
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome da conta é obrigatório.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        type,
        initial_balance: parseFloat(initialBalance || "0"),
        color,
        icon: "Wallet",
      };

      const url = initialData?.id ? `/api/accounts/${initialData.id}` : "/api/accounts";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar conta");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700/80 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-100">
          {initialData ? "Editar Conta" : "Nova Conta / Forma de Pagamento"}
        </h2>
        <p className="text-xs text-slate-400 mt-1">Gerencie suas contas bancárias e cartões</p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome da Conta / Cartão</label>
            <input
              type="text"
              placeholder="ex: Conta Itaú, Cartão Nubank, Dinheiro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Conta</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Saldo Inicial (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

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
              className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-lg shadow-brand-600/30"
            >
              {loading ? "Salvando..." : initialData ? "Atualizar Conta" : "Salvar Conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
