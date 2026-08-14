import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Account, AccountType } from "@/lib/db/entities/Account";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    const accountRepo = dataSource.getRepository(Account);

    const accounts = await accountRepo.find({
      where: { user_id: user.id },
      order: { name: "ASC" }
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("GET Accounts Error:", error);
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { name, type, initial_balance, color, icon } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Nome da conta é obrigatório" }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const accountRepo = dataSource.getRepository(Account);

    const account = accountRepo.create({
      user_id: user.id,
      name: name.trim(),
      type: type || AccountType.CHECKING,
      initial_balance: parseFloat(initial_balance || 0),
      color: color || "#3b82f6",
      icon: icon || "Wallet",
    });

    await accountRepo.save(account);
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("POST Account Error:", error);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}
