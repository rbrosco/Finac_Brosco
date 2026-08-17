"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import HelpTooltip from "@/components/common/HelpTooltip";
import { useTutorial } from "@/context/TutorialContext";
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
  Smartphone,
  Webhook,
  Send,
  Copy,
  Code2,
  Info,
  Play,
  QrCode
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active Tab inside Settings: 'whatsapp' | 'ai' | 'n8n' | 'general'
  const [activeTab, setActiveTab] = useState<"whatsapp" | "ai" | "n8n" | "general">("whatsapp");

  // 1. Evolution API (WhatsApp) State
  const [evolutionUrl, setEvolutionUrl] = useState("http://localhost:9002");
  const [evolutionApiKey, setEvolutionApiKey] = useState("evo_fbpzwxq9n7squlurxxwpioob");
  const [evolutionInstance, setEvolutionInstance] = useState("finac_instance");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [evolutionKeyword, setEvolutionKeyword] = useState("finac");
  const [requireKeyword, setRequireKeyword] = useState(true);
  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(true);
  const [testMessageLoading, setTestMessageLoading] = useState(false);

  // QR Code & Instance Status State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const [serverInstances, setServerInstances] = useState<any[]>([]);
  const [instanceActionLoading, setInstanceActionLoading] = useState(false);

  // Webhook Simulator State
  const [simulatedMsg, setSimulatedMsg] = useState("finac gastei 45.00 no mercado");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationOutput, setSimulationOutput] = useState<any>(null);

  const checkWhatsAppStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/evolution/instance");
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          setWhatsappStatus(data.state);
          if (data.state === "connected") {
            setQrCodeDataUrl(""); // Hide QR Code when connected
          }
        }
        if (Array.isArray(data.instances)) {
          setServerInstances(data.instances);
        }
      }
    } catch {
      // Ignore polling errors
    }
  }, []);

  const handleCreateInstanceAction = async () => {
    if (!evolutionInstance.trim()) {
      setFeedback({ type: "error", text: "Informe um nome para a instância a ser criada." });
      return;
    }
    setInstanceActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/integrations/evolution/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          evolution_api_url: evolutionUrl,
          evolution_api_key: evolutionApiKey,
          evolution_instance_name: evolutionInstance,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar instância.");

      setFeedback({ type: "success", text: data.message || `Instância '${evolutionInstance}' criada no servidor com sucesso!` });
      checkWhatsAppStatus();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Falha ao criar instância." });
    } finally {
      setInstanceActionLoading(false);
    }
  };

  const handleRestartInstanceAction = async () => {
    setInstanceActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/integrations/evolution/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restart",
          evolution_api_url: evolutionUrl,
          evolution_api_key: evolutionApiKey,
          evolution_instance_name: evolutionInstance,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao reiniciar instância.");

      setFeedback({ type: "success", text: data.message || `Instância '${evolutionInstance}' reiniciada.` });
      checkWhatsAppStatus();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Falha ao reiniciar." });
    } finally {
      setInstanceActionLoading(false);
    }
  };

  const handleDeleteServerInstanceAction = async () => {
    if (!confirm(`Tem certeza que deseja excluir a instância '${evolutionInstance}' do servidor Evolution API?`)) return;

    setInstanceActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/integrations/evolution/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          evolution_api_url: evolutionUrl,
          evolution_api_key: evolutionApiKey,
          evolution_instance_name: evolutionInstance,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir instância.");

      setFeedback({ type: "success", text: data.message || `Instância '${evolutionInstance}' excluída do servidor.` });
      setWhatsappStatus("disconnected");
      setQrCodeDataUrl("");
      checkWhatsAppStatus();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Falha ao excluir." });
    } finally {
      setInstanceActionLoading(false);
    }
  };

  const handleGenerateQrCode = async () => {
    setIsGeneratingQr(true);
    setFeedback(null);
    setQrCodeDataUrl("");

    try {
      const res = await fetch("/api/integrations/evolution/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolution_api_url: evolutionUrl,
          evolution_api_key: evolutionApiKey,
          evolution_instance_name: evolutionInstance,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao obter QR Code da Evolution API.");

      if (data.qrCodeUrl) {
        setQrCodeDataUrl(data.qrCodeUrl);
        setPairingCode(data.pairingCode || "");
        setWhatsappStatus("connecting");
        setFeedback({ type: "success", text: "QR Code gerado! Aponte a câmera do seu celular no WhatsApp para conectar." });
      } else {
        throw new Error("Não foi possível gerar a imagem do QR Code. Verifique se a instância já está aberta.");
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Erro ao gerar QR Code." });
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      const res = await fetch("/api/integrations/evolution/instance", { method: "DELETE" });
      if (res.ok) {
        setWhatsappStatus("disconnected");
        setQrCodeDataUrl("");
        setFeedback({ type: "success", text: "Instância do WhatsApp desconectada." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao desconectar WhatsApp." });
    }
  };

  // 2. AI Configuration State
  const [aiProvider, setAiProvider] = useState("lmstudio");
  const [aiBaseUrl, setAiBaseUrl] = useState("http://localhost:1234/v1");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiPrompt, setAiPrompt] = useState(
    "Você é um assistente financeiro pessoal treinado para analisar comprovantes, recibos e extratos bancários com máxima precisão."
  );
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testAiLoading, setTestAiLoading] = useState(false);

  // 3. n8n Webhook State
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("secret_finac_token_123");
  const [isN8nEnabled, setIsN8nEnabled] = useState(true);
  const [notifyOnCreated, setNotifyOnCreated] = useState(true);
  const [notifyOnDue, setNotifyOnDue] = useState(true);
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);

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

  const loadAllConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();

        // Evolution API
        setEvolutionUrl(data.evolution_api_url || "http://localhost:9002");
        setEvolutionApiKey(data.evolution_api_key || "evo_fbpzwxq9n7squlurxxwpioob");
        setEvolutionInstance(data.evolution_instance_name || "finac_instance");
        setWhatsappNumber(data.whatsapp_number || "");
        setEvolutionKeyword(data.evolution_keyword || "finac");
        setRequireKeyword(data.require_keyword ?? true);
        setIsWhatsappEnabled(data.is_whatsapp_enabled ?? true);

        // AI
        const prov = data.ai_provider || "lmstudio";
        setAiProvider(prov);
        setAiBaseUrl(data.ai_base_url || (prov === "lmstudio" ? "http://localhost:1234/v1" : prov === "ollama" ? "http://localhost:11434" : prov === "groq" ? "https://api.groq.com/openai/v1" : prov === "deepseek" ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"));
        setAiApiKey(data.ai_api_key || "");
        setAiModel(data.ai_model || "");
        if (data.ai_prompt_instructions) setAiPrompt(data.ai_prompt_instructions);
        setIsAiEnabled(data.is_ai_enabled ?? true);

        // n8n
        setN8nWebhookUrl(data.n8n_webhook_url || "");
        setWebhookSecret(data.webhook_secret || "secret_finac_token_123");
        setIsN8nEnabled(data.is_n8n_enabled ?? true);
        setNotifyOnCreated(data.notify_on_created ?? true);
        setNotifyOnDue(data.notify_on_due ?? true);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadAllConfig();
    checkWhatsAppStatus();
  }, [loadUserData, loadAllConfig, checkWhatsAppStatus]);

  // Status Polling when QR Code is visible
  useEffect(() => {
    if (!qrCodeDataUrl) return;
    const interval = setInterval(() => {
      checkWhatsAppStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, [qrCodeDataUrl, checkWhatsAppStatus]);

  const handleSaveAllConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        evolution_api_url: evolutionUrl,
        evolution_api_key: evolutionApiKey,
        evolution_instance_name: evolutionInstance,
        whatsapp_number: whatsappNumber,
        evolution_keyword: evolutionKeyword,
        require_keyword: requireKeyword,
        is_whatsapp_enabled: isWhatsappEnabled,

        ai_provider: aiProvider,
        ai_base_url: aiBaseUrl,
        ai_api_key: aiApiKey,
        ai_model: aiModel,
        ai_prompt_instructions: aiPrompt,
        is_ai_enabled: isAiEnabled,

        n8n_webhook_url: n8nWebhookUrl,
        webhook_secret: webhookSecret,
        is_n8n_enabled: isN8nEnabled,
        notify_on_created: notifyOnCreated,
        notify_on_due: notifyOnDue,
      };

      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar configurações.");

      setFeedback({ type: "success", text: "Todas as configurações salvas com sucesso!" });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Erro ao salvar configurações." });
    } finally {
      setSaving(false);
    }
  };

  // Test WhatsApp Envio
  const handleTestWhatsApp = async () => {
    if (!whatsappNumber) {
      setFeedback({ type: "error", text: "Informe seu número de WhatsApp com DDD para o teste." });
      return;
    }

    setTestMessageLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/integrations/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetNumber: whatsappNumber,
          evolution_api_url: evolutionUrl,
          evolution_api_key: evolutionApiKey,
          evolution_instance_name: evolutionInstance,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao testar envio de mensagem.");

      setFeedback({ type: "success", text: data.message || "Mensagem enviada com sucesso no WhatsApp!" });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Falha no envio de teste." });
    } finally {
      setTestMessageLoading(false);
    }
  };

  // Webhook Simulator
  const handleSimulateWebhook = async () => {
    if (!simulatedMsg.trim()) return;

    setIsSimulating(true);
    setSimulationOutput(null);

    try {
      const res = await fetch("/api/integrations/test-evolution-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: simulatedMsg }),
      });

      const data = await res.json();
      setSimulationOutput(data);
    } catch (err: any) {
      setSimulationOutput({ error: err.message || "Erro na simulação" });
    } finally {
      setIsSimulating(false);
    }
  };

  // Fetch AI Models
  const handleFetchModels = async (providerOverride?: string, urlOverride?: string, keyOverride?: string) => {
    setFetchingModels(true);
    setFeedback(null);

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
        setFeedback({
          type: "success",
          text: `${data.models.length} modelos encontrados com sucesso no provedor!`
        });
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Falha ao carregar a lista de modelos."
        });
      }
    } catch {
      setFeedback({
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

    if (newProvider === "lmstudio" || newProvider === "ollama") {
      setTimeout(() => handleFetchModels(newProvider, defaultUrl, aiApiKey), 300);
    }
  };

  const handleTestAiConnection = async () => {
    setTestAiLoading(true);
    setFeedback(null);

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
        setFeedback({
          type: "success",
          text: data.message || "Conexão com o provedor de IA efetuada com sucesso!"
        });
      } else {
        setFeedback({
          type: "error",
          text: data.message || "Falha ao validar a chave da API de IA."
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erro de comunicação ao testar o provedor de IA."
      });
    } finally {
      setTestAiLoading(false);
    }
  };

  // Test n8n Webhook
  const handleTestN8n = async () => {
    if (!n8nWebhookUrl) {
      setFeedback({ type: "error", text: "Informe a URL do Webhook do n8n para testar." });
      return;
    }

    setTestWebhookLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/integrations/test-n8n", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao testar n8n Webhook.");

      setFeedback({ type: "success", text: data.message || "Webhook n8n disparado com sucesso!" });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Falha no teste n8n." });
    } finally {
      setTestWebhookLoading(false);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado para a área de transferência!");
  };

  const domainHost = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

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

        <main className="flex-1 p-4 md:p-6 space-y-6 w-full">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-brand-400" /> Configurações & Central de Integrações
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie a integração com Evolution API (WhatsApp), Inteligência Artificial, Webhooks n8n e seu perfil
            </p>
          </div>

          {/* Global Feedback Banner */}
          {feedback && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-2 border shadow-lg ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}>
              {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {feedback.text}
            </div>
          )}

          {/* Settings Sub-Tab Navigation */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl w-fit flex-wrap">
            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "whatsapp" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-4 h-4" /> Evolution API (WhatsApp)
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "ai" ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bot className="w-4 h-4" /> Inteligência Artificial
            </button>

            <button
              onClick={() => setActiveTab("n8n")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "n8n" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Webhook className="w-4 h-4" /> Webhooks n8n
            </button>

            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "general" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="w-4 h-4" /> Perfil & Tutoriais
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Carregando configurações...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveAllConfig} className="space-y-6">
              {/* TAB 1: EVOLUTION API (WHATSAPP) */}
              {activeTab === "whatsapp" && (
                <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                          Evolution API (Integração WhatsApp)
                          <HelpTooltip
                            id="evolution_settings_help"
                            title="Evolution API (WhatsApp)"
                            description="Conecte seu WhatsApp para registrar despesas e consultar saldos com a palavra-chave configurada."
                            actionHint="Clique em 'Gerar QR Code Agora' para ler o QR Code direto no Finac Brosco!"
                          />
                        </h2>
                        <p className="text-xs text-slate-400">Envio de alertas e lançamento por texto no WhatsApp com a palavra-chave '{evolutionKeyword}'</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isWhatsappEnabled}
                        onChange={(e) => setIsWhatsappEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* FAST QR CODE CONNECTION CARD */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            Conexão Automática por QR Code
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              whatsappStatus === "connected" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse" : whatsappStatus === "connecting" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}>
                              {whatsappStatus === "connected" ? "Conectado ✅" : whatsappStatus === "connecting" ? "Aguardando Leitura..." : "Desconectado 🔴"}
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Gere o QR Code aqui mesmo e aponte a câmera do WhatsApp no seu celular!
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateQrCode}
                          disabled={isGeneratingQr}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                        >
                          {isGeneratingQr ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                          {qrCodeDataUrl ? "Atualizar QR Code" : "Gerar QR Code Agora"}
                        </button>

                        {whatsappStatus === "connected" && (
                          <button
                            type="button"
                            onClick={handleDisconnectWhatsApp}
                            className="px-3.5 py-2 bg-rose-950/80 border border-rose-800 hover:bg-rose-900 text-rose-300 text-xs font-semibold rounded-xl transition-all"
                          >
                            Desconectar WhatsApp
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Display QR Code */}
                    {qrCodeDataUrl && (
                      <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/40 text-center space-y-3 max-w-sm mx-auto animate-in zoom-in duration-200">
                        <div className="bg-white p-3 rounded-xl inline-block shadow-2xl">
                          <img
                            src={qrCodeDataUrl}
                            alt="QR Code WhatsApp"
                            className="w-56 h-56 object-contain mx-auto"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Abra o WhatsApp no seu celular
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Acesse <strong>Aparelhos Conectados</strong> ➔ <strong>Conectar um aparelho</strong> e aponte a câmera para a imagem acima.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Advanced / Technical Server Settings Collapsible */}
                  <details className="group rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 transition-all">
                    <summary className="font-semibold text-xs text-slate-300 cursor-pointer flex items-center justify-between select-none">
                      <span className="flex items-center gap-1.5 text-slate-400 group-open:text-emerald-400">
                        <Settings className="w-4 h-4" /> Configurações Avançadas do Servidor & Gerenciador de Instâncias
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-md font-mono">
                        URL, API Key e Gerenciamento Manual
                      </span>
                    </summary>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-3 border-t border-slate-800/60">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">URL Base da Evolution API</label>
                        <input
                          type="text"
                          placeholder="http://localhost:9002"
                          value={evolutionUrl}
                          onChange={(e) => setEvolutionUrl(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Evolution API Key (`apikey`)</label>
                        <input
                          type="text"
                          placeholder="evo_fbpzwxq9n7squlurxxwpioob"
                          value={evolutionApiKey}
                          onChange={(e) => setEvolutionApiKey(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-emerald-300">
                            Nome da Instância (ex: Rogger ou finac_instance)
                          </label>
                          {serverInstances.length > 0 && (
                            <span className="text-[11px] text-slate-400">
                              {serverInstances.length} instância(s) encontrada(s) no servidor
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Rogger"
                            value={evolutionInstance}
                            onChange={(e) => setEvolutionInstance(e.target.value)}
                            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-slate-100 text-xs font-bold focus:outline-none focus:border-emerald-500"
                          />

                          <button
                            type="button"
                            onClick={handleCreateInstanceAction}
                            disabled={instanceActionLoading}
                            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
                            title="Criar Nova Instância no Servidor Evolution API"
                          >
                            {instanceActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Criar Instância
                          </button>

                          <button
                            type="button"
                            onClick={handleRestartInstanceAction}
                            disabled={instanceActionLoading}
                            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shrink-0"
                            title="Reiniciar Instância"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                          </button>

                          <button
                            type="button"
                            onClick={handleDeleteServerInstanceAction}
                            disabled={instanceActionLoading}
                            className="px-3 py-2.5 bg-rose-950/80 border border-rose-800 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shrink-0"
                            title="Excluir Instância do Servidor"
                          >
                            Excluir
                          </button>
                        </div>

                        {/* Detected Server Instances list */}
                        {serverInstances.length > 0 && (
                          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                            <span>Instâncias existentes no servidor:</span>
                            {serverInstances.map((instObj: any, idx: number) => {
                              const name = typeof instObj === "string" ? instObj : (instObj.name || instObj.instanceName || instObj.instance?.instanceName || instObj.instance?.name);
                              if (!name) return null;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setEvolutionInstance(name)}
                                  className={`px-2.5 py-0.5 rounded-md border font-mono font-bold text-[11px] transition-all ${
                                    evolutionInstance === name
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                      : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                                  }`}
                                >
                                  {name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </details>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Seu Número de WhatsApp (com DDD)</label>
                      <input
                        type="text"
                        placeholder="5511999999999"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Trigger Keyword Configuration */}
                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          Palavra-Chave de Gatilho (Trigger Keyword)
                          <HelpTooltip
                            id="evolution_keyword_help"
                            title="Palavra-Chave no WhatsApp"
                            description="Sua mensagem só será processada como comando se iniciar ou contiver essa palavra-chave (ex: 'finac gastei 50')."
                            actionHint="Digite 'finac' ou personalize a palavra desejada."
                          />
                        </label>

                        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                          <span>Exigir Gatilho no Início</span>
                          <input
                            type="checkbox"
                            checked={requireKeyword}
                            onChange={(e) => setRequireKeyword(e.target.checked)}
                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                          />
                        </label>
                      </div>

                      <input
                        type="text"
                        placeholder="finac"
                        value={evolutionKeyword}
                        onChange={(e) => setEvolutionKeyword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 max-w-xs"
                      />
                    </div>
                  </div>

                  {/* Webhook Endpoint documentation */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Webhook da Evolution API para Finac Brosco
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${domainHost}/api/webhooks/evolution`)}
                        className="text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Copy className="w-3 h-3" /> Copiar URL
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cadastre este webhook no painel da Evolution API para receber mensagens do WhatsApp e registrar gastos automaticamente (ex: *"{evolutionKeyword} gastei 50 no mercado"*).
                    </p>
                    <code className="block p-2 bg-slate-950 rounded-lg text-emerald-300 text-[11px] truncate">
                      {domainHost}/api/webhooks/evolution
                    </code>
                  </div>

                  {/* WhatsApp Webhook Simulator */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" /> Simulador de Webhook WhatsApp (Testar Palavra-Chave '{evolutionKeyword}')
                      </h3>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">
                        Ambiente de Testes Integrado
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Digite uma mensagem de teste com a palavra-chave <strong className="text-emerald-300">{evolutionKeyword}</strong> para simular o recebimento do WhatsApp sem precisar de um servidor ativo:
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={simulatedMsg}
                        onChange={(e) => setSimulatedMsg(e.target.value)}
                        placeholder={`ex: ${evolutionKeyword} gastei 45.00 no mercado`}
                        className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSimulateWebhook}
                        disabled={isSimulating}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                      >
                        {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Testar Webhook
                      </button>
                    </div>

                    {/* Preset Buttons */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                      <span className="text-slate-400">Exemplos:</span>
                      <button
                        type="button"
                        onClick={() => setSimulatedMsg(`${evolutionKeyword} gastei 50.00 no mercado`)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-slate-300 hover:text-white"
                      >
                        "{evolutionKeyword} gastei 50 no mercado"
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulatedMsg(`${evolutionKeyword} resumo`)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-slate-300 hover:text-white"
                      >
                        "{evolutionKeyword} resumo"
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulatedMsg(`${evolutionKeyword} ajuda`)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-slate-300 hover:text-white"
                      >
                        "{evolutionKeyword} ajuda"
                      </button>
                    </div>

                    {/* Output Display */}
                    {simulationOutput && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1">
                          <span className="font-bold text-slate-300">Resposta Simulada do Sistema:</span>
                          <span className="text-emerald-400 font-mono font-bold">Status {simulationOutput.status || 200}</span>
                        </div>

                        {simulationOutput.simulatedResult?.reply ? (
                          <pre className="text-emerald-300 whitespace-pre-wrap font-sans leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                            {simulationOutput.simulatedResult.reply}
                          </pre>
                        ) : (
                          <pre className="text-amber-300 font-mono text-[11px] bg-slate-900/60 p-2 rounded-lg">
                            {JSON.stringify(simulationOutput.simulatedResult || simulationOutput, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleTestWhatsApp}
                      disabled={testMessageLoading}
                      className="px-4 py-2 bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm"
                    >
                      {testMessageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Testar Envio no WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveAllConfig()}
                      disabled={saving}
                      className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Configurações
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: AI AGENT CONFIGURATION */}
              {activeTab === "ai" && (
                <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800/80 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-brand-400" /> Configurações do Agente IA (LM Studio, OpenAI & Locais)
                        <HelpTooltip
                          id="ai_settings_help"
                          title="Configuração de Provedores de IA"
                          description="Escolha seu provedor preferido (LM Studio local, Gemini, OpenAI, Groq, DeepSeek ou Ollama) e configure a chave de API."
                          actionHint="Utilize 'LM Studio' para rodar 100% offline e sem custos!"
                        />
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Configure a URL do servidor (LM Studio/Ollama/OpenAI), chave de API e carregue a lista de modelos ativos.
                      </p>
                    </div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleTestAiConnection}
                      disabled={testAiLoading}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      {testAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400" />}
                      Testar Conexão com IA
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveAllConfig()}
                      disabled={saving}
                      className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Configurações da IA
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: N8N WEBHOOKS */}
              {activeTab === "n8n" && (
                <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Webhook className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                          n8n Webhook Integration (Saída & Entrada)
                          <HelpTooltip
                            id="n8n_settings_help"
                            title="Automações com n8n"
                            description="Conecte fluxos de automação do n8n para enviar despesas ou receber notificações de vencimento."
                            actionHint="Configure o Secret do Webhook de Entrada para garantir segurança."
                          />
                        </h2>
                        <p className="text-xs text-slate-400">Disparo de eventos e recepção de chamadas de automação n8n</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isN8nEnabled}
                        onChange={(e) => setIsN8nEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">URL do Webhook n8n (Saída)</label>
                      <input
                        type="text"
                        placeholder="http://127.0.0.1:5678/webhook/..."
                        value={n8nWebhookUrl}
                        onChange={(e) => setN8nWebhookUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Secret do Webhook de Entrada</label>
                      <input
                        type="text"
                        placeholder="secret_finac_token_123"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-purple-400 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4" /> Webhook de Entrada para n8n ➡️ Finac Brosco
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${domainHost}/api/webhooks/n8n`)}
                        className="text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Copy className="w-3 h-3" /> Copiar URL
                      </button>
                    </div>

                    <p className="text-slate-400 text-[11px]">
                      No n8n, utilize um nó <b>HTTP Request (POST)</b> apontando para o endpoint abaixo para cadastrar lançamentos via automação:
                    </p>

                    <code className="block p-2 bg-slate-950 rounded-lg text-purple-300 text-[11px] truncate">
                      {domainHost}/api/webhooks/n8n
                    </code>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleTestN8n}
                      disabled={testWebhookLoading}
                      className="px-4 py-2 bg-purple-950 border border-purple-800 hover:bg-purple-900 text-purple-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm"
                    >
                      {testWebhookLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Testar Disparo Webhook n8n
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveAllConfig()}
                      disabled={saving}
                      className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Configurações
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: GENERAL & PROFILE */}
              {activeTab === "general" && (
                <div className="space-y-6">
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
                        type="button"
                        onClick={handleSeedDemoData}
                        disabled={loading}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30"
                      >
                        <Sparkles className="w-4 h-4" />
                        {loading ? "Gerando..." : "Gerar Dados Demo Agora"}
                      </button>
                    </div>
                  </div>

                  {/* Tutorial & Help Markers Control Card */}
                  <TutorialSettingsSection />
                </div>
              )}
            </form>
          )}
        </main>
      </div>
      <BottomNav user={user} />
    </div>
  );
}

function TutorialSettingsSection() {
  const { openTutorial, resetHelpMarkers } = useTutorial();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    resetHelpMarkers();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
      <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-400" /> Tutorial & Experiência de Uso
      </h2>
      <p className="text-xs text-slate-400 leading-relaxed">
        Gerencie os tutoriais guiados da plataforma e restaure os marcadores explicativos <strong>(?)</strong> ocultos após a conclusão de ações.
      </p>

      {resetSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Marcadores de ajuda (?) restaurados com sucesso!
        </div>
      )}

      <div className="flex items-center gap-3 pt-1 flex-wrap">
        <button
          type="button"
          onClick={openTutorial}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
        >
          <Sparkles className="w-4 h-4" /> Abrir Tutorial Guiativo (?)
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-purple-400" /> Restaurar Marcadores de Ajuda (?)
        </button>
      </div>
    </div>
  );
}
