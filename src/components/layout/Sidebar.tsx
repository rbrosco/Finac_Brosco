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
  Zap,
  Users,
  Bot,
  Calculator,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  PiggyBank
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useTutorial } from "@/context/TutorialContext";

interface SidebarProps {
  user?: { name: string; email: string } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { openTutorial } = useTutorial();

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
    { label: "Caixinha", href: "/caixinha", icon: PiggyBank },
    { label: "Divisão de Contas", href: "/split-calculator", icon: Calculator },
    { label: "Agente IA", href: "/agent", icon: Bot },
    { label: "Categorias", href: "/categories", icon: Tags },
    { label: "Contas & Cartões", href: "/accounts", icon: Wallet },
    { label: "Relatórios", href: "/reports", icon: BarChart3 },
    { label: "Controle Familiar", href: "/family", icon: Users },
    { label: "Configurações", href: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={`glass-panel border-r border-slate-800/80 hidden md:flex flex-col justify-between h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Brand Header & Toggle */}
        <div
          className={`p-4 border-b border-slate-800/80 flex items-center ${
            isCollapsed ? "justify-center flex-col gap-3" : "justify-between gap-3 p-5"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1">
                  Finac <span className="text-brand-500 font-extrabold">Brosco</span>
                </h1>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Gestão Financeira
                </p>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl transition-colors shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-brand-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`relative group flex items-center rounded-xl font-medium text-sm transition-all duration-200 ${
                  isCollapsed
                    ? "justify-center p-3"
                    : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Floating Tooltip when Collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-slate-100 text-xs font-semibold rounded-lg shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Tutorial Trigger Button */}
          <button
            onClick={openTutorial}
            title={isCollapsed ? "Tutorial & Guia (?)" : undefined}
            className={`w-full relative group flex items-center rounded-xl font-semibold text-xs transition-all duration-200 bg-brand-950/60 hover:bg-brand-900 border border-brand-800/60 text-brand-300 ${
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            }`}
          >
            <HelpCircle className="w-5 h-5 shrink-0 text-brand-400 animate-pulse" />
            {!isCollapsed && <span className="truncate">(?) Tutorial & Guia</span>}

            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-slate-100 text-xs font-semibold rounded-lg shadow-xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                Tutorial & Guia (?)
              </div>
            )}
          </button>
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/80">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 py-1">
            <div
              title={user?.name || "Usuário"}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center font-bold text-white text-sm shadow-md"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <button
              onClick={handleLogout}
              title="Sair da conta"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="truncate min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name || "Usuário"}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair da conta"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
