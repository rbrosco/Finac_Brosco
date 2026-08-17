"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import AccountModal from "@/components/accounts/AccountModal";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { Wallet, Plus, CreditCard, Landmark, Coins, Edit2, Trash2, Loader2 } from "lucide-react";

export default function AccountsPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [deletingAccount, setDeletingAccount] = useState<any>(null);

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

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts");
      if (res.ok) setAccounts(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadAccounts();
  }, [loadUserData, loadAccounts]);

  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    try {
      const res = await fetch(`/api/accounts/${deletingAccount.id}`, { method: "DELETE" });
      if (res.ok) loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const openEditModal = (acc: any) => {
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "credit_card":
        return <CreditCard className="w-6 h-6 text-purple-400" />;
      case "checking":
        return <Landmark className="w-6 h-6 text-blue-400" />;
      case "cash":
        return <Coins className="w-6 h-6 text-emerald-400" />;
      default:
        return <Wallet className="w-6 h-6 text-indigo-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "credit_card": return "Cartão de Crédito";
      case "checking": return "Conta Corrente";
      case "cash": return "Dinheiro / Carteira";
      case "savings": return "Poupança / Reserva";
      case "investment": return "Investimentos";
      default: return "Conta Geral";
    }
  };

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

        <main className="flex-1 p-4 md:p-6 space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Wallet className="w-7 h-7 text-blue-400" /> Contas & Formas de Pagamento
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Cadastre seus cartões, contas bancárias e carteiras para vincular seus lançamentos
              </p>
            </div>

            <button
              onClick={openNewModal}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
            >
              <Plus className="w-4 h-4" /> Nova Conta
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Carregando contas...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center text-slate-400">
              Nenhuma conta ou cartão cadastrado ainda. Clique em "Nova Conta" para cadastrar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        {getAccountIcon(acc.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-100">{acc.name}</h3>
                        <span className="text-xs text-slate-400">{getTypeLabel(acc.type)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(acc)}
                        className="p-1.5 text-slate-400 hover:text-brand-400 rounded-lg hover:bg-slate-800"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingAccount(acc)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Saldo Inicial</span>
                    <span className="font-bold text-slate-200 text-sm">{formatMoney(Number(acc.initial_balance))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadAccounts}
        initialData={editingAccount}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingAccount)}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Conta Financeira"
        description="Tem certeza que deseja excluir esta conta bancária ou cartão?"
        itemName={deletingAccount?.name}
        itemDetails={deletingAccount ? `Saldo Inicial: ${formatMoney(Number(deletingAccount.initial_balance))}` : undefined}
      />

      <BottomNav user={user} />
    </div>
  );
}
