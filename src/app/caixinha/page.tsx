"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import {
  INVESTMENT_OPTIONS,
  InvestmentOption,
  getInvestmentOptionById,
  RiskCategory,
} from "@/lib/constants/investments";
import {
  PiggyBank as PiggyIcon,
  TrendingUp,
  ShieldCheck,
  Zap,
  Building2,
  Coins,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Info,
  Trash2,
  Edit,
  Sparkles,
  Search,
  Filter,
  AlertCircle,
  Check,
  Loader2,
  Calendar,
  Landmark,
  Globe,
  Briefcase,
  Wheat,
  BarChart3,
  X,
  Target,
  DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface PiggyBankData {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  investment_type: string;
  risk_level: RiskCategory;
  expected_return_rate: number;
  monthly_deposit: number;
  target_date: string | null;
  color: string;
  icon: string;
  notes: string | null;
  created_at: string;
}

export default function CaixinhaPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [piggyBanks, setPiggyBanks] = useState<PiggyBankData[]>([]);
  const [summary, setSummary] = useState({
    totalCurrent: 0,
    totalTarget: 0,
    estimatedAnnualReturn: 0,
    count: 0,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Tab State: 'my_caixinhas' | 'simulator' | 'investment_guide'
  const [activeTab, setActiveTab] = useState<"my_caixinhas" | "simulator" | "investment_guide">("my_caixinhas");

  // Filter for Investment Guide
  const [guideCategoryFilter, setGuideCategoryFilter] = useState<"ALL" | RiskCategory>("ALL");
  const [guideSearch, setGuideSearch] = useState("");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPiggyBank, setEditingPiggyBank] = useState<PiggyBankData | null>(null);

  // Quick Action Modal (Deposit/Withdraw)
  const [actionModalBank, setActionModalBank] = useState<PiggyBankData | null>(null);
  const [actionType, setActionType] = useState<"deposit" | "withdraw">("deposit");
  const [actionAmount, setActionAmount] = useState("");

  // Form State for Create/Edit
  const [formName, setFormName] = useState("");
  const [formInvestmentType, setFormInvestmentType] = useState("TESOURO_SELIC");
  const [formTargetAmount, setFormTargetAmount] = useState("");
  const [formCurrentAmount, setFormCurrentAmount] = useState("");
  const [formMonthlyDeposit, setFormMonthlyDeposit] = useState("");
  const [formExpectedReturn, setFormExpectedReturn] = useState("10.5");
  const [formTargetDate, setFormTargetDate] = useState("");
  const [formColor, setFormColor] = useState("#10b981");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Simulator Calculator States
  const [simInitial, setSimInitial] = useState("5000");
  const [simMonthly, setSimMonthly] = useState("500");
  const [simYears, setSimYears] = useState("5");
  const [simType, setSimType] = useState("TESOURO_SELIC");
  const [simCustomRate, setSimCustomRate] = useState("10.5");

  // Load Auth User
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

  // Load Piggy Banks
  const loadPiggyBanks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/piggy-banks");
      if (res.ok) {
        const data = await res.json();
        setPiggyBanks(data.piggyBanks || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Error loading piggy banks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadPiggyBanks();
  }, [loadUserData, loadPiggyBanks]);

  // Auto update expected return rate when investment type changes in form
  const handleInvestmentTypeChange = (typeId: string) => {
    setFormInvestmentType(typeId);
    const opt = getInvestmentOptionById(typeId);
    if (opt) {
      setFormExpectedReturn(String(opt.defaultAnnualRate));
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = (presetTypeId?: string) => {
    setEditingPiggyBank(null);
    const defaultOpt = presetTypeId ? getInvestmentOptionById(presetTypeId) : INVESTMENT_OPTIONS[0];
    setFormName("");
    setFormInvestmentType(defaultOpt.id);
    setFormTargetAmount("10000");
    setFormCurrentAmount("1000");
    setFormMonthlyDeposit("300");
    setFormExpectedReturn(String(defaultOpt.defaultAnnualRate));
    setFormTargetDate("");
    setFormColor(defaultOpt.category === "LOW" ? "#10b981" : defaultOpt.category === "MEDIUM" ? "#f59e0b" : defaultOpt.category === "HIGH" ? "#f43f5e" : "#a855f7");
    setFormNotes("");
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (bank: PiggyBankData) => {
    setEditingPiggyBank(bank);
    setFormName(bank.name);
    setFormInvestmentType(bank.investment_type);
    setFormTargetAmount(String(bank.target_amount || 0));
    setFormCurrentAmount(String(bank.current_amount || 0));
    setFormMonthlyDeposit(String(bank.monthly_deposit || 0));
    setFormExpectedReturn(String(bank.expected_return_rate || 10.5));
    setFormTargetDate(bank.target_date || "");
    setFormColor(bank.color || "#10b981");
    setFormNotes(bank.notes || "");
    setIsCreateModalOpen(true);
  };

  // Submit Create / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg("O nome da caixinha é obrigatório.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      const selectedOpt = getInvestmentOptionById(formInvestmentType);

      const payload = {
        name: formName,
        investment_type: formInvestmentType,
        risk_level: selectedOpt.category,
        target_amount: parseFloat(formTargetAmount || "0"),
        current_amount: parseFloat(formCurrentAmount || "0"),
        monthly_deposit: parseFloat(formMonthlyDeposit || "0"),
        expected_return_rate: parseFloat(formExpectedReturn || "0"),
        target_date: formTargetDate || null,
        color: formColor,
        notes: formNotes,
      };

      let res;
      if (editingPiggyBank) {
        res = await fetch(`/api/piggy-banks/${editingPiggyBank.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/piggy-banks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar caixinha.");
      }

      setSuccessMsg(editingPiggyBank ? "Caixinha atualizada com sucesso!" : "Caixinha criada com sucesso!");
      setIsCreateModalOpen(false);
      loadPiggyBanks();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Deposit / Withdraw Movement Submit
  const handleQuickMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModalBank) return;

    const val = parseFloat(actionAmount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg("Digite um valor válido maior que zero.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const res = await fetch(`/api/piggy-banks/${actionModalBank.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          amount: val,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao realizar movimentação.");
      }

      setSuccessMsg(actionType === "deposit" ? `Aporte de R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} realizado!` : `Resgate de R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} efetuado!`);
      setActionModalBank(null);
      setActionAmount("");
      loadPiggyBanks();
    } catch (err: any) {
      setErrorMsg(err.message || "Falha na movimentação.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Piggy Bank
  const handleDeletePiggyBank = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a caixinha "${name}"?`)) return;

    try {
      setErrorMsg("");
      const res = await fetch(`/api/piggy-banks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Erro ao excluir caixinha.");
      }
      setSuccessMsg(`Caixinha "${name}" excluída.`);
      loadPiggyBanks();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Filtered Investment Options Guide
  const filteredGuideOptions = useMemo(() => {
    return INVESTMENT_OPTIONS.filter((opt) => {
      const matchCat = guideCategoryFilter === "ALL" || opt.category === guideCategoryFilter;
      const matchSearch =
        opt.name.toLowerCase().includes(guideSearch.toLowerCase()) ||
        opt.description.toLowerCase().includes(guideSearch.toLowerCase()) ||
        opt.categoryName.toLowerCase().includes(guideSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [guideCategoryFilter, guideSearch]);

  // Dynamic Compound Interest Simulation Calculation for Recharts
  const projectionChartData = useMemo(() => {
    const pInitial = Math.max(0, parseFloat(simInitial) || 0);
    const pMonthly = Math.max(0, parseFloat(simMonthly) || 0);
    const years = Math.min(30, Math.max(1, parseInt(simYears) || 1));

    const selectedOpt = getInvestmentOptionById(simType);
    const annualRate = parseFloat(simCustomRate) || selectedOpt.defaultAnnualRate || 10.5;
    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;

    const data = [];
    let currentBalance = pInitial;
    let totalInvested = pInitial;

    // Add Year 0
    data.push({
      yearLabel: "Início",
      year: 0,
      totalInvested: Math.round(totalInvested),
      patrimony: Math.round(currentBalance),
      interestEarnings: 0,
    });

    for (let yr = 1; yr <= years; yr++) {
      for (let m = 1; m <= 12; m++) {
        currentBalance = (currentBalance + pMonthly) * (1 + monthlyRate);
        totalInvested += pMonthly;
      }

      data.push({
        yearLabel: `${yr}º Ano`,
        year: yr,
        totalInvested: Math.round(totalInvested),
        patrimony: Math.round(currentBalance),
        interestEarnings: Math.max(0, Math.round(currentBalance - totalInvested)),
      });
    }

    return data;
  }, [simInitial, simMonthly, simYears, simType, simCustomRate]);

  const simFinalPoint = projectionChartData[projectionChartData.length - 1];

  // Helper Risk Category Badge
  const renderRiskBadge = (risk: RiskCategory) => {
    switch (risk) {
      case "LOW":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Baixo Risco
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Médio Risco
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Alto Risco
          </span>
        );
      case "VERY_HIGH":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Coins className="w-3 h-3" /> Muito Alto Risco
          </span>
        );
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
          {/* Header Title & Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <PiggyIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                Caixinha & Projetor de Investimentos
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Guarde dinheiro, estabeleça metas, projete o crescimento com juros compostos e compare investimentos de alto e baixo risco.
              </p>
            </div>

            <button
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> Criar Nova Caixinha
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg("")} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg("")} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Guardado */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Total Guardado</span>
                <PiggyIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
                R$ {summary.totalCurrent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="text-emerald-400 font-bold">
                  {summary.totalTarget > 0 ? Math.round((summary.totalCurrent / summary.totalTarget) * 100) : 0}%
                </span>
                <span>da meta geral atingida</span>
              </div>
            </div>

            {/* Meta Total Alvo */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Meta Total Acumulada</span>
                <Target className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
                R$ {summary.totalTarget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                <span>Faltam R$ {Math.max(0, summary.totalTarget - summary.totalCurrent).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Rendimento Estimado por Ano */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Rendimento Estimado / Ano</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 tracking-tight">
                + R$ {summary.estimatedAnnualReturn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                <span>Passivo em juros acumulados</span>
              </div>
            </div>

            {/* Total Caixinhas Ativas */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Caixinhas Ativas</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
                {summary.count} {summary.count === 1 ? "Caixinha" : "Caixinhas"}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold">Alto e Baixo Risco</span>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("my_caixinhas")}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "my_caixinhas"
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <PiggyIcon className="w-4 h-4" /> Minhas Caixinhas ({piggyBanks.length})
            </button>

            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "simulator"
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Calculator className="w-4 h-4 text-emerald-400" /> Simulador & Projeção Gráfica
            </button>

            <button
              onClick={() => setActiveTab("investment_guide")}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "investment_guide"
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-400" /> Guia dos Maiores Investimentos
            </button>
          </div>

          {/* TAB 1: MINHAS CAIXINHAS */}
          {activeTab === "my_caixinhas" && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                  <p className="text-xs text-slate-400">Carregando suas caixinhas...</p>
                </div>
              ) : piggyBanks.length === 0 ? (
                <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <PiggyIcon className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Nenhuma Caixinha Criada</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Crie sua primeira caixinha para organizar sua Reserva de Emergência, Metas de Viagem ou Carteira de Investimentos de Alto e Baixo Risco!
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Criar Primeira Caixinha
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {piggyBanks.map((bank) => {
                    const opt = getInvestmentOptionById(bank.investment_type);
                    const currentVal = Number(bank.current_amount || 0);
                    const targetVal = Number(bank.target_amount || 0);
                    const percent = targetVal > 0 ? Math.min(100, Math.round((currentVal / targetVal) * 100)) : 0;
                    const annualReturn = currentVal * (Number(bank.expected_return_rate || 0) / 100);

                    return (
                      <div
                        key={bank.id}
                        className="glass-panel rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                      >
                        {/* Top Decorative Color Accent */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1.5"
                          style={{ backgroundColor: bank.color || "#10b981" }}
                        />

                        <div>
                          {/* Title & Risk Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0"
                                style={{ backgroundColor: `${bank.color}25`, border: `1px solid ${bank.color}50` }}
                              >
                                <PiggyIcon className="w-5 h-5" style={{ color: bank.color }} />
                              </div>
                              <div>
                                <h3 className="font-bold text-base text-white group-hover:text-brand-300 transition-colors">
                                  {bank.name}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                                  {opt.name}
                                </p>
                              </div>
                            </div>
                            {renderRiskBadge(bank.risk_level)}
                          </div>

                          {/* Values & Progress */}
                          <div className="mt-5 space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-slate-400 font-medium">Guardado</span>
                              <span className="text-xl font-black text-white tracking-tight">
                                R$ {currentVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: bank.color || "#10b981",
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Meta: R$ {targetVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              <span className="font-bold text-slate-200">{percent}%</span>
                            </div>
                          </div>

                          {/* Extra info pills */}
                          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                              <span className="text-slate-500 block">Rendimento Estimado</span>
                              <span className="font-bold text-emerald-400">
                                +R$ {annualReturn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/ano
                              </span>
                            </div>
                            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                              <span className="text-slate-500 block">Taxa Contratada</span>
                              <span className="font-bold text-amber-400">
                                {bank.expected_return_rate}% a.a.
                              </span>
                            </div>
                          </div>

                          {bank.monthly_deposit > 0 && (
                            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-brand-400" /> Aporte mensal planejado: <strong className="text-slate-200">R$ {Number(bank.monthly_deposit).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                            </p>
                          )}
                        </div>

                        {/* Card Quick Actions */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setActionModalBank(bank);
                                setActionType("deposit");
                                setActionAmount("");
                              }}
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                              title="Guardar mais dinheiro nesta caixinha"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" /> + Guardar
                            </button>

                            <button
                              onClick={() => {
                                setActionModalBank(bank);
                                setActionType("withdraw");
                                setActionAmount("");
                              }}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                              title="Resgatar dinheiro da caixinha"
                            >
                              <ArrowDownRight className="w-3.5 h-3.5" /> - Resgatar
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(bank)}
                              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
                              title="Editar Caixinha"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePiggyBank(bank.id, bank.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-xl transition-colors"
                              title="Excluir Caixinha"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIMULADOR & PROJEÇÃO GRÁFICA DE JUROS COMPOSTOS */}
          {activeTab === "simulator" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Simulator Inputs Form */}
                <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Calculator className="w-5 h-5 text-emerald-400" /> Parâmetros de Simulação
                  </h3>

                  {/* Depósito Inicial */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Depósito Inicial (R$)
                    </label>
                    <input
                      type="number"
                      value={simInitial}
                      onChange={(e) => setSimInitial(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-brand-500"
                      placeholder="Ex: 5000"
                    />
                  </div>

                  {/* Aporte Mensal */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Aporte Mensal (R$)
                    </label>
                    <input
                      type="number"
                      value={simMonthly}
                      onChange={(e) => setSimMonthly(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-brand-500"
                      placeholder="Ex: 500"
                    />
                  </div>

                  {/* Prazo em Anos */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Prazo de Investimento (Anos)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={simYears}
                        onChange={(e) => setSimYears(e.target.value)}
                        className="flex-1 accent-brand-500 cursor-pointer"
                      />
                      <span className="text-sm font-black text-brand-400 bg-brand-950 px-3 py-1 rounded-xl border border-brand-800">
                        {simYears} {parseInt(simYears) === 1 ? "ano" : "anos"}
                      </span>
                    </div>
                  </div>

                  {/* Tipo de Investimento */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Tipo de Investimento / Referência
                    </label>
                    <select
                      value={simType}
                      onChange={(e) => {
                        setSimType(e.target.value);
                        const opt = getInvestmentOptionById(e.target.value);
                        if (opt) setSimCustomRate(String(opt.defaultAnnualRate));
                      }}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
                    >
                      {INVESTMENT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          [{opt.categoryName}] {opt.name} ({opt.defaultAnnualRate}% a.a.)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Taxa de Rendimento Personalizada */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Taxa de Rendimento Estimada (% ao ano)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={simCustomRate}
                      onChange={(e) => setSimCustomRate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Result Summary Box */}
                  {simFinalPoint && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 mt-4">
                      <span className="text-[11px] text-slate-400 font-bold block">
                        RESULTADO PROJETADO EM {simYears} ANOS:
                      </span>
                      <p className="text-2xl font-black text-emerald-400 tracking-tight">
                        R$ {simFinalPoint.patrimony.toLocaleString("pt-BR")}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Do seu bolso:</span>
                          <span className="font-bold text-slate-200">
                            R$ {simFinalPoint.totalInvested.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Juros Compostos:</span>
                          <span className="font-bold text-amber-400">
                            + R$ {simFinalPoint.interestEarnings.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactive Chart Visualizer */}
                <div className="lg:col-span-2 glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-brand-400" /> Projeção de Crescimento do Patrimônio
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Efeito bola de neve dos Juros Compostos ao longo do tempo.
                        </p>
                      </div>
                      {simFinalPoint && (
                        <div className="hidden sm:block text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Multiplicador</span>
                          <p className="text-sm font-extrabold text-brand-400">
                            {(simFinalPoint.patrimony / Math.max(1, simFinalPoint.totalInvested)).toFixed(2)}x o investido
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="h-[340px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectionChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPatrimony" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="yearLabel" stroke="#64748b" fontSize={11} />
                          <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "12px",
                              fontSize: "12px",
                              color: "#f8fafc",
                            }}
                            formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, ""]}
                          />
                          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                          <Area
                            type="monotone"
                            dataKey="totalInvested"
                            name="Total Aportado (Bolso)"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorInvested)"
                          />
                          <Area
                            type="monotone"
                            dataKey="patrimony"
                            name="Patrimônio Total (com Juros)"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorPatrimony)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
                    <Info className="w-5 h-5 text-brand-400 shrink-0" />
                    <p className="leading-relaxed">
                      A curva verde mostra o poder dos juros acumulados reinvestidos mês a mês. Quanto maior o horizonte de tempo, maior é o rendimento passivo sem esforço adicional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GUIA COMPLETO DOS MAIORES TIPOS DE INVESTIMENTO (ALTO E BAIXO RISCO) */}
          {activeTab === "investment_guide" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Filter controls bar */}
              <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setGuideCategoryFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      guideCategoryFilter === "ALL"
                        ? "bg-brand-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setGuideCategoryFilter("LOW")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      guideCategoryFilter === "LOW"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-emerald-400"
                    }`}
                  >
                    🛡️ Baixo Risco
                  </button>
                  <button
                    onClick={() => setGuideCategoryFilter("MEDIUM")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      guideCategoryFilter === "MEDIUM"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-amber-400"
                    }`}
                  >
                    📈 Médio Risco
                  </button>
                  <button
                    onClick={() => setGuideCategoryFilter("HIGH")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      guideCategoryFilter === "HIGH"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-rose-400"
                    }`}
                  >
                    ⚡ Alto Risco
                  </button>
                  <button
                    onClick={() => setGuideCategoryFilter("VERY_HIGH")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      guideCategoryFilter === "VERY_HIGH"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-purple-400"
                    }`}
                  >
                    🪙 Muito Alto Risco
                  </button>
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={guideSearch}
                    onChange={(e) => setGuideSearch(e.target.value)}
                    placeholder="Buscar investimento..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Investment Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredGuideOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className={`glass-panel rounded-3xl p-5 border ${opt.borderColor} hover:scale-[1.01] transition-all flex flex-col justify-between space-y-4`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-white">{opt.name}</h3>
                        {renderRiskBadge(opt.category)}
                      </div>

                      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                        {opt.description}
                      </p>

                      <div className="mt-4 space-y-2 pt-3 border-t border-slate-800/80 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Rendimento Médio Estimado:</span>
                          <span className="font-extrabold text-amber-400 text-xs">{opt.defaultAnnualRate}% a.a.</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Liquidez:</span>
                          <span className="font-medium text-slate-200">{opt.liquidity}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Imposto de Renda:</span>
                          <span className="font-medium text-slate-300">{opt.taxStatus}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Garantia FGC:</span>
                          <span className={`font-bold ${opt.fgcProtection ? "text-emerald-400" : "text-slate-500"}`}>
                            {opt.fgcProtection ? "Sim (até R$250k)" : "Não"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                        <strong className="text-slate-200">Ideal para:</strong> {opt.idealFor}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleOpenCreateModal(opt.id);
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-brand-600 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-800 hover:border-brand-500 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" /> Criar Caixinha com este Ativo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <BottomNav user={user} />

      {/* CREATE / EDIT CAIXINHA MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card max-w-lg w-full rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <PiggyIcon className="w-5 h-5 text-emerald-400" />
                {editingPiggyBank ? "Editar Caixinha" : "Criar Nova Caixinha"}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Nome da Caixinha */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome da Caixinha *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Reserva de Emergência, Ações do Futuro, Viagem..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Tipo de Investimento */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tipo de Investimento (Alto ou Baixo Risco)
                </label>
                <select
                  value={formInvestmentType}
                  onChange={(e) => handleInvestmentTypeChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <optgroup label="--- BAIXO RISCO (Renda Fixa Conservadora) ---">
                    <option value="TESOURO_SELIC">Tesouro Selic (100% Selic - 10.5% a.a.)</option>
                    <option value="CDB">CDB Pós-Fixado (FGC - 11.2% a.a.)</option>
                    <option value="LCI_LCA">LCI / LCA (Isento de IR - 9.5% a.a.)</option>
                    <option value="POUPANCA">Poupança (6.17% a.a.)</option>
                  </optgroup>
                  <optgroup label="--- MÉDIO RISCO (Híbridos / Renda Imobiliária) ---">
                    <option value="TESOURO_IPCA">Tesouro IPCA+ (Inflação + Fixa - 11.8% a.a.)</option>
                    <option value="FIIS">FIIs (Fundos Imobiliários - 12.0% a.a.)</option>
                    <option value="DEBENTURES">Debêntures Incentivadas (12.5% a.a.)</option>
                  </optgroup>
                  <optgroup label="--- ALTO RISCO (Renda Variável & Bolsas) ---">
                    <option value="ACOES">Ações Individuais B3 (14.5% a.a.)</option>
                    <option value="ETFS">ETFs Globais IVVB11 / BOVA11 (13.5% a.a.)</option>
                    <option value="BDRS">BDRs Big Techs Dólar (16.0% a.a.)</option>
                  </optgroup>
                  <optgroup label="--- MUITO ALTO RISCO (Criptoativos) ---">
                    <option value="CRIPTO">Criptomoedas (BTC, ETH - 25.0% a.a.)</option>
                  </optgroup>
                </select>
              </div>

              {/* Grid 2 colunas: Meta e Saldo Atual */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Meta de Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    placeholder="Ex: 20000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Saldo Guardado Atual (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCurrentAmount}
                    onChange={(e) => setFormCurrentAmount(e.target.value)}
                    placeholder="Ex: 5000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Grid 2 colunas: Aporte Mensal & Taxa de Rendimento % */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Aporte Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMonthlyDeposit}
                    onChange={(e) => setFormMonthlyDeposit(e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Rendimento (% ao ano)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formExpectedReturn}
                    onChange={(e) => setFormExpectedReturn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Cor Visual da Caixinha */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Cor de Destaque
                </label>
                <div className="flex items-center gap-2">
                  {["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#a855f7", "#06b6d4"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        formColor === c ? "scale-110 border-white shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Anotações */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Anotações / Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Meta até dez/2027 para viagem em família..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingPiggyBank ? "Salvar Alterações" : "Criar Caixinha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK DEPOSIT / WITHDRAW MODAL */}
      {actionModalBank && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card max-w-sm w-full rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                {actionType === "deposit" ? (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" /> Guardar Dinheiro
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-5 h-5 text-rose-400" /> Resgatar Dinheiro
                  </>
                )}
              </h3>
              <button
                onClick={() => setActionModalBank(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Caixinha: <strong className="text-white">{actionModalBank.name}</strong>
              <div className="mt-1 text-[11px] text-slate-400">
                Saldo Atual: R$ {Number(actionModalBank.current_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <form onSubmit={handleQuickMovement} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Valor a {actionType === "deposit" ? "Guardar (+)" : "Resgatar (-)"} (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Ex: 250,00"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-extrabold text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalBank(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 text-white disabled:opacity-50 ${
                    actionType === "deposit" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30" : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                  }`}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : actionType === "deposit" ? "Confirmar Aporte" : "Confirmar Resgate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
