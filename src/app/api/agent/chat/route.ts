import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Category } from "@/lib/db/entities/Category";
import { Account } from "@/lib/db/entities/Account";
import { Transaction } from "@/lib/db/entities/Transaction";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import { getFamilyUserIds } from "@/lib/db/family-helper";
import { callAiChatAssistant } from "@/lib/services/ai-agent";
import { In, IsNull } from "typeorm";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const categoryRepo = dataSource.getRepository(Category);
    const accountRepo = dataSource.getRepository(Account);
    const transactionRepo = dataSource.getRepository(Transaction);
    const configRepo = dataSource.getRepository(IntegrationConfig);

    const userIds = await getFamilyUserIds(user.id);
    const config = await configRepo.findOne({ where: { user_id: user.id } });

    const categories = await categoryRepo.find({
      where: [
        { user_id: In(userIds) },
        { is_default: true, user_id: IsNull() }
      ]
    });

    const accounts = await accountRepo.find({
      where: { user_id: In(userIds) }
    });

    // Calculate current month financial totals for context
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const startDate = `${month}-01`;
    const endDate = `${month}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

    const transactions = await transactionRepo.createQueryBuilder("t")
      .where("t.user_id IN (:...userIds)", { userIds })
      .andWhere("t.due_date >= :startDate AND t.due_date <= :endDate", { startDate, endDate })
      .getMany();

    let inc = 0;
    let exp = 0;
    for (const t of transactions) {
      const val = Number(t.amount);
      if (t.type === "income") inc += val;
      else exp += val;
    }

    const summary = {
      income: inc,
      expense: exp,
      balance: inc - exp
    };

    const aiResponse = await callAiChatAssistant(message, config, categories, accounts, summary);

    return NextResponse.json({
      success: true,
      reply: aiResponse.text,
      proposal: aiResponse.proposal || null
    });
  } catch (error: any) {
    console.error("POST Agent Chat Error:", error);
    return NextResponse.json({ error: "Erro ao processar mensagem do chat com IA." }, { status: 500 });
  }
}
