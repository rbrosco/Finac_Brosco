import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { seedDemoData } from "@/lib/db/seed";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    await seedDemoData(dataSource, user.id);

    return NextResponse.json({
      success: true,
      message: "Dados de demonstração populados com sucesso!"
    });
  } catch (error) {
    console.error("Seed Demo Data Error:", error);
    return NextResponse.json({ error: "Erro ao gerar dados de demonstração" }, { status: 500 });
  }
}
