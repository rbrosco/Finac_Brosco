"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  Share2,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Droplets,
  Wifi,
  ShoppingCart,
  Home,
  Users,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Calendar,
  Layers,
  HelpCircle,
  Loader2
} from "lucide-react";

export interface Resident {
  id: string;
  name: string;
  isExternal?: boolean; // true if person outside family (friend, roommate, guest)
  pixKey?: string;
  familyCount: number; // N° de Pessoas na Família / Sub-grupo (default 1)
  daysPresent: number; // Days in month (e.g. 30, 15, 10)
  income: number; // Optional income for proportional split
  weight: number; // Consumption weight (e.g. 1.0, 1.5 for AC)
}

export interface BillItem {
  id: string;
  name: string; // "Conta de Água", "Luz", "Internet", "Mercado"
  amount: number;
  paidByUserId: string; // ID of resident who paid this bill
  splitMethod: "equal" | "days" | "family" | "income" | "weight"; // Strategy
  iconType: "water" | "power" | "internet" | "grocery" | "rent" | "other";
}

interface HouseBillSplitterProps {
  familyMembers: any[];
  currentUserId?: string;
  currentMonth?: string;
  onSaveToTransactions?: (splitResults: any[]) => Promise<void>;
}

export default function HouseBillSplitter({
  familyMembers,
  currentUserId,
  currentMonth,
  onSaveToTransactions
}: HouseBillSplitterProps) {
  // 1. Database State for Residents & Bills
  const [residents, setResidents] = useState<Resident[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // New Resident Form State
  const [newResidentName, setNewResidentName] = useState("");
  const [newResidentFamilyCount, setNewResidentFamilyCount] = useState(1);
  const [newResidentPix, setNewResidentPix] = useState("");

  // New Bill Form State
  const [newBillName, setNewBillName] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillPayer, setNewBillPayer] = useState("");
  const [newBillMethod, setNewBillMethod] = useState<"equal" | "days" | "family" | "income" | "weight">("family");
  const [newBillIcon, setNewBillIcon] = useState<"water" | "power" | "internet" | "grocery" | "rent" | "other">("power");

  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const targetMonth = currentMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  // Fetch Residents & Bills live from PostgreSQL Database for current month
  const fetchDbData = useCallback(async () => {
    try {
      setIsLoadingDb(true);
      const res = await fetch(`/api/family/splitter?month=${targetMonth}`);
      if (res.ok) {
        const data = await res.json();

        let loadedResidents: Resident[] = (data.residents || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          isExternal: r.is_external,
          familyCount: r.family_count || 1,
          daysPresent: r.days_present,
          income: 3000,
          weight: r.weight,
          pixKey: r.pix_key || ""
        }));

        let loadedBills: BillItem[] = (data.bills || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          amount: Number(b.amount),
          paidByUserId: b.paid_by_user_id || b.paid_by_name,
          splitMethod: b.split_method,
          iconType: b.icon_type
        }));

        // If DB has no residents, seed initial family members
        if (loadedResidents.length === 0) {
          const initialMembers = familyMembers && familyMembers.length > 0 
            ? familyMembers.map((m: any) => ({ name: m.user?.name || m.name || "Morador", is_external: false }))
            : [{ name: "Rogger Brosco", is_external: false }, { name: "Priscila Brosco (Conta da Casa)", is_external: false }];

          for (const mem of initialMembers) {
            const addRes = await fetch("/api/family/splitter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "add_resident", name: mem.name, is_external: mem.is_external, days_present: 30, weight: 1.0 })
            });
            if (addRes.ok) {
              const resData = await addRes.json();
              if (resData.resident) {
                loadedResidents.push({
                  id: resData.resident.id,
                  name: resData.resident.name,
                  isExternal: resData.resident.is_external,
                  familyCount: resData.resident.family_count || 1,
                  daysPresent: resData.resident.days_present,
                  income: 3000,
                  weight: resData.resident.weight,
                  pixKey: resData.resident.pix_key
                });
              }
            }
          }
        }

        setResidents(loadedResidents);
        setBills(loadedBills);
        if (!newBillPayer && loadedResidents.length > 0) {
          setNewBillPayer(loadedResidents[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching splitter DB data:", err);
    } finally {
      setIsLoadingDb(false);
    }
  }, [targetMonth, familyMembers]);

  useEffect(() => {
    fetchDbData();
  }, [fetchDbData]);

  // Add Resident directly into PostgreSQL Database
  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newResidentName.trim();
    if (!trimmed) return;

    try {
      const res = await fetch("/api/family/splitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_resident",
          name: trimmed,
          is_external: true,
          family_count: newResidentFamilyCount || 1,
          days_present: 30,
          weight: 1.0,
          pix_key: newResidentPix.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newRes: Resident = {
          id: data.resident.id,
          name: data.resident.name,
          isExternal: data.resident.is_external,
          familyCount: data.resident.family_count || 1,
          daysPresent: data.resident.days_present,
          income: 3000,
          weight: data.resident.weight,
          pixKey: data.resident.pix_key
        };
        setResidents(prev => [...prev, newRes]);
        setNewResidentName("");
        setNewResidentFamilyCount(1);
        setNewResidentPix("");
        setSaveSuccessMsg(`Morador "${trimmed}" gravado com sucesso no Banco de Dados!`);
      }
    } catch {
      //
    }
  };

  // Remove Resident directly from PostgreSQL Database
  const handleRemoveResident = async (id: string) => {
    if (residents.length <= 1) {
      alert("Mantenha pelo menos 1 morador na casa.");
      return;
    }

    try {
      const res = await fetch("/api/family/splitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_resident", id })
      });

      if (res.ok) {
        setResidents(prev => prev.filter(r => r.id !== id));
        setSaveSuccessMsg("Morador excluído com sucesso do Banco de Dados.");
      }
    } catch {
      //
    }
  };

  // Add Bill directly into PostgreSQL Database
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newBillAmount);
    if (!newBillName.trim() || isNaN(amt) || amt <= 0) return;

    const payer = residents.find(r => r.id === newBillPayer);

    try {
      const res = await fetch("/api/family/splitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_bill",
          name: newBillName.trim(),
          amount: amt,
          paid_by_name: payer?.name || "Morador",
          paid_by_user_id: payer?.id || null,
          split_method: newBillMethod,
          icon_type: newBillIcon,
          month: targetMonth
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newBill: BillItem = {
          id: data.bill.id,
          name: data.bill.name,
          amount: Number(data.bill.amount),
          paidByUserId: data.bill.paid_by_user_id || data.bill.paid_by_name,
          splitMethod: data.bill.split_method,
          iconType: data.bill.icon_type
        };
        setBills(prev => [...prev, newBill]);
        setNewBillName("");
        setNewBillAmount("");
        setSaveSuccessMsg(`Conta "${newBill.name}" gravada com sucesso no Banco de Dados!`);
      }
    } catch {
      //
    }
  };

  // Remove Bill directly from PostgreSQL Database
  const handleRemoveBill = async (id: string) => {
    try {
      const res = await fetch("/api/family/splitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_bill", id })
      });

      if (res.ok) {
        setBills(prev => prev.filter(b => b.id !== id));
        setSaveSuccessMsg("Conta excluída com sucesso do Banco de Dados.");
      }
    } catch {
      //
    }
  };

  // Update Resident in PostgreSQL Database
  const updateResident = async (id: string, key: keyof Resident, value: any) => {
    setResidents(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r));

    try {
      const dbKey = key === "daysPresent" ? "days_present" : key === "familyCount" ? "family_count" : key;
      await fetch("/api/family/splitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_resident",
          id,
          [dbKey]: value
        })
      });
    } catch {
      //
    }
  };

  // -------------------------------------------------------------
  // STRATEGIC CALCULATOR ENGINE (DEDUCTION & MINIMAL SETTLEMENT)
  // -------------------------------------------------------------
  const calculateSplits = () => {
    if (residents.length === 0 || bills.length === 0) {
      return { totalExpenses: 0, residentBalances: [], settlementTransfers: [], billBreakdown: [] };
    }

    const totalExpenses = bills.reduce((acc, b) => acc + b.amount, 0);

    // Track total paid upfront and total share owed per resident
    const paidUpfrontMap: { [id: string]: number } = {};
    const shareOwedMap: { [id: string]: number } = {};

    residents.forEach(r => {
      paidUpfrontMap[r.id] = 0;
      shareOwedMap[r.id] = 0;
    });

    // Process each bill according to its strategy
    const billBreakdown = bills.map(bill => {
      // Add to paid upfront
      if (paidUpfrontMap[bill.paidByUserId] !== undefined) {
        paidUpfrontMap[bill.paidByUserId] += bill.amount;
      }

      const sharesPerResident: { [id: string]: number } = {};

      if (bill.splitMethod === "family") {
        // Strategic: Proportional to Head Count / N° de Pessoas no Grupo Familiar
        const totalHeadCount = residents.reduce((acc, r) => acc + (r.familyCount || 1), 0);
        residents.forEach(r => {
          const ratio = (r.familyCount || 1) / (totalHeadCount || 1);
          const share = bill.amount * ratio;
          sharesPerResident[r.id] = share;
          shareOwedMap[r.id] += share;
        });
      } else if (bill.splitMethod === "days") {
        // Strategic: Proportional to Person-Days (daysPresent * familyCount)
        const totalPersonDays = residents.reduce((acc, r) => acc + ((r.daysPresent || 1) * (r.familyCount || 1)), 0);
        residents.forEach(r => {
          const pDays = (r.daysPresent || 1) * (r.familyCount || 1);
          const ratio = pDays / (totalPersonDays || 1);
          const share = bill.amount * ratio;
          sharesPerResident[r.id] = share;
          shareOwedMap[r.id] += share;
        });
      } else if (bill.splitMethod === "income") {
        // Strategic: Proportional to income
        const totalIncome = residents.reduce((acc, r) => acc + (r.income || 1), 0);
        residents.forEach(r => {
          const ratio = (r.income || 1) / (totalIncome || 1);
          const share = bill.amount * ratio;
          sharesPerResident[r.id] = share;
          shareOwedMap[r.id] += share;
        });
      } else if (bill.splitMethod === "weight") {
        // Strategic: Proportional to consumption weight (e.g. AC weight)
        const totalWeight = residents.reduce((acc, r) => acc + (r.weight || 1), 0);
        residents.forEach(r => {
          const ratio = (r.weight || 1) / (totalWeight || 1);
          const share = bill.amount * ratio;
          sharesPerResident[r.id] = share;
          shareOwedMap[r.id] += share;
        });
      } else {
        // Equal split (per resident card)
        const share = bill.amount / residents.length;
        residents.forEach(r => {
          sharesPerResident[r.id] = share;
          shareOwedMap[r.id] += share;
        });
      }

      return {
        ...bill,
        sharesPerResident
      };
    });

    // Calculate Net Balance: (Paid Upfront - Share Owed)
    // Positive = Should RECEIVE money
    // Negative = Should PAY money
    const residentBalances = residents.map(r => {
      const paid = paidUpfrontMap[r.id] || 0;
      const owed = shareOwedMap[r.id] || 0;
      const net = paid - owed;
      return {
        id: r.id,
        name: r.name,
        paid,
        owed,
        net
      };
    });

    // Minimal Transfer Algorithm (Quitação Otimizada)
    const debtors = residentBalances
      .filter(r => r.net < -0.01)
      .map(r => ({ id: r.id, name: r.name, amount: Math.abs(r.net) }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = residentBalances
      .filter(r => r.net > 0.01)
      .map(r => ({ id: r.id, name: r.name, amount: r.net }))
      .sort((a, b) => b.amount - a.amount);

    const settlementTransfers: { from: string; to: string; amount: number }[] = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const transferAmt = Math.min(debtor.amount, creditor.amount);
      if (transferAmt > 0.01) {
        settlementTransfers.push({
          from: debtor.name,
          to: creditor.name,
          amount: transferAmt
        });
      }

      debtor.amount -= transferAmt;
      creditor.amount -= transferAmt;

      if (debtor.amount <= 0.01) dIdx++;
      if (creditor.amount <= 0.01) cIdx++;
    }

    return {
      totalExpenses,
      residentBalances,
      settlementTransfers,
      billBreakdown
    };
  };

  const { totalExpenses, residentBalances, settlementTransfers, billBreakdown } = calculateSplits();

  // Generate WhatsApp Formatted Text Summary
  const generateWhatsAppSummary = () => {
    let msg = `🏠 *DIVISÃO ESTRATÉGICA DE CONTAS DA CASA*\n`;
    msg += `💰 *Total das Contas:* R$ ${totalExpenses.toFixed(2)}\n\n`;

    msg += `📋 *DESCRITIVO DAS CONTAS:*\n`;
    bills.forEach(b => {
      const payerName = residents.find(r => r.id === b.paidByUserId)?.name || "Alguém";
      const methodLabel = b.splitMethod === "days" ? "Dias de Presença" : b.splitMethod === "income" ? "Renda Proporcional" : b.splitMethod === "weight" ? "Carga de Consumo" : "Igualitário";
      msg += `• *${b.name}*: R$ ${b.amount.toFixed(2)} (Pago por ${payerName}) - Divisão por ${methodLabel}\n`;
    });

    msg += `\n📊 *RESUMO INDIVIDUAL:*\n`;
    residentBalances.forEach(r => {
      msg += `• *${r.name}*: Cota R$ ${r.owed.toFixed(2)} | Pagou R$ ${r.paid.toFixed(2)} | Balance: ${r.net >= 0 ? `🟢 Recebe R$ ${r.net.toFixed(2)}` : `🔴 Paga R$ ${Math.abs(r.net).toFixed(2)}`}\n`;
    });

    msg += `\n💸 *QUITAÇÃO DIRETA VIA PIX:*\n`;
    if (settlementTransfers.length === 0) {
      msg += `✅ Todas as contas estão 100% quitadas e sem pendências!\n`;
    } else {
      settlementTransfers.forEach(t => {
        msg += `👉 *${t.from}* envia *R$ ${t.amount.toFixed(2)}* via PIX para *${t.to}*\n`;
      });
    }

    return msg;
  };

  const copyWhatsAppSummary = () => {
    const text = generateWhatsAppSummary();
    navigator.clipboard.writeText(text);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  const handleSaveToDatabase = async () => {
    if (!onSaveToTransactions) return;

    try {
      setIsSavingBatch(true);
      setSaveSuccessMsg("");

      // Prepare items for each resident's share
      const itemsToSave: any[] = [];

      bills.forEach(bill => {
        residents.forEach(res => {
          const shareAmt = billBreakdown.find(b => b.id === bill.id)?.sharesPerResident[res.id] || 0;
          if (shareAmt > 0.01) {
            itemsToSave.push({
              title: `${bill.name} (Cota ${res.name})`,
              amount: shareAmt,
              type: "variable_expense",
              due_date: new Date().toISOString().split("T")[0],
              user_id: res.id,
              description: `Divisão Estratégica da Casa - Pago por ${residents.find(r => r.id === bill.paidByUserId)?.name || "Titular"}`
            });
          }
        });
      });

      await onSaveToTransactions(itemsToSave);
      setSaveSuccessMsg(`${itemsToSave.length} cotas de contas da casa salvas com sucesso no seu controle!`);
    } catch {
      //
    } finally {
      setIsSavingBatch(false);
    }
  };

  const getIcon = (type: BillItem["iconType"]) => {
    switch (type) {
      case "water": return <Droplets className="w-4 h-4 text-cyan-400" />;
      case "power": return <Zap className="w-4 h-4 text-amber-400" />;
      case "internet": return <Wifi className="w-4 h-4 text-indigo-400" />;
      case "grocery": return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
      case "rent": return <Home className="w-4 h-4 text-purple-400" />;
      default: return <Calculator className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Intro */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10">
            <Calculator className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              🧮 Calculadora Estratégica de Divisão de Contas
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Divida contas de <strong className="text-slate-200">Água, Luz, Internet, Mercado e Aluguel</strong> de forma justa e única. Calcule cotas por <strong className="text-slate-200">dias de presença</strong>, <strong className="text-slate-200">renda proporcional</strong> ou <strong className="text-slate-200">carga de consumo</strong>, e descubra quem transfere PIX para quem em 1 clique!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copyWhatsAppSummary}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            {copiedWhatsapp ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            {copiedWhatsapp ? "Copiado!" : "📱 Copiar Resumo para WhatsApp"}
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg("")} className="text-xs text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Residents & Bills Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COL 1: Moradores da Casa (Família + Pessoas de Fora) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Moradores / Participantes ({residents.length})
            </h3>
            <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
              👨‍👩‍👧‍👦 Total: {residents.reduce((sum, r) => sum + (r.familyCount || 1), 0)} Pessoas
            </span>
          </div>

          {/* Form: Add External Resident */}
          <form onSubmit={handleAddResident} className="p-3 bg-slate-900/90 border border-indigo-500/30 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-400" /> Adicionar Pessoa / Colega de Fora
            </span>
            <input
              type="text"
              placeholder="Nome (ex: Adriano, Colega Quarto 2)..."
              value={newResidentName}
              onChange={(e) => setNewResidentName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">👨‍👩‍👧 Pessoas no Grupo</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newResidentFamilyCount}
                  onChange={(e) => setNewResidentFamilyCount(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-md shadow-indigo-600/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Incluir
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {residents.map((r) => (
              <div key={r.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">{r.name}</span>
                    {r.isExternal ? (
                      <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                        👤 Externo
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        🏠 Família
                      </span>
                    )}
                    <span className="text-[9px] font-extrabold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                      👨‍👩‍👧 {r.familyCount || 1} {r.familyCount === 1 ? "Pessoa" : "Pessoas"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveResident(r.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                    title="Remover morador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-0.5">👨‍👩‍👧 Pessoas</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={r.familyCount || 1}
                      onChange={(e) => updateResident(r.id, "familyCount", parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 bg-slate-950 border border-purple-500/30 rounded text-xs text-purple-300 font-extrabold focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-0.5">📅 Dias no Mês</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={r.daysPresent}
                      onChange={(e) => updateResident(r.id, "daysPresent", parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-0.5">⚡ Carga/Peso</label>
                    <select
                      value={r.weight}
                      onChange={(e) => updateResident(r.id, "weight", parseFloat(e.target.value))}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="1.0">Normal (1.0x)</option>
                      <option value="1.5">Com AC (1.5x)</option>
                      <option value="2.0">Alto (2.0x)</option>
                      <option value="0.5">Baixo (0.5x)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COL 2: Lista de Contas da Casa & Nova Conta Form */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Contas da Casa a Dividir ({bills.length})
            </h3>
            <span className="text-xs font-extrabold text-emerald-400">
              Total: R$ {totalExpenses.toFixed(2)}
            </span>
          </div>

          {/* Form to Add New Bill */}
          <form onSubmit={handleAddBill} className="p-3.5 bg-slate-900/90 border border-purple-500/20 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-400" /> Adicionar Nova Conta para Dividir
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Nome da Conta (ex: Luz, Água, Aluguel)..."
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor R$ (ex: 250.00)"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Quem Pagou a Conta?</label>
                <select
                  value={newBillPayer}
                  onChange={(e) => setNewBillPayer(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  {residents.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-300 mb-1">⚡ Estratégia de Divisão</label>
                <select
                  value={newBillMethod}
                  onChange={(e: any) => setNewBillMethod(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-purple-500/40 rounded-xl text-xs text-purple-300 font-bold focus:outline-none"
                >
                  <option value="family">👥 Por N° de Pessoas (Sub-grupo / Cabeças)</option>
                  <option value="days">📅 Por Dias de Presença</option>
                  <option value="equal">⚖️ Divisão Igualitária (Por Card)</option>
                  <option value="weight">⚡ Por Carga de Consumo</option>
                  <option value="income">💰 Por Renda Proporcional</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Ícone</label>
                <select
                  value={newBillIcon}
                  onChange={(e: any) => setNewBillIcon(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="power">⚡ Energia / Luz</option>
                  <option value="water">💧 Água / Saneamento</option>
                  <option value="internet">📶 Internet / Wi-Fi</option>
                  <option value="grocery">🛒 Mercado da Casa</option>
                  <option value="rent">🏠 Aluguel / Condomínio</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/30"
            >
              <Plus className="w-4 h-4" /> Incluir Conta na Divisão
            </button>
          </form>

          {/* Bills List Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Conta</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Quem Pagou</th>
                  <th className="p-3">Método Estratégico</th>
                  <th className="p-3 w-10 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bills.map((b) => {
                  const payer = residents.find(r => r.id === b.paidByUserId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                        {getIcon(b.iconType)}
                        {b.name}
                      </td>
                      <td className="p-3 font-bold text-emerald-400">R$ {b.amount.toFixed(2)}</td>
                      <td className="p-3 text-slate-300 font-medium">{payer?.name || "Desconhecido"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {b.splitMethod === "days" ? "📅 Dias de Presença" : b.splitMethod === "income" ? "💰 Renda Proporcional" : b.splitMethod === "weight" ? "⚡ Carga de Consumo" : "⚖️ Igualitário"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveBill(b.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* STRATEGIC RESULTS & MINIMAL SETTLEMENT PLAN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Individual Balances Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" /> Balanço Individual das Cotas
          </h3>

          <div className="space-y-2.5">
            {residentBalances.map((rb) => (
              <div key={rb.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{rb.name}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    rb.net >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {rb.net >= 0 ? `🟢 Recebe R$ ${rb.net.toFixed(2)}` : `🔴 Paga R$ ${Math.abs(rb.net).toFixed(2)}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                  <div>
                    <span>Cota Devida: </span>
                    <strong className="text-slate-200">R$ {rb.owed.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>Pagou Antecipado: </span>
                    <strong className="text-emerald-400">R$ {rb.paid.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Minimal Settlement Plan Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Plano de Quitação Direta via PIX
            </h3>
            <p className="text-xs text-slate-400">
              Transferências mínimas otimizadas para quitar 100% das contas entre a casa sem transações desnecessárias.
            </p>

            <div className="mt-4 space-y-2.5">
              {settlementTransfers.length === 0 ? (
                <div className="py-8 text-center text-emerald-400 font-bold text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <span>Todas as contas estão quitadas! Ninguém deve nada para ninguém.</span>
                </div>
              ) : (
                settlementTransfers.map((st, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{st.from}</span>
                      <ArrowRight className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-emerald-300">{st.to}</span>
                    </div>

                    <span className="font-extrabold text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                      R$ {st.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {onSaveToTransactions && (
            <button
              onClick={handleSaveToDatabase}
              disabled={isSavingBatch || bills.length === 0}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 mt-4"
            >
              {isSavingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              🚀 Gravar Divisão no Controle Financeiro da Família
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
