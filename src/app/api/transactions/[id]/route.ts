import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Transaction, TransactionType, TransactionStatus, TransactionFrequency } from "@/lib/db/entities/Transaction";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const dataSource = await getDataSource();
    const transactionRepo = dataSource.getRepository(Transaction);

    const transaction = await transactionRepo.findOne({
      where: { id: params.id, user_id: user.id }
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    if (body.title !== undefined) transaction.title = body.title.trim();
    if (body.type !== undefined) transaction.type = body.type as TransactionType;
    if (body.amount !== undefined) transaction.amount = parseFloat(body.amount);
    if (body.due_date !== undefined) transaction.due_date = body.due_date;
    if (body.status !== undefined) {
      transaction.status = body.status as TransactionStatus;
      if (body.status === TransactionStatus.PAID) {
        transaction.payment_date = body.payment_date || transaction.due_date || new Date().toISOString().split("T")[0];
      } else {
        transaction.payment_date = null;
      }
    }
    if (body.payment_date !== undefined) transaction.payment_date = body.payment_date;
    if (body.frequency !== undefined) transaction.frequency = body.frequency as TransactionFrequency;
    if (body.category_id !== undefined) transaction.category_id = body.category_id || null;
    if (body.account_id !== undefined) transaction.account_id = body.account_id || null;
    if (body.description !== undefined) transaction.description = body.description;
    if (body.is_recurring !== undefined) transaction.is_recurring = body.is_recurring;

    await transactionRepo.save(transaction);

    const updated = await transactionRepo.findOne({
      where: { id: transaction.id },
      relations: ["category", "account"]
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT Transaction Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    const transactionRepo = dataSource.getRepository(Transaction);

    const transaction = await transactionRepo.findOne({
      where: { id: params.id, user_id: user.id }
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    await transactionRepo.remove(transaction);
    return NextResponse.json({ success: true, message: "Transação excluída com sucesso" });
  } catch (error) {
    console.error("DELETE Transaction Error:", error);
    return NextResponse.json({ error: "Erro ao excluir transação" }, { status: 500 });
  }
}
