import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import { Category } from "@/lib/db/entities/Category";
import { Account } from "@/lib/db/entities/Account";
import { Transaction } from "@/lib/db/entities/Transaction";
import { getFamilyUserIds } from "@/lib/db/family-helper";
import { parseBankStatementDocument } from "@/lib/services/ai-agent";
import { In, IsNull } from "typeorm";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { content, fileName } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Conteúdo do extrato não fornecido." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const categoryRepo = dataSource.getRepository(Category);
    const accountRepo = dataSource.getRepository(Account);
    const userRepo = dataSource.getRepository(User);
    const transactionRepo = dataSource.getRepository(Transaction);

    const userIds = await getFamilyUserIds(user.id);
    const familyUsers = await userRepo.find({ where: { id: In(userIds) } });

    const categories = await categoryRepo.find({
      where: [
        { user_id: In(userIds) },
        { is_default: true, user_id: IsNull() }
      ]
    });

    const accounts = await accountRepo.find({
      where: { user_id: In(userIds) }
    });

    // Fetch existing transactions to prevent duplicate entry
    const existingTransactions = await transactionRepo.find({
      where: { user_id: In(userIds) }
    });

    const items = await parseBankStatementDocument(content, fileName || "", categories, accounts, familyUsers);

    // Cross-reference extracted statement items with existing database transactions
    let duplicateCount = 0;
    let newCount = 0;

    const processedItems = items.map((item) => {
      const isItemInc = item.type === "income";
      const itemAmt = Number(item.amount);

      const duplicate = existingTransactions.find((tx) => {
        const dateMatch = tx.due_date === item.due_date;
        const amtMatch = Math.abs(Number(tx.amount) - itemAmt) < 0.01;
        const isTxInc = tx.type === "income";
        const typeMatch = (isTxInc && isItemInc) || (!isTxInc && !isItemInc);
        return dateMatch && amtMatch && typeMatch;
      });

      if (duplicate) {
        duplicateCount++;
        return {
          ...item,
          already_exists: true,
          existing_title: duplicate.title,
          selected: false // DO NOT select duplicates by default!
        };
      }

      newCount++;
      return {
        ...item,
        already_exists: false,
        selected: true
      };
    });

    return NextResponse.json({
      success: true,
      count: processedItems.length,
      new_count: newCount,
      duplicate_count: duplicateCount,
      items: processedItems
    });
  } catch (error) {
    console.error("POST Analyze Statement Error:", error);
    return NextResponse.json({ error: "Erro ao processar o extrato bancário." }, { status: 500 });
  }
}
