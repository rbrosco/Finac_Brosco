"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  Bot,
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  Send,
  FileSpreadsheet,
  ScanLine,
  Check,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Tag,
  Calendar,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw
} from "lucide-react";

export default function AgentPage() {
  const router = useRouter();
  const now = new Date();
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'receipt' | 'statement' | 'chat'
  const [activeTab, setActiveTab] = useState<"receipt" | "statement" | "chat">("receipt");

  // Tab 1: Receipt State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptText, setReceiptText] = useState("");
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [analyzedReceipt, setAnalyzedReceipt] = useState<any>(null);

  // Form override for receipt
  const [recTitle, setRecTitle] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recType, setRecType] = useState<"income" | "fixed_expense" | "variable_expense">("variable_expense");
  const [recCategory, setRecCategory] = useState("");
  const [recAccount, setRecAccount] = useState("");
  const [recDueDate, setRecDueDate] = useState(new Date().toISOString().split("T")[0]);

  // Tab 2: Statement State
  const [statementText, setStatementText] = useState("");
  const [isAnalyzingStatement, setIsAnalyzingStatement] = useState(false);
  const [statementItems, setStatementItems] = useState<any[]>([]);

  // Tab 3: Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: "welcome-1",
      sender: "agent",
      text: "Olá! Sou seu Agente IA Financeiro. Você pode colar o texto de um comprovante PIX, enviar a foto de uma nota fiscal ou me dizer o que comprou!",
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatThinking, setIsChatThinking] = useState(false);

  // Common UI State
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const loadCategoriesAndAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, accRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/accounts")
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadCategoriesAndAccounts();
  }, [loadUserData, loadCategoriesAndAccounts]);

  // Handle Receipt Upload / Text Analysis
  const handleAnalyzeReceipt = async (contentStr?: string, filename?: string, fileDataBase64?: string) => {
    const textToAnalyze = contentStr !== undefined ? contentStr : receiptText;

    try {
      setIsAnalyzingReceipt(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch("/api/agent/analyze-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToAnalyze || "",
          fileData: fileDataBase64 || receiptPreviewUrl || "",
          fileName: filename || receiptFile?.name || ""
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao analisar o comprovante.");
      } else {
        const resObj = data.result;
        setAnalyzedReceipt(resObj);
        setRecTitle(resObj.title || "Comprovante");
        setRecAmount(String(resObj.amount || ""));
        setRecType(resObj.type || "variable_expense");
        setRecDueDate(resObj.due_date || new Date().toISOString().split("T")[0]);
        setRecCategory(resObj.category_id || (categories.length > 0 ? categories[0].id : ""));
        setRecAccount(resObj.account_id || (accounts.length > 0 ? accounts[0].id : ""));
      }
    } catch {
      setErrorMsg("Erro de conexão ao analisar o comprovante.");
    } finally {
      setIsAnalyzingReceipt(false);
    }
  };

  // Handle File Drag & Drop / Selection for Receipt
  const handleReceiptFileUpload = (file: File) => {
    setReceiptFile(file);
    const isImage = file.type.startsWith("image/") || file.type.includes("pdf");
    const reader = new FileReader();

    if (isImage) {
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setReceiptPreviewUrl(dataUrl);
        setReceiptText(""); // Keep text area clean of binary garbage
        handleAnalyzeReceipt("", file.name, dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setReceiptPreviewUrl("");
        setReceiptText(text || file.name);
        handleAnalyzeReceipt(text || file.name, file.name);
      };
      reader.readAsText(file);
    }
  };

  // Save Single Receipt Transaction
  const handleSaveReceipt = async () => {
    if (!recTitle.trim() || !recAmount || parseFloat(recAmount) <= 0) {
      setErrorMsg("Título e valor válido são obrigatórios.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");

      const res = await fetch("/api/agent/confirm-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            title: recTitle.trim(),
            amount: parseFloat(recAmount),
            type: recType,
            due_date: recDueDate,
            category_id: recCategory || null,
            account_id: recAccount || null,
            status: "paid"
          }]
        })
      });

      if (res.ok) {
        setSuccessMsg("Lançamento inserido com sucesso via Agente IA!");
        setAnalyzedReceipt(null);
        setReceiptText("");
        setReceiptFile(null);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Erro ao salvar lançamento.");
      }
    } catch {
      setErrorMsg("Erro ao salvar lançamento.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Statement File / Text Analysis
  const handleAnalyzeStatement = async (contentStr?: string, filename?: string) => {
    const textToAnalyze = contentStr || statementText;
    if (!textToAnalyze.trim()) {
      setErrorMsg("Insira ou cole o conteúdo do extrato bancário (OFX, CSV ou texto).");
      return;
    }

    try {
      setIsAnalyzingStatement(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch("/api/agent/analyze-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToAnalyze,
          fileName: filename || "extrato.ofx"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao analisar o extrato.");
      } else {
        setStatementItems(data.items || []);
        if ((data.items || []).length === 0) {
          setErrorMsg("Nenhum lançamento legível foi encontrado no extrato.");
        }
      }
    } catch {
      setErrorMsg("Erro de conexão ao processar extrato bancário.");
    } finally {
      setIsAnalyzingStatement(false);
    }
  };

  // Save Selected Statement Items
  const handleSaveStatementBatch = async () => {
    const selected = statementItems.filter(i => i.selected);
    if (selected.length === 0) {
      setErrorMsg("Selecione pelo menos uma transação para importar.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");

      const res = await fetch("/api/agent/confirm-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selected })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`${data.count || selected.length} transações importadas do extrato com sucesso!`);
        setStatementItems([]);
        setStatementText("");
      } else {
        setErrorMsg(data.error || "Erro ao importar transações.");
      }
    } catch {
      setErrorMsg("Erro de conexão ao importar transações.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Selection in Statement Table
  const toggleStatementItem = (id: string) => {
    setStatementItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const toggleSelectAllStatements = (selected: boolean) => {
    setStatementItems(prev => prev.map(item => ({ ...item, selected })));
  };

  // Chat Submission
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput("");

    const newMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, newMsg]);

    try {
      setIsChatThinking(true);
      const res = await fetch("/api/agent/analyze-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userText, fileName: "chat.txt" })
      });

      const data = await res.json();
      if (res.ok && data.result) {
        const r = data.result;
        const agentReply = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: `Entendi! Encontrei um lançamento: *${r.title}* no valor de *R$ ${r.amount.toFixed(2)}*. Quer que eu insira no sistema agora?`,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          proposal: r
        };
        setChatMessages(prev => [...prev, agentReply]);
      } else {
        setChatMessages(prev => [...prev, {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: "Recebi sua mensagem! Se for um lançamento financeiro, você pode informar o nome e o valor (ex: Mercado R$ 120).",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }]);
      }
    } catch {
      setChatMessages(prev => [...prev, {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: "Desculpe, tive um problema de conexão ao analisar sua mensagem.",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }]);
    } finally {
      setIsChatThinking(false);
    }
  };

  // Confirm Chat Proposal
  const handleConfirmChatProposal = async (proposal: any) => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/agent/confirm-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [proposal] })
      });

      if (res.ok) {
        setSuccessMsg(`Lançamento "${proposal.title}" inserido com sucesso!`);
      }
    } catch {
      setErrorMsg("Erro ao salvar lançamento do chat.");
    } finally {
      setIsSaving(false);
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

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <Bot className="w-7 h-7 text-brand-400" /> Agente IA Financeiro
                <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                  Visão & IA
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Anexe comprovantes PIX, cupons fiscais ou extratos bancários para leitura e lançamento automático inteligente.
              </p>
            </div>
          </div>

          {/* Feedback Banner */}
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

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("receipt")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "receipt" ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ScanLine className="w-4 h-4" /> Leitor de Comprovantes
            </button>
            <button
              onClick={() => setActiveTab("statement")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "statement" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Importador de Extratos
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "chat" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Chat com Agente
            </button>
          </div>

          {/* TAB 1: RECEIPT & INVOICE OCR / AI */}
          {activeTab === "receipt" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload & Input Card */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2 mb-1">
                    <UploadCloud className="w-5 h-5 text-brand-400" /> Anexar Comprovante ou Nota Fiscal
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Envie a foto do comprovante PIX, nota fiscal, recibo ou cole o texto legível.
                  </p>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleReceiptFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-slate-800 hover:border-brand-500/50 rounded-2xl p-6 text-center transition-all bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer group"
                >
                  <input
                    type="file"
                    accept="image/*,.pdf,.txt,.ofx,.csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleReceiptFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="receipt-file-input"
                  />
                  <label htmlFor="receipt-file-input" className="cursor-pointer block space-y-3">
                    {receiptPreviewUrl ? (
                      <div className="space-y-2">
                        <img
                          src={receiptPreviewUrl}
                          alt="Preview Comprovante"
                          className="max-h-48 rounded-xl object-contain mx-auto border border-slate-800 shadow-md"
                        />
                        <p className="text-xs font-semibold text-brand-400">{receiptFile?.name}</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            {receiptFile ? receiptFile.name : "Clique para selecionar ou arraste o comprovante aqui"}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">Suporta imagens (PNG, JPG), documentos PDF ou TXT</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Raw Text Fallback */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ou Cole o Texto do Comprovante PIX / Recibo
                  </label>
                  <textarea
                    rows={4}
                    value={receiptText}
                    onChange={(e) => setReceiptText(e.target.value)}
                    placeholder="Ex: Comprovante de Pagamento PIX, Valor R$ 149,90 para Supermercado Carrefour em 14/08/2026..."
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  onClick={() => handleAnalyzeReceipt()}
                  disabled={isAnalyzingReceipt}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-600/30"
                >
                  {isAnalyzingReceipt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Analisar Comprovante com IA
                </button>
              </div>

              {/* AI Extraction Preview Card */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2 mb-1">
                    <Bot className="w-5 h-5 text-emerald-400" /> Pré-Visualização Inteligente da IA
                  </h3>
                  <p className="text-xs text-slate-400">
                    {analyzedReceipt ? "Verifique os dados extraídos pela IA antes de salvar no sistema." : "Anexe um documento ao lado para ver os dados identificados."}
                  </p>

                  {!analyzedReceipt ? (
                    <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                      <ScanLine className="w-10 h-10 text-slate-700 animate-pulse" />
                      <p>Nenhum comprovante analisado no momento.</p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {/* Summary Banner */}
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                        <span>{analyzedReceipt.extracted_text_summary}</span>
                        <span className="font-bold text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-300 uppercase">
                          Confiança {(analyzedReceipt.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      {/* Vision API Key Tip Banner if amount === 0 */}
                      {analyzedReceipt.amount === 0 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-bold text-amber-200">Visão Computacional por IA:</p>
                            <p className="leading-relaxed">
                              Para que a IA leia e extraia o valor automaticamente dentro da foto do comprovante, certifique-se de preencher sua <strong>Chave de API (OpenAI / Gemini / Groq)</strong> ou habilitar o <strong>LM Studio</strong> na página de <a href="/settings" className="underline font-bold text-amber-200 hover:text-white">Configurações</a>.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Título do Lançamento</label>
                          <input
                            type="text"
                            value={recTitle}
                            onChange={(e) => setRecTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Valor (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={recAmount}
                              onChange={(e) => setRecAmount(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Data</label>
                            <input
                              type="date"
                              value={recDueDate}
                              onChange={(e) => setRecDueDate(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tipo</label>
                            <select
                              value={recType}
                              onChange={(e: any) => setRecType(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                            >
                              <option value="variable_expense">Gasto Variável</option>
                              <option value="fixed_expense">Despesa Fixa</option>
                              <option value="income">Receita</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Categoria</label>
                            <select
                              value={recCategory}
                              onChange={(e) => setRecCategory(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Conta Financeira</label>
                          <select
                            value={recAccount}
                            onChange={(e) => setRecAccount(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                          >
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {analyzedReceipt && (
                  <button
                    onClick={handleSaveReceipt}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirmar & Lançar no Sistema
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STATEMENT PARSER (OFX / CSV / PDF) */}
          {activeTab === "statement" && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-purple-400" /> Importar Extrato Bancário (OFX / CSV / Texto)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cole o conteúdo do seu extrato bancário ou arquivo OFX/CSV para que o Agente IA processe todas as movimentações do mês em lote.
                </p>

                <textarea
                  rows={5}
                  value={statementText}
                  onChange={(e) => setStatementText(e.target.value)}
                  placeholder="Cole aqui o conteúdo do arquivo OFX ou linhas do extrato (Ex: 05/08/2026 Supermercado -R$ 150,00)..."
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() => handleAnalyzeStatement()}
                    disabled={isAnalyzingStatement}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30"
                  >
                    {isAnalyzingStatement ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Processar Extrato
                  </button>
                </div>
              </div>

              {/* Statement Items Table */}
              {statementItems.length > 0 && (
                <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-white">Transações Identificadas no Extrato ({statementItems.length})</h4>
                      <p className="text-xs text-slate-400">Selecione os lançamentos que deseja salvar no seu controle financeiro</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSelectAllStatements(true)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                      >
                        Selecionar Todos
                      </button>
                      <button
                        onClick={() => toggleSelectAllStatements(false)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800"
                      >
                        Desmarcar Todos
                      </button>

                      <button
                        onClick={handleSaveStatementBatch}
                        disabled={isSaving}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Importar {statementItems.filter(i => i.selected).length} Selecionados
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="p-3 w-10 text-center">Sel.</th>
                          <th className="p-3">Título / Descrição</th>
                          <th className="p-3">Data</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Valor</th>
                          <th className="p-3">Categoria</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {statementItems.map((item) => (
                          <tr key={item.id} className={`hover:bg-slate-800/30 ${item.selected ? "bg-slate-900/60" : "opacity-60"}`}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleStatementItem(item.id)}
                                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-semibold text-slate-200">{item.title}</td>
                            <td className="p-3 text-slate-400 font-mono">{item.due_date}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                item.type === "income" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {item.type === "income" ? "Receita" : "Gasto"}
                              </span>
                            </td>
                            <td className={`p-3 font-bold ${item.type === "income" ? "text-emerald-400" : "text-slate-100"}`}>
                              {item.type === "income" ? "+" : "-"}R$ {item.amount.toFixed(2)}
                            </td>
                            <td className="p-3">
                              <select
                                value={item.category_id || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStatementItems(prev => prev.map(i => i.id === item.id ? { ...i, category_id: val } : i));
                                }}
                                className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none"
                              >
                                {categories.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHAT WITH AI FINANCIAL AGENT */}
          {activeTab === "chat" && (
            <div className="glass-card rounded-2xl border border-slate-800 flex flex-col h-[580px] overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Agente IA Assistente Financeiro</h3>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Online e Ativo
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs space-y-2 ${
                        msg.sender === "user"
                          ? "bg-brand-600 text-white rounded-br-none"
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>

                      {/* Enhanced Proposal Card in Agent Message */}
                      {msg.proposal && (
                        <div className="mt-2 p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                            <span className="font-bold text-white text-sm">{msg.proposal.title}</span>
                            <span className="font-extrabold text-emerald-400 text-sm">R$ {msg.proposal.amount.toFixed(2)}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="flex items-center gap-1.5 text-indigo-300 bg-indigo-950/60 p-1.5 rounded-lg border border-indigo-900/50">
                              <Wallet className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="truncate">
                                {accounts.find(a => a.id === msg.proposal.account_id)?.name || "Conta Padrão"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-brand-300 bg-brand-950/60 p-1.5 rounded-lg border border-brand-900/50">
                              <Tag className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                              <span className="truncate">
                                {categories.find(c => c.id === msg.proposal.category_id)?.name || "Gasto Variável"}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleConfirmChatProposal(msg.proposal)}
                            disabled={isSaving}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lançar Transação
                          </button>
                        </div>
                      )}

                      <span className="text-[10px] text-slate-400 block text-right">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}

                {isChatThinking && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    <span>Agente IA analisando lançamento...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Digite uma frase (ex: Almoço R$ 45 no cartão)..."
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatThinking}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
