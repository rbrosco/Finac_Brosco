import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import { Category } from "@/lib/db/entities/Category";
import { Account } from "@/lib/db/entities/Account";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import { getFamilyUserIds } from "@/lib/db/family-helper";
import { analyzeReceiptDocument } from "@/lib/services/ai-agent";
import { In, IsNull } from "typeorm";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { content, fileName, fileData } = body;

    const dataSource = await getDataSource();
    const categoryRepo = dataSource.getRepository(Category);
    const accountRepo = dataSource.getRepository(Account);
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

    const userRepo = dataSource.getRepository(User);
    const familyUsers = await userRepo.find({ where: { id: In(userIds) } });

    const result = await analyzeReceiptDocument(content || "", fileName || "", categories, accounts, config, fileData, familyUsers);

    return NextResponse.json({
      success: true,
      result,
      familyMembers: familyUsers.map(u => ({ id: u.id, name: u.name, email: u.email }))
    });
  } catch (error) {
    console.error("POST Analyze Receipt Error:", error);
    return NextResponse.json({ error: "Erro ao analisar o comprovante." }, { status: 500 });
  }
}
