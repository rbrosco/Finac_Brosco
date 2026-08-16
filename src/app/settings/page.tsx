"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  Settings,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Bot,
  Key,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Cpu,
  Terminal,
  Zap,
  RefreshCw,
  Globe,
  ListFilter
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [seedMessage, setSeedMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // AI Configuration State
  const [aiProvider, setAiProvider] = useState("lmstudio");
  const [aiBaseUrl, setAiBaseUrl] = useState("http://localhost:1234/v1");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiPrompt, setAiPrompt] = useState(
    "Você é um assistente financeiro pessoal treinado para analisar comprovantes, recibos e extratos bancários com máxima precisão."
  );
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  // Available models dynamically fetched from provider
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  const [savingAi, setSavingAi] = useState(false);
  const [testAiLoading, setTestAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const loadAiConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        const prov = data.ai_provider || "lmstudio";
        setAiProvider(prov);
        setAiBaseUrl(data.ai_base_url || (prov === "lmstudio" ? "http://localhost:1234/v1" : prov === "ollama" ? "http://localhost:11434" : prov === "groq" ? "https://api.groq.com/openai/v1" : prov === "deepseek" ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"));
        setAiApiKey(data.ai_api_key || "");
        setAiModel(data.ai_model || "");
        if (data.ai_prompt_instructions) setAiPrompt(data.ai_prompt_instructions);
        setIsAiEnabled(data.is_ai_enabled ?? true);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadAiConfig();
  }, [loadUserData, loadAiConfig]);

  // Fetch available models from selected provider & URL
  const handleFetchModels = async (providerOverride?: string, urlOverride?: string, keyOverride?: string) => {
    setFetchingModels(true);
    setAiFeedback(null);

    const prov = providerOverride || aiProvider;
    const url = urlOverride || aiBaseUrl;
    const key = keyOverride !== undefined ? keyOverride : aiApiKey;

    try {
      const res = await fetch("/api/agent/fetch-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: prov, baseUrl: url, apiKey: key })
      });

      const data = await res.json();
      if (res.ok && data.models) {
        setAvailableModels(data.models);
        if (data.models.length > 0 && (!aiModel || !data.models.includes(aiModel))) {
          setAiModel(data.models[0]);
        }
        setAiFeedback({
          type: "success",
          text: `${data.models.length} modelos encontrados com sucesso no provedor!`
        });
      } else {
        setAiFeedback({
          type: "error",
          text: data.error || "Falha ao carregar a lista de modelos."
        });
      }
    } catch {
      setAiFeedback({
        type: "error",
        text: "Erro ao conectar com o servidor para listar modelos."
      });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setAiProvider(newProvider);
    let defaultUrl = "https://api.openai.com/v1";
    if (newProvider === "lmstudio") defaultUrl = "http://localhost:1234/v1";
    else if (newProvider === "ollama") defaultUrl = "http://localhost:11434";
    else if (newProvider === "groq") defaultUrl = "https://api.groq.com/openai/v1";
    else if (newProvider === "deepseek") defaultUrl = "https://api.deepseek.com/v1";

    setAiBaseUrl(defaultUrl);
    setAvailableModels([]);

    // Auto-fetch models for local providers like LM Studio and Ollama
    if (newProvider === "lmstudio" || newProvider === "ollama") {
      setTimeout(() => handleFetchModels(newProvider, defaultUrl, aiApiKey), 300);
    }
  };

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAi(true);
    setAiFeedback(null);

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_provider: aiProvider,
          ai_base_url: aiBaseUrl,
          ai_api_key: aiApiKey,
          ai_model: aiModel,
          ai_prompt_instructions: aiPrompt,
          is_ai_enabled: isAiEnabled
        })
      });

      if (res.ok) {
        setAiFeedback({
          type: "success",
          text: "Configurações do Agente IA salvas com sucesso!"
        });
      } else {
        const data = await res.json();
        setAiFeedback({
          type: "error",
          text: data.error || "Erro ao salvar configurações da IA."
        });
      }
    } catch {
      setAiFeedback({
        type: "error",
        text: "Erro de conexão ao salvar configurações da IA."
      });
    } finally {
      setSavingAi(false);
    }
  };

  const handleTestAiConnection = async () => {
    setTestAiLoading(true);
    setAiFeedback(null);

    try {
      const res = await fetch("/api/agent/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          baseUrl: aiBaseUrl,
          apiKey: aiApiKey,
          model: aiModel
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAiFeedback({
          type: "success",
          text: data.message || "Conexão com o provedor de IA efetuada com sucesso!"
        });
      } else {
        setAiFeedback({
          type: "error",
          text: data.message || "Falha ao validar a chave da API de IA."
        });
      }
    } catch {
      setAiFeedback({
        type: "error",
        text: "Erro de comunicação ao testar o provedor de IA."
      });
    } finally {
      setTestAiLoading(false);
    }
  };

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
              Gerencie seu perfil, chaves de inteligência artificial e carregamento de modelos LM Studio
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

          {/* AI AGENT CONFIGURATION CARD WITH LM STUDIO & DYNAMIC MODEL FETCH */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-brand-400" /> Configurações do Agente IA (LM Studio, OpenAI & Locais)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure a URL do servidor (LM Studio/Ollama/OpenAI), chave de API e carregue a lista de modelos ativos.
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  {isAiEnabled ? "IA Ativada" : "IA Desativada"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAiEnabled(!isAiEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isAiEnabled ? "bg-brand-600" : "bg-slate-800"}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isAiEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>

            {aiFeedback && (
              <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                aiFeedback.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}>
                {aiFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{aiFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveAiConfig} className="space-y-4">
              {/* Row 1: Provider & Base URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* AI Provider */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-brand-400" /> Provedor de Inteligência Artificial
                  </label>
                  <select
                    value={aiProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="lmstudio">LM Studio (Servidor Local/Remoto)</option>
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
                    <option value="groq">Groq (Llama 3.3 70B Fast Vision)</option>
                    <option value="deepseek">DeepSeek (DeepSeek V3 / R1)</option>
                    <option value="ollama">Ollama (Servidor Local)</option>
                  </select>
                </div>

                {/* API Base URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" /> URL Base da API / Servidor
                  </label>
                  <input
                    type="text"
                    value={aiBaseUrl}
                    onChange={(e) => setAiBaseUrl(e.target.value)}
                    placeholder="http://localhost:1234/v1"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: API Key & Dynamic Models Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* API Key Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" /> Chave de API ({aiProvider.toUpperCase()})
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder={
                        aiProvider === "lmstudio" ? "lm-studio (Opcional)" :
                        aiProvider === "openai" ? "sk-..." :
                        aiProvider === "gemini" ? "AIzaSy..." :
                        aiProvider === "groq" ? "gsk_..." : "Cole aqui sua Chave de API"
                      }
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* AI Model Selection with Fetch Button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-purple-400" /> Modelo Escolhido
                    </label>

                    <button
                      type="button"
                      onClick={() => handleFetchModels()}
                      disabled={fetchingModels}
                      className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20"
                    >
                      {fetchingModels ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Carregar Lista de Modelos
                    </button>
                  </div>

                  {availableModels.length > 0 ? (
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono font-semibold"
                    >
                      {availableModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="ex: local-model, gpt-4o-mini"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  )}
                </div>
              </div>

              {/* System Instructions / Prompt */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instruções Personalizadas do Agente (System Prompt)
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingAi}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
                >
                  {savingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Configurações da IA
                </button>

                <button
                  type="button"
                  onClick={handleTestAiConnection}
                  disabled={testAiLoading}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  {testAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400" />}
                  Testar Conexão com IA
                </button>
              </div>
            </form>
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
