"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import { BarChart3, Download, PieChart, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadReportData = useCallback(async (monthStr: string) => {
    try {
      setLoading(true);
      const [statsRes, txRes] = await Promise.all([
        fetch(`/api/dashboard/stats?month=${monthStr}`),
        fetch(`/api/transactions?month=${monthStr}`)
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (user) loadReportData(currentMonth);
  }, [user, currentMonth, loadReportData]);

  const exportCSV = () => {
    if (!transactions || transactions.length === 0) {
      alert("Nenhum lançamento para exportar neste mês.");
      return;
    }

    const headers = ["ID", "Título", "Tipo", "Valor (R$)", "Data Vencimento", "Status", "Categoria", "Conta"];
    const rows = transactions.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      t.amount,
      t.due_date,
      t.status,
      `"${t.category?.name || ''}"`,
      `"${t.account?.name || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
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

        <main className="flex-1 p-4 md:p-6 space-y-6 w-full pb-28 md:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-emerald-400" /> Relatórios & DRE Financeiro
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Demonstrativo de fluxo de caixa mensal e exportação de dados
              </p>
            </div>

            <button
              onClick={exportCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Gerando relatório...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Consolidated Statement Table */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" /> Resumo do Demonstrativo Financeiro ({currentMonth})
                </h3>

                <div className="space-y-3 pt-2 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Total de Receitas
                    </span>
                    <span className="font-extrabold text-emerald-400 text-base">{formatMoney(stats.totalIncome)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-purple-400" /> Total de Despesas Fixas (Recorrentes)
                    </span>
                    <span className="font-extrabold text-purple-400 text-base">-{formatMoney(stats.totalFixedExpenses)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-rose-400" /> Total de Gastos Variáveis (Avulsos)
                    </span>
                    <span className="font-extrabold text-rose-400 text-base">-{formatMoney(stats.totalVariableExpenses)}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700 mt-4">
                    <span className="font-bold text-slate-100 text-base">Resultado Líquido do Mês (Balanço)</span>
                    <span className={`font-extrabold text-xl ${stats.netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatMoney(stats.netBalance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category allocation breakdown table */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800">
                <h3 className="font-bold text-lg text-slate-100 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-400" /> Alocação de Gastos por Categoria
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                      <tr>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Valor Total</th>
                        <th className="p-3">% do Total de Gastos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(stats.categoryBreakdown || []).map((cat: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </td>
                          <td className="p-3 font-bold text-slate-100">{formatMoney(cat.amount)}</td>
                          <td className="p-3 text-slate-300">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                                />
                              </div>
                              <span>{cat.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
      <BottomNav user={user} />
    </div>
  );
}
