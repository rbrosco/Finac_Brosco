"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import HouseBillSplitter from "@/components/family/HouseBillSplitter";
import { Calculator, Users, AlertCircle, Check, Loader2 } from "lucide-react";

export default function SplitCalculatorPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const loadFamilyData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/family");
      if (res.ok) {
        const data = await res.json();
        setFamilyData(data);
      }
    } catch (err) {
      console.error("Error loading family data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadFamilyData();
  }, [loadUserData, loadFamilyData]);

  const handleSaveSplitterToDatabase = async (splitItems: any[]) => {
    const res = await fetch("/api/agent/confirm-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: splitItems })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao gravar divisão de contas.");
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

        <main className="flex-1 p-4 md:p-6 space-y-6 w-full pb-28 md:pb-8">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Calculator className="w-7 h-7 text-purple-400" /> Calculadora Estratégica de Divisão de Contas
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ferramenta avançada para divisão justa de contas de Água, Luz, Internet, Mercado e Aluguel entre moradores ou familiares.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg("")} className="text-xs text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg("")} className="text-xs text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Carregando Calculadora Estratégica...</p>
            </div>
          ) : (
            <HouseBillSplitter
              familyMembers={familyData?.members || []}
              currentUserId={user?.id}
              currentMonth={currentMonth}
              onSaveToTransactions={handleSaveSplitterToDatabase}
            />
          )}
        </main>
      </div>
      <BottomNav user={user} />
    </div>
  );
}
