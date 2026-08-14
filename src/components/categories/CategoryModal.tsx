"use client";

import { useState, useEffect } from "react";
import { X, Tag, AlertCircle } from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const PRESET_COLORS = [
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#d946ef", "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#84cc16", "#64748b", "#14b8a6"
];

const PRESET_ICONS = [
  "Tag", "Home", "Utensils", "Car", "Smile", "Activity",
  "BookOpen", "Tv", "CreditCard", "Briefcase", "Banknote",
  "TrendingUp", "ShoppingCart", "Gift", "Briefcase"
];

export default function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("Tag");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setType(initialData.type || "expense");
      setColor(initialData.color || "#6366f1");
      setIcon(initialData.icon || "Tag");
    } else {
      setName("");
      setType("expense");
      setColor("#6366f1");
      setIcon("Tag");
    }
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome da categoria é obrigatório.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = { name: name.trim(), type, color, icon };
      const url = initialData?.id ? `/api/categories/${initialData.id}` : "/api/categories";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar categoria");
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
          {initialData ? "Editar Categoria" : "Nova Categoria"}
        </h2>
        <p className="text-xs text-slate-400 mt-1">Organize suas movimentações financeiras</p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome da Categoria</label>
            <input
              type="text"
              placeholder="ex: Mercado, Moradia, Salário"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Categoria</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === "expense" ? "bg-rose-600 text-white" : "text-slate-400"
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === "income" ? "bg-emerald-600 text-white" : "text-slate-400"
                }`}
              >
                Receita
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Cor de Identificação</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? "border-white scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
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
              {loading ? "Salvando..." : initialData ? "Atualizar Categoria" : "Salvar Categoria"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
