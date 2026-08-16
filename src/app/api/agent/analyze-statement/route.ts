import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Category } from "@/lib/db/entities/Category";
import { Account } from "@/lib/db/entities/Account";
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

    const userIds = await getFamilyUserIds(user.id);

    const categories = await categoryRepo.find({
      where: [
        { user_id: In(userIds) },
        { is_default: true, user_id: IsNull() }
      ]
    });

    const accounts = await accountRepo.find({
      where: { user_id: In(userIds) }
    });

    const items = await parseBankStatementDocument(content, fileName || "", categories, accounts);

    return NextResponse.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    console.error("POST Analyze Statement Error:", error);
    return NextResponse.json({ error: "Erro ao processar o extrato bancário." }, { status: 500 });
  }
}
