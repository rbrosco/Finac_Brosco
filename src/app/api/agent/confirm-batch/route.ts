import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Account } from "@/lib/db/entities/Account";
import { Transaction, TransactionStatus, TransactionFrequency, TransactionType } from "@/lib/db/entities/Transaction";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { items } = body; // Array of transaction objects to save

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Nenhum lançamento fornecido para confirmação." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const transactionRepo = dataSource.getRepository(Transaction);
    const accountRepo = dataSource.getRepository(Account);

    const createdTransactions = [];
    let skippedDuplicates = 0;

    for (const item of items) {
      if (!item.title || item.amount === undefined || !item.type) continue;

      let targetUserId = item.user_id || null;
      if (!targetUserId && item.account_id) {
        const acc = await accountRepo.findOne({ where: { id: item.account_id } });
        if (acc && acc.user_id) {
          targetUserId = acc.user_id;
        }
      }
      if (!targetUserId) {
        targetUserId = user.id;
      }

      const itemType = item.type === "income" ? TransactionType.INCOME : item.type === "fixed_expense" ? TransactionType.FIXED_EXPENSE : TransactionType.VARIABLE_EXPENSE;
      const itemAmount = Number(item.amount);
      const itemDueDate = item.due_date || new Date().toISOString().split("T")[0];

      // Secondary duplicate check: skip if exact match exists in DB and already_exists is set
      if (item.already_exists) {
        const existingMatch = await transactionRepo.findOne({
          where: {
            user_id: targetUserId,
            due_date: itemDueDate,
            amount: itemAmount,
            type: itemType
          }
        });

        if (existingMatch) {
          skippedDuplicates++;
          console.log(`[Confirm Batch] Skipped duplicate transaction: ${item.title} (${itemDueDate} - R$ ${itemAmount})`);
          continue;
        }
      }

      const tx = transactionRepo.create({
        user_id: targetUserId,
        category_id: item.category_id || null,
        account_id: item.account_id || null,
        title: item.title.trim(),
        type: itemType,
        amount: itemAmount,
        due_date: itemDueDate,
        payment_date: item.status === "paid" || item.type === "income" ? itemDueDate : null,
        status: item.status === "pending" ? TransactionStatus.PENDING : TransactionStatus.PAID,
        frequency: item.frequency || TransactionFrequency.ONE_OFF,
        description: item.description || "Lançado via Agente IA Financeiro (Extrato)",
        attachment_url: item.attachment_url || null
      });

      const saved = await transactionRepo.save(tx);
      createdTransactions.push(saved);
    }

    return NextResponse.json({
      success: true,
      count: createdTransactions.length,
      skipped_duplicates: skippedDuplicates,
      transactions: createdTransactions
    });
  } catch (error) {
    console.error("POST Confirm Batch Error:", error);
    return NextResponse.json({ error: "Erro ao salvar os lançamentos no banco de dados." }, { status: 500 });
  }
}
