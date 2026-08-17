import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { PiggyBank, RiskLevel } from "@/lib/db/entities/PiggyBank";
import { getFamilyUserIds } from "@/lib/db/family-helper";
import { In } from "typeorm";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const dataSource = await getDataSource();
    const piggyRepo = dataSource.getRepository(PiggyBank);
    const userIds = await getFamilyUserIds(user.id);

    const piggyBank = await piggyRepo.findOne({
      where: { id, user_id: In(userIds) },
    });

    if (!piggyBank) {
      return NextResponse.json({ error: "Caixinha não encontrada" }, { status: 404 });
    }

    // Handle Quick Action: Deposit or Withdraw
    if (body.action === "deposit" || body.action === "withdraw") {
      const amountChange = parseFloat(body.amount || 0);
      if (isNaN(amountChange) || amountChange <= 0) {
        return NextResponse.json({ error: "Informe um valor válido para a movimentação." }, { status: 400 });
      }

      const currentVal = Number(piggyBank.current_amount || 0);
      if (body.action === "withdraw" && amountChange > currentVal) {
        return NextResponse.json({ error: "Valor de resgate excede o saldo guardado nesta caixinha." }, { status: 400 });
      }

      const newVal = body.action === "deposit" ? currentVal + amountChange : currentVal - amountChange;
      piggyBank.current_amount = newVal;
    } else {
      // General Edit Form Update
      if (body.name !== undefined) piggyBank.name = body.name.trim();
      if (body.target_amount !== undefined) piggyBank.target_amount = parseFloat(body.target_amount || 0);
      if (body.current_amount !== undefined) piggyBank.current_amount = parseFloat(body.current_amount || 0);
      if (body.investment_type !== undefined) piggyBank.investment_type = body.investment_type;
      if (body.risk_level !== undefined) piggyBank.risk_level = body.risk_level as RiskLevel;
      if (body.expected_return_rate !== undefined) piggyBank.expected_return_rate = parseFloat(body.expected_return_rate || 0);
      if (body.monthly_deposit !== undefined) piggyBank.monthly_deposit = parseFloat(body.monthly_deposit || 0);
      if (body.target_date !== undefined) piggyBank.target_date = body.target_date || null;
      if (body.color !== undefined) piggyBank.color = body.color;
      if (body.icon !== undefined) piggyBank.icon = body.icon;
      if (body.notes !== undefined) piggyBank.notes = body.notes;
    }

    await piggyRepo.save(piggyBank);
    return NextResponse.json(piggyBank);
  } catch (error) {
    console.error("PUT PiggyBank Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar caixinha" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;

    const dataSource = await getDataSource();
    const piggyRepo = dataSource.getRepository(PiggyBank);
    const userIds = await getFamilyUserIds(user.id);

    const piggyBank = await piggyRepo.findOne({
      where: { id, user_id: In(userIds) },
    });

    if (!piggyBank) {
      return NextResponse.json({ error: "Caixinha não encontrada" }, { status: 404 });
    }

    await piggyRepo.remove(piggyBank);
    return NextResponse.json({ success: true, message: "Caixinha removida com sucesso" });
  } catch (error) {
    console.error("DELETE PiggyBank Error:", error);
    return NextResponse.json({ error: "Erro ao remover caixinha" }, { status: 500 });
  }
}
