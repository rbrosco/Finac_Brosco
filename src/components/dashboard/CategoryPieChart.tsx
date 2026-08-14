"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

interface CategoryData {
  name: string;
  amount: number;
  color: string;
  icon: string;
  percentage: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center min-h-[320px] text-center">
        <PieIcon className="w-12 h-12 text-slate-600 mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">Sem Despesas Registradas</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Nenhuma despesa cadastrada neste mês para gerar a distribuição por categoria.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryData;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </p>
          <p className="text-slate-300 mt-1">{formatMoney(item.amount)} ({item.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-400" /> Gastos por Categoria
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Distribuição percentual das despesas do mês</p>
        </div>
      </div>

      <div className="h-[220px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="amount"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(15,23,42,0.6)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="mt-4 space-y-2 max-h-[140px] overflow-y-auto pr-1">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-800/40">
            <div className="flex items-center gap-2 truncate">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-200 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-slate-100">{formatMoney(item.amount)}</span>
              <span className="text-slate-400 text-[11px] min-w-[32px] text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
