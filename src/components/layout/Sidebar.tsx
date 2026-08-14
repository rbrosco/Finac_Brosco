"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Tags,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  ShieldCheck,
  Zap
} from "lucide-react";

interface SidebarProps {
  user?: { name: string; email: string } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Transações", href: "/transactions", icon: Receipt },
    { label: "Categorias", href: "/categories", icon: Tags },
    { label: "Contas & Cartões", href: "/accounts", icon: Wallet },
    { label: "Relatórios", href: "/reports", icon: BarChart3 },
    { label: "Integrações", href: "/integrations", icon: Zap },
    { label: "Configurações", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 hidden md:flex flex-col justify-between h-screen sticky top-0 z-40">
      <div>
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              Finac <span className="text-brand-500 font-extrabold">Brosco</span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Gestão Financeira
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name || "Usuário"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair da conta"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
