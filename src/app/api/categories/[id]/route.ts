import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Category, CategoryType } from "@/lib/db/entities/Category";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { name, type, color, icon } = await req.json();

    const dataSource = await getDataSource();
    const categoryRepo = dataSource.getRepository(Category);

    const category = await categoryRepo.findOne({ where: { id: params.id, user_id: user.id } });
    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada ou não editável." }, { status: 404 });
    }

    if (name) category.name = name.trim();
    if (type) category.type = type === "income" ? CategoryType.INCOME : CategoryType.EXPENSE;
    if (color) category.color = color;
    if (icon) category.icon = icon;

    await categoryRepo.save(category);
    return NextResponse.json(category);
  } catch (error) {
    console.error("PUT Category Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    const categoryRepo = dataSource.getRepository(Category);

    const category = await categoryRepo.findOne({ where: { id: params.id, user_id: user.id } });
    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    }

    await categoryRepo.remove(category);
    return NextResponse.json({ success: true, message: "Categoria removida com sucesso" });
  } catch (error) {
    console.error("DELETE Category Error:", error);
    return NextResponse.json({ error: "Erro ao remover categoria" }, { status: 500 });
  }
}
