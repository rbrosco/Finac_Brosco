"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Settings, User, Sparkles, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [seedMessage, setSeedMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleSeedDemoData = async () => {
    setLoading(true);
    setSeedMessage("");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      setSeedMessage(data.message || "Dados de demonstração populados com sucesso!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-4xl w-full mx-auto">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-brand-400" /> Configurações do Sistema
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie suas preferências de conta e dados de demonstração
            </p>
          </div>

          {/* User Profile Info */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> Perfil do Usuário
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="block text-xs text-slate-400 font-medium">Nome</span>
                <span className="block font-semibold text-slate-200 text-sm mt-0.5">{user?.name || "-"}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="block text-xs text-slate-400 font-medium">E-mail</span>
                <span className="block font-semibold text-slate-200 text-sm mt-0.5">{user?.email || "-"}</span>
              </div>
            </div>
          </div>

          {/* Demo Data & Utility */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Dados de Demonstração (Demo Data)
            </h2>
            <p className="text-xs text-slate-400">
              Caso queira preencher sua conta com transações de exemplo para avaliar o comportamento dos gráficos de pizza e barras, clique no botão abaixo.
            </p>

            {seedMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {seedMessage}
              </div>
            )}

            <div>
              <button
                onClick={handleSeedDemoData}
                disabled={loading}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Gerando..." : "Gerar Dados Demo Agora"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
