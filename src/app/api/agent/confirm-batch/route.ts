import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
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

    const createdTransactions = [];

    for (const item of items) {
      if (!item.title || item.amount === undefined || !item.type) continue;

      const tx = transactionRepo.create({
        user_id: user.id,
        category_id: item.category_id || null,
        account_id: item.account_id || null,
        title: item.title.trim(),
        type: item.type === "income" ? TransactionType.INCOME : item.type === "fixed_expense" ? TransactionType.FIXED_EXPENSE : TransactionType.VARIABLE_EXPENSE,
        amount: Number(item.amount),
        due_date: item.due_date || new Date().toISOString().split("T")[0],
        payment_date: item.status === "paid" || item.type === "income" ? (item.due_date || new Date().toISOString().split("T")[0]) : null,
        status: item.status === "pending" ? TransactionStatus.PENDING : TransactionStatus.PAID,
        frequency: item.frequency || TransactionFrequency.ONE_OFF,
        description: item.description || "Lançado via Agente IA Financeiro"
      });

      const saved = await transactionRepo.save(tx);
      createdTransactions.push(saved);
    }

    return NextResponse.json({
      success: true,
      count: createdTransactions.length,
      transactions: createdTransactions
    });
  } catch (error) {
    console.error("POST Confirm Batch Error:", error);
    return NextResponse.json({ error: "Erro ao salvar os lançamentos no banco de dados." }, { status: 500 });
  }
}
