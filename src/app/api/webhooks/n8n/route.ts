export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import { Category, CategoryType } from "@/lib/db/entities/Category";
import { Account } from "@/lib/db/entities/Account";
import { Transaction, TransactionType, TransactionStatus, TransactionFrequency } from "@/lib/db/entities/Transaction";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import { sendWhatsAppMessage } from "@/lib/services/evolution";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const secretHeader = req.headers.get("x-finac-secret") || body.secret || body.token;
    const userEmail = body.user_email || body.email;
    const userId = body.user_id;

    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);
    const configRepo = dataSource.getRepository(IntegrationConfig);
    const categoryRepo = dataSource.getRepository(Category);
    const accountRepo = dataSource.getRepository(Account);
    const transactionRepo = dataSource.getRepository(Transaction);

    let user: User | null = null;

    if (userId) {
      user = await userRepo.findOne({ where: { id: userId } });
    } else if (userEmail) {
      user = await userRepo.findOne({ where: { email: userEmail.toLowerCase().trim() } });
    }

    if (!user) {
      // Default to first user if only 1 user exists or return 401
      const users = await userRepo.find({ take: 2 });
      if (users.length === 1) {
        user = users[0];
      } else {
        return NextResponse.json({ error: "Usuário não identificado. Forneça 'user_email' ou 'user_id'." }, { status: 401 });
      }
    }

    const config = await configRepo.findOne({ where: { user_id: user.id } });
    if (config && config.webhook_secret && secretHeader !== config.webhook_secret) {
      return NextResponse.json({ error: "Secret de webhook inválido." }, { status: 403 });
    }

    const action = body.action || "create_transaction";

    if (action === "get_summary") {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const startDate = `${month}-01`;
      const endDate = `${month}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

      const tList = await transactionRepo.createQueryBuilder("t")
        .where("t.user_id = :userId", { userId: user.id })
        .andWhere("t.due_date >= :startDate AND t.due_date <= :endDate", { startDate, endDate })
        .getMany();

      let inc = 0;
      let exp = 0;
      for (const t of tList) {
        const val = Number(t.amount);
        if (t.type === TransactionType.INCOME) inc += val;
        else exp += val;
      }

      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        month,
        summary: {
          totalIncome: inc,
          totalExpenses: exp,
          balance: inc - exp,
        }
      });
    }

    // Action: create_transaction
    const { title, amount, type, due_date, status, category: categoryName, account: accountName, description } = body;

    if (!title || amount === undefined) {
      return NextResponse.json({ error: "Campos obrigatórios: 'title' e 'amount'." }, { status: 400 });
    }

    // Find category
    let category = null;
    if (categoryName) {
      category = await categoryRepo.findOne({
        where: [
          { user_id: user.id, name: categoryName },
          { is_default: true, name: categoryName }
        ]
      });
    }

    // Find account
    let account = null;
    if (accountName) {
      account = await accountRepo.findOne({
        where: { user_id: user.id, name: accountName }
      });
    }

    const txType = (type === "income" ? TransactionType.INCOME : type === "fixed_expense" ? TransactionType.FIXED_EXPENSE : TransactionType.VARIABLE_EXPENSE);
    const txStatus = status === "paid" ? TransactionStatus.PAID : TransactionStatus.PENDING;
    const txDueDate = due_date || new Date().toISOString().split("T")[0];

    const transaction = transactionRepo.create({
      user_id: user.id,
      title: String(title).trim(),
      type: txType,
      amount: parseFloat(amount),
      due_date: txDueDate,
      payment_date: txStatus === TransactionStatus.PAID ? txDueDate : null,
      status: txStatus,
      frequency: txType === TransactionType.FIXED_EXPENSE ? TransactionFrequency.MONTHLY : TransactionFrequency.ONE_OFF,
      category_id: category ? category.id : null,
      account_id: account ? account.id : null,
      description: description || "Lançamento via n8n Webhook",
      is_recurring: txType === TransactionType.FIXED_EXPENSE,
    });

    await transactionRepo.save(transaction);

    // Optional WhatsApp Notification
    if (config && config.is_whatsapp_enabled && config.whatsapp_number && config.notify_on_created) {
      try {
        const typeLabel = txType === TransactionType.INCOME ? "🟢 Receita" : txType === TransactionType.FIXED_EXPENSE ? "🟣 Despesa Fixa" : "🔴 Gasto Variável";
        const formattedMoney = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(amount));
        const msg = `⚡ *Novo Lançamento via n8n Webhook*\n\n📌 *${title}*\n💰 *Valor:* ${formattedMoney}\n🏷️ *Tipo:* ${typeLabel}\n📅 *Data:* ${txDueDate}\n✅ *Status:* ${txStatus === TransactionStatus.PAID ? "Pago" : "Pendente"}`;
        await sendWhatsAppMessage(config, config.whatsapp_number, msg);
      } catch (wErr) {
        console.error("WhatsApp notification error in n8n webhook:", wErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transação criada via n8n Webhook com sucesso!",
      transaction: {
        id: transaction.id,
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        due_date: transaction.due_date,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Inbound n8n Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Erro no processamento do webhook" }, { status: 500 });
  }
}
