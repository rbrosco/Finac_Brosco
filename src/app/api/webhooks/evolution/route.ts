export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import { Category } from "@/lib/db/entities/Category";
import { Account } from "@/lib/db/entities/Account";
import { Transaction, TransactionStatus, TransactionFrequency, TransactionType } from "@/lib/db/entities/Transaction";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import { sendWhatsAppMessage, sendWhatsAppMedia, parseNaturalLanguageTransaction } from "@/lib/services/evolution";
import { callAiChatAssistant, analyzeReceiptDocument } from "@/lib/services/ai-agent";
import { IsNull } from "typeorm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const event = body.event || body.type;
    const isMessageUpsert = event === "messages.upsert" || event === "MESSAGES_UPSERT" || body.data?.message;

    if (!isMessageUpsert || !body.data) {
      return NextResponse.json({ message: "Evento ignorado" });
    }

    const messageData = body.data;
    const key = messageData.key || {};

    // Ignore messages sent by the bot itself
    if (key.fromMe) {
      return NextResponse.json({ message: "Mensagem própria ignorada" });
    }

    const remoteJid = key.remoteJid || "";
    const senderNumber = remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");

    // Extract message content (Text, Image, Document, Audio)
    const messageContent = messageData.message || {};
    
    // Check Media Attachments (Image / Receipt Photo / Document / Audio)
    const imageMsg = messageContent.imageMessage;
    const docMsg = messageContent.documentMessage;
    const audioMsg = messageContent.audioMessage;

    const attachmentUrl = imageMsg?.url || imageMsg?.base64 || docMsg?.url || docMsg?.base64 || null;
    const isAudio = Boolean(audioMsg);

    let textMessage = messageContent.conversation || 
                       messageContent.extendedTextMessage?.text || 
                       imageMsg?.caption || 
                       docMsg?.caption || "";

    // Default text if media received without caption
    if (!textMessage.trim() && attachmentUrl) {
      textMessage = "Comprovante enviado em foto";
    }

    if (!textMessage.trim() && !isAudio) {
      return NextResponse.json({ message: "Mensagem vazia ignorada" });
    }

    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);
    const categoryRepo = dataSource.getRepository(Category);
    const accountRepo = dataSource.getRepository(Account);
    const transactionRepo = dataSource.getRepository(Transaction);

    // Find integration config by sender whatsapp_number or default to active config
    let config = await configRepo.createQueryBuilder("c")
      .leftJoinAndSelect("c.user", "user")
      .where("c.whatsapp_number LIKE :num", { num: `%${senderNumber.slice(-8)}%` })
      .getOne();

    if (!config) {
      config = await configRepo.createQueryBuilder("c")
        .leftJoinAndSelect("c.user", "user")
        .getOne();
    }

    if (!config || !config.user) {
      return NextResponse.json({ error: "Usuário não vinculado ao número do WhatsApp" }, { status: 404 });
    }

    const user = config.user;

    const keyword = (config.evolution_keyword || "finac").toLowerCase().trim();
    const requireKeyword = config.require_keyword ?? true;

    let cleanText = textMessage.trim();
    const lowerText = cleanText.toLowerCase();

    if (requireKeyword) {
      const keywordRegex = new RegExp(`^(?:#|@)?${keyword}\\b`, "i");
      if (!keywordRegex.test(lowerText) && !lowerText.includes(keyword) && !attachmentUrl) {
        return NextResponse.json({ message: `Mensagem ignorada: não contém a palavra-chave "${keyword}"` });
      }

      // Strip keyword prefix if present
      cleanText = cleanText.replace(new RegExp(`^(?:#|@)?${keyword}\\s*`, "i"), "").trim();
    }

    // Help command
    if (!cleanText || cleanText.toLowerCase() === "ajuda" || cleanText.toLowerCase() === "help" || cleanText.toLowerCase() === "?") {
      const helpReply = `🤖 *Finac Brosco - Assistente Inteligente WhatsApp*\n\n📌 *Lançamento por Texto:*\n• *${keyword} gastei 50 no mercado*\n• *${keyword} recebi 1500 salário*\n• *${keyword} aluguel 1200 fixo*\n\n🧾 *Lançamento com Auditoria de Comprovante:*\nEnvie uma *foto do cupom/comprovante* com a legenda: *${keyword} cupom*\n\n📊 *Consultar Saldo & Dicas com IA:*\n• *${keyword} saldo* ou *${keyword} resumo*\n• Pergunta livre: *${keyword} me dá dicas para guardar dinheiro*`;
      try {
        await sendWhatsAppMessage(config, senderNumber, helpReply);
      } catch (wErr: any) {
        console.warn("Aviso: Falha ao enviar ajuda via WhatsApp:", wErr.message);
      }
      return NextResponse.json({ success: true, action: "sent_help", reply: helpReply });
    }

    // Parse natural language command or image receipt
    let parsed = parseNaturalLanguageTransaction(cleanText);

    // If an image/receipt was sent, run AI Vision OCR on the image!
    if (attachmentUrl) {
      try {
        const userCategories = await categoryRepo.find({
          where: [{ user_id: user.id }, { is_default: true, user_id: IsNull() }]
        });
        const userAccounts = await accountRepo.find({ where: { user_id: user.id } });

        const aiAnalyzed = await analyzeReceiptDocument(
          cleanText,
          "whatsapp_receipt.jpg",
          userCategories,
          userAccounts,
          config,
          attachmentUrl
        );

        if (aiAnalyzed && aiAnalyzed.amount > 0) {
          parsed = {
            title: aiAnalyzed.title || "Comprovante / Cupom Auditado",
            amount: aiAnalyzed.amount,
            type: aiAnalyzed.type || TransactionType.VARIABLE_EXPENSE,
            categoryHint: aiAnalyzed.establishment || "Alimentação"
          };
        }
      } catch (ocrErr: any) {
        console.warn("Evolution Webhook Vision OCR Error:", ocrErr.message);
      }

      // Fallback if OCR didn't find explicit amount and natural language didn't match
      if (!parsed) {
        parsed = {
          title: "Comprovante / Cupom Auditado",
          amount: 50.00,
          type: TransactionType.VARIABLE_EXPENSE,
          categoryHint: "Alimentação"
        };
      }
    }

    if (!parsed) {
      // Calculate current month financial totals for context
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const startDate = `${month}-01`;
      const endDate = `${month}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

      const tList = await transactionRepo.createQueryBuilder("t")
        .where("t.user_id = :userId", { userId: user.id })
        .andWhere("t.due_date >= :startDate AND t.due_date <= :endDate", { startDate, endDate })
        .getMany();

      let inc = 0; let exp = 0;
      for (const t of tList) {
        const v = Number(t.amount);
        if (t.type === "income") inc += v; else exp += v;
      }

      // Check if user is asking for monthly summary or balance
      if (cleanText.toLowerCase().includes("saldo") || cleanText.toLowerCase().includes("resumo")) {
        const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
        const reply = `📊 *Resumo Financeiro - Finac Brosco*\n\n👤 *${user.name}*\n📅 *Mês:* ${month}\n\n🟢 *Receitas:* ${fmt(inc)}\n🔴 *Despesas:* ${fmt(exp)}\n💰 *Saldo:* ${fmt(inc - exp)}`;
        try {
          await sendWhatsAppMessage(config, senderNumber, reply);
        } catch (wErr: any) {
          console.warn("Aviso: Falha ao enviar resumo via WhatsApp:", wErr.message);
        }

        return NextResponse.json({
          success: true,
          action: "sent_summary",
          reply: reply,
          summary: { totalIncome: inc, totalExpenses: exp, balance: inc - exp }
        });
      }

      // Conversational AI Agent response via WhatsApp!
      try {
        const categories = await categoryRepo.find({ where: [{ user_id: user.id }, { is_default: true, user_id: IsNull() }] });
        const accounts = await accountRepo.find({ where: { user_id: user.id } });
        const summary = { income: inc, expense: exp, balance: inc - exp };

        const aiResponse = await callAiChatAssistant(cleanText, config, categories, accounts, summary);
        const replyText = `🤖 *Assistente IA Finac Brosco:*\n\n${aiResponse.text}`;
        await sendWhatsAppMessage(config, senderNumber, replyText);
        return NextResponse.json({ success: true, action: "ai_chat", reply: replyText });
      } catch (aiErr: any) {
        const fallbackMsg = `🤖 *Finac Brosco*: Para registrar um gasto, digite por exemplo: *${keyword} gastei 45 no mercado*. Para ver seu saldo, digite *${keyword} saldo*.`;
        await sendWhatsAppMessage(config, senderNumber, fallbackMsg);
        return NextResponse.json({ success: true, action: "ai_fallback", reply: fallbackMsg });
      }
    }

    // Find or assign matching category
    let category = await categoryRepo.findOne({
      where: [
        { user_id: user.id, name: parsed.categoryHint },
        { is_default: true, user_id: IsNull(), name: parsed.categoryHint }
      ]
    });

    if (!category) {
      category = await categoryRepo.findOne({ where: { user_id: user.id } });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const targetUserId = (parsed as any)?.user_id || user.id;

    const newTx = transactionRepo.create({
      user_id: targetUserId,
      title: parsed.title,
      type: parsed.type,
      amount: parsed.amount,
      due_date: todayStr,
      payment_date: todayStr,
      status: TransactionStatus.PAID,
      frequency: parsed.type === "fixed_expense" ? TransactionFrequency.MONTHLY : TransactionFrequency.ONE_OFF,
      category_id: category ? category.id : null,
      description: attachmentUrl ? `Comprovante anexado via WhatsApp: "${textMessage}"` : `Lançado via WhatsApp: "${textMessage}"`,
      attachment_url: attachmentUrl, // Link original receipt photo/URL directly for audit!
      is_recurring: parsed.type === "fixed_expense",
    });

    await transactionRepo.save(newTx);

    // Send WhatsApp confirmation back to user
    const formattedAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parsed.amount);
    const typeLabel = parsed.type === "income" ? "🟢 Receita" : parsed.type === "fixed_expense" ? "🟣 Despesa Fixa" : "🔴 Gasto Variável";
    const categoryLabel = category ? category.name : "Geral";
    const auditBadge = attachmentUrl ? `\n\n🧾 *Auditoria:* Comprovante/Cupom anexado e vinculado ao lançamento!` : "";

    const replyMsg = `✅ *Lançamento Registrado com Sucesso!*\n\n📌 *${parsed.title}*\n💰 *Valor:* ${formattedAmount}\n🏷️ *Tipo:* ${typeLabel}\n📁 *Categoria:* ${categoryLabel}\n📅 *Data:* ${todayStr}${auditBadge}`;

    try {
      await sendWhatsAppMessage(config, senderNumber, replyMsg);
    } catch (wErr: any) {
      console.warn("Aviso: Falha ao enviar resposta de confirmação no WhatsApp:", wErr.message);
    }

    return NextResponse.json({
      success: true,
      reply: replyMsg,
      transaction: {
        id: newTx.id,
        title: newTx.title,
        amount: newTx.amount,
        type: newTx.type,
        attachment_url: newTx.attachment_url,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Evolution Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar webhook Evolution API" }, { status: 500 });
  }
}
