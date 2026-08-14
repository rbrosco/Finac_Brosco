import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Category, CategoryType } from "@/lib/db/entities/Category";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    const categoryRepo = dataSource.getRepository(Category);

    const categories = await categoryRepo.find({
      where: [
        { user_id: user.id },
        { is_default: true, user_id: null as unknown as string }
      ],
      order: { type: "ASC", name: "ASC" }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET Categories Error:", error);
    return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { name, type, color, icon } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ error: "Nome e tipo são obrigatórios" }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const categoryRepo = dataSource.getRepository(Category);

    const category = categoryRepo.create({
      user_id: user.id,
      name: name.trim(),
      type: type === "income" ? CategoryType.INCOME : CategoryType.EXPENSE,
      color: color || "#6366f1",
      icon: icon || "Tag",
      is_default: false,
    });

    await categoryRepo.save(category);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST Category Error:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
