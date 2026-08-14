"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  Webhook,
  MessageSquare,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Zap,
  Code2,
  Info,
  Smartphone
} from "lucide-react";

export default function IntegrationsPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMessageLoading, setTestMessageLoading] = useState(false);
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form Fields
  const [evolutionUrl, setEvolutionUrl] = useState("http://localhost:9002");
  const [evolutionApiKey, setEvolutionApiKey] = useState("evo_fbpzwxq9n7squlurxxwpioob");
  const [evolutionInstance, setEvolutionInstance] = useState("finac_instance");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("secret_finac_token_123");

  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(true);
  const [isN8nEnabled, setIsN8nEnabled] = useState(true);
  const [notifyOnCreated, setNotifyOnCreated] = useState(true);
  const [notifyOnDue, setNotifyOnDue] = useState(true);

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

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        setEvolutionUrl(data.evolution_api_url || "http://localhost:9002");
        setEvolutionApiKey(data.evolution_api_key || "evo_fbpzwxq9n7squlurxxwpioob");
        setEvolutionInstance(data.evolution_instance_name || "finac_instance");
        setWhatsappNumber(data.whatsapp_number || "");
        setN8nWebhookUrl(data.n8n_webhook_url || "");
        setWebhookSecret(data.webhook_secret || "secret_finac_token_123");
        setIsWhatsappEnabled(data.is_whatsapp_enabled ?? true);
        setIsN8nEnabled(data.is_n8n_enabled ?? true);
        setNotifyOnCreated(data.notify_on_created ?? true);
        setNotifyOnDue(data.notify_on_due ?? true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadConfig();
  }, [loadUserData, loadConfig]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        evolution_api_url: evolutionUrl,
        evolution_api_key: evolutionApiKey,
        evolution_instance_name: evolutionInstance,
        whatsapp_number: whatsappNumber,
        n8n_webhook_url: n8nWebhookUrl,
        webhook_secret: webhookSecret,
        is_whatsapp_enabled: isWhatsappEnabled,
        is_n8n_enabled: isN8nEnabled,
        notify_on_created: notifyOnCreated,
        notify_on_due: notifyOnDue,
      };

      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar configurações");

      setFeedback({ type: "success", text: "Configurações de integração salvas com sucesso!" });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  };

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
        body: JSON.stringify({ targetNumber: whatsappNumber }),
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

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Zap className="w-7 h-7 text-emerald-400" /> Central de Integrações (Evolution & n8n)
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Conecte seu sistema financeiro com a Evolution API (WhatsApp) e automações do n8n via Webhooks
              </p>
            </div>
          </div>

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

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Carregando configurações de integração...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* 1. Evolution API (WhatsApp) */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-100">Evolution API (Integração WhatsApp)</h2>
                      <p className="text-xs text-slate-400">Envio de alertas e lançamento por texto no WhatsApp</p>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nome da Instância</label>
                    <input
                      type="text"
                      placeholder="finac_instance"
                      value={evolutionInstance}
                      onChange={(e) => setEvolutionInstance(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

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
                </div>

                {/* WhatsApp Webhook Endpoint Info */}
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
                    Cadastre este webhook no painel da Evolution API para receber mensagens de WhatsApp e registrar gastos automaticamente via texto natural (ex: *"Gastei 50 no mercado"*).
                  </p>
                  <code className="block p-2 bg-slate-950 rounded-lg text-emerald-300 text-[11px] truncate">
                    {domainHost}/api/webhooks/evolution
                  </code>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    disabled={testMessageLoading}
                    className="px-4 py-2 bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  >
                    {testMessageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Testar Envio de WhatsApp
                  </button>
                </div>
              </div>

              {/* 2. n8n Webhook Integration */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-100">n8n Webhook Integration (Saída & Entrada)</h2>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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

                {/* Inbound n8n Webhook Documentation */}
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

                  <div className="pt-2">
                    <p className="text-slate-300 font-semibold mb-1 text-[11px]">Exemplo de Body JSON no n8n:</p>
                    <pre className="p-3 bg-slate-950 rounded-xl text-slate-300 font-mono text-[11px] overflow-x-auto">
{`{
  "secret": "${webhookSecret}",
  "user_email": "${user?.email || 'seu@email.com'}",
  "action": "create_transaction",
  "title": "Supermercado Semanal",
  "amount": 250.00,
  "type": "variable_expense",
  "category": "Alimentação",
  "status": "paid"
}`}
                    </pre>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleTestN8n}
                    disabled={testWebhookLoading}
                    className="px-4 py-2 bg-purple-950 border border-purple-800 hover:bg-purple-900 text-purple-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  >
                    {testWebhookLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Testar Disparo Webhook n8n
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Configurações de Integração
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
