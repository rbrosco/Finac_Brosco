import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Account, AccountType } from "@/lib/db/entities/Account";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { name, type, initial_balance, color, icon } = await req.json();

    const dataSource = await getDataSource();
    const accountRepo = dataSource.getRepository(Account);

    const account = await accountRepo.findOne({ where: { id: params.id, user_id: user.id } });
    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    }

    if (name) account.name = name.trim();
    if (type) account.type = type as AccountType;
    if (initial_balance !== undefined) account.initial_balance = parseFloat(initial_balance);
    if (color) account.color = color;
    if (icon) account.icon = icon;

    await accountRepo.save(account);
    return NextResponse.json(account);
  } catch (error) {
    console.error("PUT Account Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    const accountRepo = dataSource.getRepository(Account);

    const account = await accountRepo.findOne({ where: { id: params.id, user_id: user.id } });
    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    }

    await accountRepo.remove(account);
    return NextResponse.json({ success: true, message: "Conta removida com sucesso" });
  } catch (error) {
    console.error("DELETE Account Error:", error);
    return NextResponse.json({ error: "Erro ao remover conta" }, { status: 500 });
  }
}
