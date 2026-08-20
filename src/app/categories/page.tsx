"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import CategoryModal from "@/components/categories/CategoryModal";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { Tags, Plus, Edit2, Trash2, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function CategoriesPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);

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

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadCategories();
  }, [loadUserData, loadCategories]);

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, { method: "DELETE" });
      if (res.ok) loadCategories();
      else alert("Categorias padrão não podem ser removidas.");
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onOpenTransactionModal={() => {}}
          user={user}
        />

        <main className="flex-1 p-4 md:p-6 space-y-6 w-full pb-28 md:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Tags className="w-7 h-7 text-indigo-400" /> Categorias Financeiras
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Classifique suas receitas e despesas para manter o controle por centros de custo
              </p>
            </div>

            <button
              onClick={openNewModal}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
            >
              <Plus className="w-4 h-4" /> Nova Categoria
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Carregando categorias...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Expense Categories */}
              <div>
                <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-rose-400" /> Categorias de Despesas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
                          style={{ backgroundColor: cat.color || "#6366f1" }}
                        >
                          <Tags className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-200">{cat.name}</h4>
                          <span className="text-[11px] text-slate-400">
                            {cat.is_default ? "Padrão do Sistema" : "Personalizada"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          title="Editar Categoria"
                          className="p-1.5 text-slate-400 hover:text-brand-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          title="Excluir Categoria"
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Income Categories */}
              <div>
                <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Categorias de Receitas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
                          style={{ backgroundColor: cat.color || "#10b981" }}
                        >
                          <Tags className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-200">{cat.name}</h4>
                          <span className="text-[11px] text-slate-400">
                            {cat.is_default ? "Padrão do Sistema" : "Personalizada"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          title="Editar Categoria"
                          className="p-1.5 text-slate-400 hover:text-brand-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          title="Excluir Categoria"
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadCategories}
        initialData={editingCategory}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Categoria"
        description="Tem certeza que deseja excluir esta categoria personalizada?"
        itemName={deletingCategory?.name}
      />

      <BottomNav user={user} />
    </div>
  );
}
