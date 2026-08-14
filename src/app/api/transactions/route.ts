export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Transaction, TransactionType, TransactionStatus, TransactionFrequency } from "@/lib/db/entities/Transaction";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const month = searchParams.get("month"); // YYYY-MM
    const status = searchParams.get("status");
    const category_id = searchParams.get("category_id");
    const account_id = searchParams.get("account_id");

    const dataSource = await getDataSource();
    const query = dataSource.getRepository(Transaction)
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.category", "category")
      .leftJoinAndSelect("t.account", "account")
      .where("t.user_id = :userId", { userId: user.id });

    if (type) {
      query.andWhere("t.type = :type", { type });
    }

    if (status) {
      query.andWhere("t.status = :status", { status });
    }

    if (category_id) {
      query.andWhere("t.category_id = :category_id", { category_id });
    }

    if (account_id) {
      query.andWhere("t.account_id = :account_id", { account_id });
    }

    if (month) {
      // Filter due_date by month YYYY-MM
      const startDate = `${month}-01`;
      // Get last day of month
      const [y, m] = month.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

      query.andWhere("t.due_date >= :startDate AND t.due_date <= :endDate", { startDate, endDate });
    }

    query.orderBy("t.due_date", "DESC").addOrderBy("t.created_at", "DESC");

    const transactions = await query.getMany();
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("GET Transactions Error:", error);
    return NextResponse.json({ error: "Erro ao listar transações" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      title,
      type,
      amount,
      due_date,
      payment_date,
      status,
      frequency,
      category_id,
      account_id,
      description,
      is_recurring
    } = body;

    if (!title || !type || amount === undefined || !due_date) {
      return NextResponse.json({ error: "Título, tipo, valor e data de vencimento são obrigatórios." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const transactionRepo = dataSource.getRepository(Transaction);

    const isPaid = status === TransactionStatus.PAID;
    const finalPaymentDate = isPaid ? (payment_date || due_date) : null;

    const transaction = transactionRepo.create({
      user_id: user.id,
      title: title.trim(),
      type: type as TransactionType,
      amount: parseFloat(amount),
      due_date,
      payment_date: finalPaymentDate,
      status: status || TransactionStatus.PENDING,
      frequency: frequency || TransactionFrequency.ONE_OFF,
      category_id: category_id || null,
      account_id: account_id || null,
      description: description || null,
      is_recurring: is_recurring || type === TransactionType.FIXED_EXPENSE,
    });

    await transactionRepo.save(transaction);

    // Re-fetch with relations
    const saved = await transactionRepo.findOne({
      where: { id: transaction.id },
      relations: ["category", "account"]
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST Transaction Error:", error);
    return NextResponse.json({ error: "Erro ao registrar transação" }, { status: 500 });
  }
}
