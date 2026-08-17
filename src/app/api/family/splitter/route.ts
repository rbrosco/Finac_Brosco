import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { getAuthUser } from "@/lib/auth";
import { HouseSplitResident } from "@/lib/db/entities/HouseSplitResident";
import { HouseSplitBill } from "@/lib/db/entities/HouseSplitBill";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    const ds = await getDataSource();
    const residentRepo = ds.getRepository(HouseSplitResident);
    const billRepo = ds.getRepository(HouseSplitBill);

    const residents = await residentRepo.find({
      where: { user_id: user.id },
      order: { created_at: "ASC" }
    });

    const bills = await billRepo.find({
      where: { user_id: user.id, month },
      order: { created_at: "ASC" }
    });

    return NextResponse.json({
      residents,
      bills,
      month
    });
  } catch (error) {
    console.error("GET /api/family/splitter error:", error);
    return NextResponse.json({ error: "Erro ao buscar dados do divisor de contas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const ds = await getDataSource();
    const residentRepo = ds.getRepository(HouseSplitResident);
    const billRepo = ds.getRepository(HouseSplitBill);

    if (action === "add_resident") {
      const { name, is_external, days_present, family_count, weight, pix_key } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Nome do morador é obrigatório." }, { status: 400 });
      }

      const resident = residentRepo.create({
        user_id: user.id,
        name: name.trim(),
        is_external: Boolean(is_external),
        days_present: Number(days_present) || 30,
        family_count: Number(family_count) || 1,
        weight: Number(weight) || 1.0,
        pix_key: pix_key || null
      });

      await residentRepo.save(resident);
      return NextResponse.json({ success: true, resident });
    }

    if (action === "delete_resident") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

      await residentRepo.delete({ id, user_id: user.id });
      return NextResponse.json({ success: true });
    }

    if (action === "update_resident") {
      const { id, days_present, family_count, weight, name, pix_key } = body;
      if (!id) return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

      const updateData: any = {};
      if (days_present !== undefined) updateData.days_present = Number(days_present);
      if (family_count !== undefined) updateData.family_count = Number(family_count);
      if (weight !== undefined) updateData.weight = Number(weight);
      if (name !== undefined) updateData.name = String(name).trim();
      if (pix_key !== undefined) updateData.pix_key = String(pix_key).trim();

      await residentRepo.update({ id, user_id: user.id }, updateData);
      return NextResponse.json({ success: true });
    }

    if (action === "add_bill") {
      const { name, amount, paid_by_name, paid_by_user_id, split_method, icon_type, month } = body;
      if (!name || !amount) {
        return NextResponse.json({ error: "Nome e valor da conta são obrigatórios." }, { status: 400 });
      }

      const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

      const bill = billRepo.create({
        user_id: user.id,
        month: targetMonth,
        name: name.trim(),
        amount: Number(amount),
        paid_by_name: paid_by_name || "Morador",
        paid_by_user_id: paid_by_user_id || null,
        split_method: split_method || "days",
        icon_type: icon_type || "power"
      });

      await billRepo.save(bill);
      return NextResponse.json({ success: true, bill });
    }

    if (action === "delete_bill") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

      await billRepo.delete({ id, user_id: user.id });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Ação não reconhecida." }, { status: 400 });
  } catch (error) {
    console.error("POST /api/family/splitter error:", error);
    return NextResponse.json({ error: "Erro ao processar dados de divisão de contas." }, { status: 500 });
  }
}
