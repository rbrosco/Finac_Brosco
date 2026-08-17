import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { PiggyBank, RiskLevel } from "@/lib/db/entities/PiggyBank";
import { getFamilyUserIds } from "@/lib/db/family-helper";
import { In } from "typeorm";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const dataSource = await getDataSource();
    const piggyRepo = dataSource.getRepository(PiggyBank);

    const userIds = await getFamilyUserIds(user.id);

    const piggyBanks = await piggyRepo.find({
      where: { user_id: In(userIds) },
      order: { created_at: "DESC" },
    });

    // Calculate totals
    const totalCurrent = piggyBanks.reduce((acc, item) => acc + Number(item.current_amount || 0), 0);
    const totalTarget = piggyBanks.reduce((acc, item) => acc + Number(item.target_amount || 0), 0);
    const estimatedAnnualReturn = piggyBanks.reduce((acc, item) => {
      const current = Number(item.current_amount || 0);
      const rate = Number(item.expected_return_rate || 0) / 100;
      return acc + current * rate;
    }, 0);

    return NextResponse.json({
      piggyBanks,
      summary: {
        totalCurrent,
        totalTarget,
        estimatedAnnualReturn,
        count: piggyBanks.length,
      },
    });
  } catch (error) {
    console.error("GET PiggyBanks Error:", error);
    return NextResponse.json({ error: "Erro ao buscar caixinhas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      target_amount,
      current_amount,
      investment_type,
      risk_level,
      expected_return_rate,
      monthly_deposit,
      target_date,
      color,
      icon,
      notes,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "O nome da caixinha é obrigatório." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const piggyRepo = dataSource.getRepository(PiggyBank);

    const piggyBank = piggyRepo.create({
      user_id: user.id,
      name: name.trim(),
      target_amount: parseFloat(target_amount || 0),
      current_amount: parseFloat(current_amount || 0),
      investment_type: investment_type || "TESOURO_SELIC",
      risk_level: (risk_level as RiskLevel) || RiskLevel.LOW,
      expected_return_rate: parseFloat(expected_return_rate || 10.5),
      monthly_deposit: parseFloat(monthly_deposit || 0),
      target_date: target_date || null,
      color: color || "#10b981",
      icon: icon || "PiggyBank",
      notes: notes || null,
    });

    await piggyRepo.save(piggyBank);
    return NextResponse.json(piggyBank, { status: 201 });
  } catch (error) {
    console.error("POST PiggyBank Error:", error);
    return NextResponse.json({ error: "Erro ao criar caixinha" }, { status: 500 });
  }
}
