"use client";

import React, { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  HelpCircle,
  RefreshCw,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Copy,
  Check,
  Send,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ScanLine
} from "lucide-react";
import { useTutorial } from "@/context/TutorialContext";

export default function InteractiveTutorialModal() {
  const { isTutorialOpen, closeTutorial, resetHelpMarkers } = useTutorial();
  const [activeModule, setActiveModule] = useState(0);
  const [copiedText, setCopiedText] = useState("");

  // Interactive Demo States for Extrato Simulator inside Tutorial
  const [demoExtratoState, setDemoExtratoState] = useState<"idle" | "running" | "done">("idle");
  
  // Interactive Demo States for WhatsApp Simulator inside Tutorial
  const [demoChatInput, setDemoChatInput] = useState("");
  const [demoChatMessages, setDemoChatMessages] = useState<any[]>([
    { sender: "bot", text: "🤖 Bot Finac Brosco no WhatsApp: Digite *finac* seguido da sua compra!" }
  ]);

  if (!isTutorialOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleSimulateExtrato = () => {
    setDemoExtratoState("running");
    setTimeout(() => {
      setDemoExtratoState("done");
    }, 1200);
  };

  const handleSendDemoWhatsapp = (msgStr?: string) => {
    const textToSend = msgStr || demoChatInput;
    if (!textToSend.trim()) return;

    const userMsg = { sender: "user", text: textToSend };
    setDemoChatMessages(prev => [...prev, userMsg]);
    if (!msgStr) setDemoChatInput("");

    setTimeout(() => {
      let botReply = "✅ *Registrado com Sucesso!*\n💵 Valor: R$ 45,00\n🏷️ Categoria: Alimentação\n👤 Responsável: Rogger Brosco";
      if (textToSend.toLowerCase().includes("resumo") || textToSend.toLowerCase().includes("saldo")) {
        botReply = "📊 *Resumo Financeiro Finac Brosco*\n🟢 Receitas: R$ 5.400,00\n🔴 Gastos: R$ 2.150,00\n💰 Saldo Atual: R$ 3.250,00";
      } else if (textToSend.toLowerCase().includes("ajuda")) {
        botReply = "📲 *Comandos WhatsApp Finac Brosco*:\n• *finac gastei 45 almoço*\n• *finac recebi 1500 freela*\n• *finac resumo*";
      }
      setDemoChatMessages(prev => [...prev, { sender: "bot", text: botReply }]);
    }, 600);
  };

  const modules = [
    {
      id: "overview",
      title: "1. Visão Geral & Lançamentos Rápidos",
      subtitle: "Conheça o centro de controle financeiro completo do Finac Brosco.",
      icon: TrendingUp,
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            O <strong>Finac Brosco</strong> combina gráficos interativos em tempo real, automação por WhatsApp, leitura inteligente de extratos bancários com IA e controle por membro da família.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs mb-1">
                <ArrowUpRight className="w-4 h-4" /> 🟢 Receita
              </div>
              <p className="text-[11px] text-slate-400">Salários, Freelas, Rendimentos e Vendas.</p>
            </div>

            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
              <div className="flex items-center gap-1.5 font-bold text-purple-400 text-xs mb-1">
                <FileText className="w-4 h-4" /> 🟣 Despesa Fixa
              </div>
              <p className="text-[11px] text-slate-400">Aluguel, Luz, Internet, Assinaturas.</p>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <div className="flex items-center gap-1.5 font-bold text-rose-400 text-xs mb-1">
                <ArrowDownRight className="w-4 h-4" /> 🔴 Gasto Variável
              </div>
              <p className="text-[11px] text-slate-400">Supermercado, Lazer, Restaurantes, Uber.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Dica de Produtividade:
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Use os botões <strong>+ Receita</strong>, <strong>+ Fixa</strong> e <strong>+ Variável</strong> no cabeçalho do sistema a qualquer momento para abrir o modal de cadastro rápido sem mudar de página.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "statement",
      title: "2. Leitor de Extratos (OFX, PDF, Fotos) & Anti-Duplicidade",
      subtitle: "Importe extratos completos do Itaú, Nubank, Inter, Caixa, BB e Santander em lote com 0 duplicidades.",
      icon: FileSpreadsheet,
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            Envie arquivos do seu extrato (<strong className="text-purple-300">OFX, CSV, PDF, TXT ou Fotos/Prints PNG/JPG</strong>). O Agente IA lê todas as movimentações e faz a triagem inteligente.
          </p>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Sistema Anti-Duplicidade & Proteção Inteligente:
            </h5>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li><strong>Cruzamento no Banco de Dados:</strong> Se um gasto do extrato já existir no seu sistema (mesma data, valor e tipo), ele recebe o selo <span className="text-amber-300 font-bold">⚠️ Já Lançado</span>.</li>
              <li><strong>Desmarcação Automática:</strong> Itens duplicados ficam desmarcados por padrão para você não relançar nada duplicado sem querer.</li>
              <li><strong>Selecionar Apenas Novas:</strong> Com 1 clique você seleciona apenas os novos lançamentos não cadastrados.</li>
            </ul>
          </div>

          {/* Interactive Extrato Simulator inside Tutorial */}
          <div className="p-3.5 bg-slate-950 border border-purple-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> Teste Prático: Simulador de Extrato Itaú PDF
              </span>
              <button
                onClick={handleSimulateExtrato}
                disabled={demoExtratoState === "running"}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-md"
              >
                {demoExtratoState === "running" ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Simular Leitura de Extrato"}
              </button>
            </div>

            {demoExtratoState === "idle" && (
              <p className="text-[11px] text-slate-400 italic">Clique no botão acima para ver como o sistema processa um extrato de 3 páginas com anti-duplicidade em tempo real.</p>
            )}

            {demoExtratoState === "running" && (
              <div className="py-4 text-center text-purple-300 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                Agrupando linhas de PDF por coordenadas Y/X e verificando duplicidades no banco...
              </div>
            )}

            {demoExtratoState === "done" && (
              <div className="space-y-2 border border-slate-800 rounded-xl p-2.5 bg-slate-900/80 text-[11px] animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-1">
                  <span>✅ 2 Lançamentos Novos Identificados</span>
                  <span className="text-amber-400 font-bold">⚠️ 1 Já Existente Evitado</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
                    <span className="font-semibold text-slate-200">13/08 PIX ORIGEM CARTAO 8899 (+R$ 56,00)</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">✨ Novo (Priscila)</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-amber-950/30 rounded border border-amber-500/30">
                    <span className="font-semibold text-slate-300 line-through">06/08 FATURA PAGA ITAU (-R$ 1.253,47)</span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">⚠️ Já Lançado</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: "ai_agent",
      title: "3. Agente IA, Cupons Fiscais & Dossiê de Auditoria",
      subtitle: "Suba notas fiscais, cupons de mercado e recibos PIX com auditabilidade total.",
      icon: Bot,
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            O <strong>Agente IA</strong> analisa cupons de supermercado, farmácias, recibos de PIX e faturas. Ele identifica o valor, a data, a empresa pagadora/recebedora e sugere a categoria ideal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-indigo-400" /> 1. OCR Local Gratuito (Sem IA)
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Executa o motor OCR direto no navegador sem precisar de chave paga de IA.
              </p>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> 2. Visão por IA / n8n
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Integre com OpenAI, Gemini, Groq ou n8n nas Configurações para ler comprovantes mais complexos.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1.5">
            <h5 className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 📑 Dossiê de Auditoria PIX / Recibos
            </h5>
            <p className="text-[11px] text-emerald-200 leading-relaxed">
              Cada comprovante salvo fica vinculado ao lançamento no Dashboard e na tabela de Transações. Ao clicar no botão <strong>📎 Auditoria</strong>, a tela abre a ficha técnica com o ID da transação, Banco pagador, Banco recebedor, CPF/CNPJ e a imagem/documento original anexado.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "whatsapp",
      title: "4. Evolution API & Automação via WhatsApp",
      subtitle: "Lance gastos, receitas e peça resumos enviando mensagens ou áudios pelo WhatsApp.",
      icon: Zap,
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            Conecte sua instância da <strong>Evolution API</strong> no menu Configurações. Ao enviar mensagens contendo a palavra-chave <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-400 font-mono">finac</code>, o assistente lança no seu sistema em tempo real!
          </p>

          {/* WhatsApp Command Chips with Copy Action */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs block">📲 Comandos Práticos (Clique para copiar):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              {[
                { cmd: "finac gastei 45 almoço", desc: "Registra gasto de R$ 45" },
                { cmd: "finac recebi 1500 salario", desc: "Registra receita de R$ 1.500" },
                { cmd: "finac resumo", desc: "Retorna o saldo do mês" },
                { cmd: "finac ajuda", desc: "Guia rápido de comandos" }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => copyToClipboard(item.cmd)}
                  className="p-2 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left flex items-center justify-between group transition-all"
                >
                  <div>
                    <span className="text-amber-400 font-bold block">{item.cmd}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </div>
                  {copiedText === item.cmd ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Live WhatsApp Chat Simulator inside Tutorial */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
            <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Simulador Interativo WhatsApp:
            </span>

            <div className="h-28 overflow-y-auto space-y-1.5 p-2 bg-slate-900/90 rounded-xl border border-slate-800/80 font-sans text-[11px]">
              {demoChatMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-2 rounded-xl max-w-[85%] whitespace-pre-line ${
                    m.sender === "user" ? "bg-emerald-600 text-white rounded-br-none" : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none font-mono"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={demoChatInput}
                onChange={(e) => setDemoChatInput(e.target.value)}
                placeholder="Ex: finac gastei 80 mercado..."
                onKeyDown={(e) => e.key === "Enter" && handleSendDemoWhatsapp()}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={() => handleSendDemoWhatsapp()}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "family",
      title: "5. Gestão Financeira Familiar & Membros",
      subtitle: "Vincule gastos aos membros corretos da família (Rogger, Priscila, etc.) com total controle.",
      icon: Users,
      badgeColor: "bg-brand-500/10 text-brand-400 border-brand-500/20",
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            No <strong>Finac Brosco</strong>, cada gasto ou receita pode ser atribuído a um membro específico da família para que você saiba exatamente quem realizou a despesa.
          </p>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" /> Recursos de Gestão Familiar:
            </h5>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li><strong>Detecção Automática no Comprovante:</strong> Quando um comprovante menciona o nome do pagador (ex: <span className="text-white font-semibold font-mono">PRISCILA...</span>), o sistema seleciona o membro automaticamente.</li>
              <li><strong>Vínculo por Conta Bancária:</strong> Ao selecionar a conta financeira do titular, o membro da família é auto-atribuído.</li>
              <li><strong>Relatórios por Membro:</strong> Acesse a aba <strong>Controle Familiar</strong> no menu para ver o ranking de gastos individuais e percentual do orçamento consumido.</li>
            </ul>
          </div>

          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-between">
            <div>
              <span className="font-bold text-brand-200 text-xs block">Deseja reexibir os marcadores de ajuda (?)</span>
              <span className="text-[10px] text-slate-400">Restaura todas as dicas flutuantes pelas páginas do sistema.</span>
            </div>
            <button
              onClick={() => {
                resetHelpMarkers();
                alert("Todos os marcadores de ajuda (?) foram restaurados nas páginas!");
              }}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shadow-md shrink-0 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Restaurar Ajudas (?)
            </button>
          </div>
        </div>
      )
    }
  ];

  const current = modules[activeModule];
  const ModuleIcon = current.icon;
  const progressPercent = Math.round(((activeModule + 1) / modules.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="glass-card max-w-2xl w-full rounded-t-3xl sm:rounded-3xl border border-slate-800 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative flex flex-col max-h-[94vh] overflow-hidden">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-1 opacity-60 sm:hidden" />
        {/* Modal Top Bar Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${current.badgeColor}`}>
              <ModuleIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">{current.title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-purple-400 text-[10px] font-bold">
                  Módulo {activeModule + 1} de {modules.length} ({progressPercent}%)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
            </div>
          </div>
          <button
            onClick={closeTutorial}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module Category Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/60 shrink-0">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            const isActive = idx === activeModule;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>Mod {idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Module Main Content */}
        <div className="py-2 overflow-y-auto flex-1 max-h-[420px] pr-1">
          {current.content}
        </div>

        {/* Progress Bar & Footer Controls */}
        <div className="space-y-3 pt-3 border-t border-slate-800 shrink-0">
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveModule(prev => Math.max(0, prev - 1))}
              disabled={activeModule === 0}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1 disabled:opacity-40 transition-all border border-slate-800"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Finac Brosco Interactive Masterclass
            </span>

            {activeModule < modules.length - 1 ? (
              <button
                onClick={() => setActiveModule(prev => Math.min(modules.length - 1, prev + 1))}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-lg shadow-purple-600/30 transition-all"
              >
                Próximo Módulo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={closeTutorial}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
              >
                Concluir Masterclass <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
