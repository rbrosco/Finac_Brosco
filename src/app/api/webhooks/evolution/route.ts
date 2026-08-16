export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import { Category } from "@/lib/db/entities/Category";
import { Account } from "@/lib/db/entities/Account";
import { Transaction, TransactionStatus, TransactionFrequency } from "@/lib/db/entities/Transaction";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import { sendWhatsAppMessage, parseNaturalLanguageTransaction } from "@/lib/services/evolution";
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

    // Extract text content from WhatsApp message structure
    const messageContent = messageData.message || {};
    const textMessage = messageContent.conversation || 
                       messageContent.extendedTextMessage?.text || 
                       messageContent.imageMessage?.caption || "";

    if (!textMessage.trim()) {
      return NextResponse.json({ message: "Mensagem sem texto" });
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
      // Fallback to first user config
      config = await configRepo.createQueryBuilder("c")
        .leftJoinAndSelect("c.user", "user")
        .getOne();
    }

    if (!config || !config.user) {
      return NextResponse.json({ error: "Usuário não vinculado ao número do WhatsApp" }, { status: 404 });
    }

    const user = config.user;

    // Parse natural language command
    const parsed = parseNaturalLanguageTransaction(textMessage);
    if (!parsed) {
      // If user asks for summary or balance
      if (textMessage.toLowerCase().includes("saldo") || textMessage.toLowerCase().includes("resumo")) {
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
          summary: { totalIncome: inc, totalExpenses: exp, balance: inc - exp }
        });
      }

      return NextResponse.json({ message: "Mensagem não continha padrão financeiro reconhecido" });
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

    const newTx = transactionRepo.create({
      user_id: user.id,
      title: parsed.title,
      type: parsed.type,
      amount: parsed.amount,
      due_date: todayStr,
      payment_date: todayStr,
      status: TransactionStatus.PAID,
      frequency: parsed.type === "fixed_expense" ? TransactionFrequency.MONTHLY : TransactionFrequency.ONE_OFF,
      category_id: category ? category.id : null,
      description: `Lançado via mensagem WhatsApp: "${textMessage}"`,
      is_recurring: parsed.type === "fixed_expense",
    });

    await transactionRepo.save(newTx);

    // Send WhatsApp confirmation back to user
    const formattedAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parsed.amount);
    const typeLabel = parsed.type === "income" ? "🟢 Receita" : parsed.type === "fixed_expense" ? "🟣 Despesa Fixa" : "🔴 Gasto Variável";
    const categoryLabel = category ? category.name : "Geral";

    const replyMsg = `✅ *Lançamento Registrado com Sucesso!*\n\n📌 *${parsed.title}*\n💰 *Valor:* ${formattedAmount}\n🏷️ *Tipo:* ${typeLabel}\n📁 *Categoria:* ${categoryLabel}\n📅 *Data:* ${todayStr}`;

    try {
      await sendWhatsAppMessage(config, senderNumber, replyMsg);
    } catch (wErr: any) {
      console.warn("Aviso: Falha ao enviar resposta de confirmação no WhatsApp:", wErr.message);
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: newTx.id,
        title: newTx.title,
        amount: newTx.amount,
        type: newTx.type,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Evolution Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar webhook Evolution API" }, { status: 500 });
  }
}
