"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import OverviewCards from "@/components/dashboard/OverviewCards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import TransactionModal from "@/components/transactions/TransactionModal";
import HelpTooltip from "@/components/common/HelpTooltip";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "fixed_expense" | "variable_expense">("variable_expense");

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

  const loadDashboardStats = useCallback(async (monthStr: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/stats?month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuxData = useCallback(async () => {
    try {
      const [catRes, accRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/accounts")
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
    } catch (err) {
      console.error("Error loading aux data:", err);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadAuxData();
  }, [loadUserData, loadAuxData]);

  useEffect(() => {
    if (user) {
      loadDashboardStats(currentMonth);
    }
  }, [user, currentMonth, loadDashboardStats]);

  const handleToggleStatus = async (id: string, currentStatus: "paid" | "pending") => {
    const newStatus = currentStatus === "paid" ? "pending" : "paid";
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadDashboardStats(currentMonth);
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
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
      loadDashboardStats(currentMonth);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      alert(data.message || "Dados de demonstração populados com sucesso!");
      loadDashboardStats(currentMonth);
      loadAuxData();
    } catch (err) {
      console.error(err);
    }
  };

  const openTransactionModal = (type?: "income" | "fixed_expense" | "variable_expense") => {
    if (type) setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onOpenTransactionModal={openTransactionModal}
          onProcessRecurring={handleProcessRecurring}
          onSeedDemoData={handleSeedDemoData}
          user={user}
        />

        <main className="flex-1 p-4 md:p-6 space-y-6 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Carregando painel financeiro...</p>
            </div>
          ) : stats ? (
            <>
              {/* Dashboard Title & Help */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    Visão Geral Financeira
                    <HelpTooltip
                      id="dashboard_overview_help"
                      title="Painel de Controle Financeiro"
                      description="Acompanhe suas receitas, despesas fixas, gastos variáveis e saldo em tempo real no mês selecionado."
                      actionHint="Navegue entre os meses no topo ou adicione lançamentos pelos botões verdes/vermelhos."
                    />
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">Resumo consolidado do desempenho e fluxo de caixa do mês</p>
                </div>
              </div>

              {/* Overview KPI Cards */}
              <OverviewCards stats={stats} />

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <MonthlyBarChart data={stats.monthlyComparison || []} />
                </div>
                <div className="lg:col-span-5">
                  <CategoryPieChart data={stats.categoryBreakdown || []} />
                </div>
              </div>

              {/* Recent Transactions List */}
              <RecentTransactions
                transactions={stats.recentTransactions || []}
                onToggleStatus={handleToggleStatus}
              />
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Não foi possível carregar os dados. Tente recarregar a página.
            </div>
          )}
        </main>
      </div>

      {/* Modal Nova/Editar Transação */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadDashboardStats(currentMonth)}
        initialType={modalType}
        categories={categories}
        accounts={accounts}
      />
      <BottomNav user={user} />
    </div>
  );
}
