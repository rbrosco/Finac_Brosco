"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { BarChart3 } from "lucide-react";

interface MonthlyComparisonData {
  month: string;
  receitas: number;
  despesasFixas: number;
  gastosVariaveis: number;
  totalDespesas: number;
}

interface MonthlyBarChartProps {
  data: MonthlyComparisonData[];
}

export default function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val || 0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-100 uppercase tracking-wider">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center justify-between gap-4" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-semibold">{formatMoney(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" /> Evolução Financeira (Últimos 6 Meses)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Comparativo de Receitas vs Despesas Fixas vs Gastos Variáveis</p>
        </div>

        {/* Legend Pills */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-purple-500" />
            <span className="text-slate-300">Fixas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500" />
            <span className="text-slate-300">Variáveis</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `R$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="despesasFixas" name="Despesas Fixas" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="gastosVariaveis" name="Gastos Variáveis" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
