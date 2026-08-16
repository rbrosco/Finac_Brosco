"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  Users,
  UserPlus,
  Shield,
  Copy,
  Check,
  Trash2,
  Share2,
  Crown,
  UserCheck,
  Eye,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
  LogOut,
  ChevronRight
} from "lucide-react";

export default function FamilyPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Family State
  const [familyData, setFamilyData] = useState<any>(null); // { family, members, userRole, userIds }
  const [copiedCode, setCopiedCode] = useState(false);

  // Forms
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
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

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    try {
      setActionLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao criar grupo familiar.");
      } else {
        setSuccessMsg("Grupo familiar criado com sucesso!");
        setCreateName("");
        setFamilyData(data);
      }
    } catch {
      setErrorMsg("Erro de conexão ao criar grupo familiar.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setActionLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Código de convite inválido.");
      } else {
        setSuccessMsg("Você entrou no grupo familiar com sucesso!");
        setJoinCode("");
        setFamilyData(data);
      }
    } catch {
      setErrorMsg("Erro de conexão ao entrar no grupo familiar.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${memberName} do grupo familiar?`)) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/family/members/${memberId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSuccessMsg("Membro removido com sucesso.");
        loadFamilyData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Erro ao remover membro.");
      }
    } catch {
      setErrorMsg("Erro de conexão ao remover membro.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/family/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        setSuccessMsg("Função atualizada com sucesso.");
        loadFamilyData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Erro ao alterar função.");
      }
    } catch {
      setErrorMsg("Erro ao alterar função.");
    } finally {
      setActionLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (!familyData?.family?.invite_code) return;
    navigator.clipboard.writeText(familyData.family.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareWhatsApp = () => {
    if (!familyData?.family?.invite_code) return;
    const text = encodeURIComponent(
      `Olá! Estou te convidando para entrar no nosso Controle Financeiro Familiar no Finac Brosco. Use o código de convite: *${familyData.family.invite_code}* para sincronizarmos nossos lançamentos!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const isOwnerOrAdmin = familyData?.userRole === "ADMIN";

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

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-brand-400" /> Controle Financeiro Familiar
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Vincule cônjuges e membros da família para compartilhar o controle financeiro, contas e orçamentos domésticos.
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
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Carregando informações familiares...</p>
            </div>
          ) : !familyData?.family ? (
            /* NO FAMILY STATE: Create or Join */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Family Card */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-brand-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Criar Novo Grupo Familiar</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Crie um espaço de orçamento compartilhado para sua família. Você será o gestor principal e poderá convidar outros membros.
                  </p>
                </div>

                <form onSubmit={handleCreateFamily} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nome da Família / Grupo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Família Silva, Orçamento Casal"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-600/30"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Criar Grupo Familiar
                  </button>
                </form>
              </div>

              {/* Join Family Card */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                    <UserPlus className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Entrar em um Grupo Existente</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Insira o código de convite recebido pelo gestor da sua família para sincronizar seu controle financeiro.
                  </p>
                </div>

                <form onSubmit={handleJoinFamily} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Código de Convite (ex: FAM-892A4X)
                    </label>
                    <input
                      type="text"
                      placeholder="FAM-XXXXXX"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase tracking-wider focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    Vincular à Família
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* ACTIVE FAMILY DISPLAY */
            <div className="space-y-6">
              {/* Family Header Overview Card */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 shrink-0">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-white">{familyData.family.name}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        familyData.userRole === "ADMIN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}>
                        {familyData.userRole === "ADMIN" ? "Gestor Principal" : familyData.userRole === "MEMBER" ? "Membro" : "Visualizador"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>{familyData.members.length} {familyData.members.length === 1 ? "membro vinculado" : "membros vinculados"}</span>
                      <span>•</span>
                      <span>Criado em {new Date(familyData.family.created_at).toLocaleDateString("pt-BR")}</span>
                    </p>
                  </div>
                </div>

                {/* Invite Code Box */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Código de Convite</span>
                    <span className="text-sm font-mono font-bold text-brand-400 tracking-wider">{familyData.family.invite_code}</span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={copyInviteCode}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
                      title="Copiar código"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                      <span className="hidden sm:inline">{copiedCode ? "Copiado!" : "Copiar"}</span>
                    </button>

                    <button
                      onClick={shareWhatsApp}
                      className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition-colors flex items-center gap-1 text-xs font-semibold border border-emerald-500/30"
                      title="Compartilhar via WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-400" /> Membros da Família
                  </h3>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {familyData.members.map((m: any) => {
                    const isOwner = m.user_id === familyData.family.owner_id;
                    const isSelf = m.user_id === user?.id;

                    return (
                      <div key={m.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-400 shrink-0">
                            {m.user?.name ? m.user.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-slate-200">
                                {m.user?.name || "Usuário"} {isSelf && <span className="text-xs text-brand-400">(Você)</span>}
                              </h4>
                              {isOwner && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                                  <Crown className="w-3 h-3" /> Proprietário
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{m.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* Role Selector */}
                          {isOwnerOrAdmin && !isOwner && !isSelf ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none"
                            >
                              <option value="ADMIN">Gestor (Acesso Total)</option>
                              <option value="MEMBER">Membro (Edição)</option>
                              <option value="VIEWER">Visualizador (Somente Leitura)</option>
                            </select>
                          ) : (
                            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400">
                              {m.role === "ADMIN" ? "Gestor" : m.role === "MEMBER" ? "Membro" : "Visualizador"}
                            </span>
                          )}

                          {/* Remove button */}
                          {(isOwnerOrAdmin || isSelf) && (
                            <button
                              onClick={() => handleRemoveMember(m.id, m.user?.name || "Membro")}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title={isSelf ? "Sair da família" : "Remover membro"}
                            >
                              {isSelf ? <LogOut className="w-4 h-4 text-rose-400" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
