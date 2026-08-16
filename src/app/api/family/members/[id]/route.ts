import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Family } from "@/lib/db/entities/Family";
import { FamilyMember, FamilyRole } from "@/lib/db/entities/FamilyMember";
import { getFamilyContext } from "@/lib/db/family-helper";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { role } = await req.json();
    if (!role || !Object.values(FamilyRole).includes(role)) {
      return NextResponse.json({ error: "Função (role) inválida." }, { status: 400 });
    }

    const context = await getFamilyContext(user.id);
    if (!context.family || context.userRole !== "ADMIN") {
      return NextResponse.json({ error: "Apenas administradores podem alterar funções de membros." }, { status: 403 });
    }

    const dataSource = await getDataSource();
    const memberRepo = dataSource.getRepository(FamilyMember);

    const member = await memberRepo.findOne({
      where: { id: params.id, family_id: context.family.id }
    });

    if (!member) {
      return NextResponse.json({ error: "Membro não encontrado neste grupo." }, { status: 404 });
    }

    // Cannot change owner role if member is owner
    if (member.user_id === context.family.owner_id) {
      return NextResponse.json({ error: "Não é possível alterar a função do proprietário da família." }, { status: 400 });
    }

    member.role = role as FamilyRole;
    await memberRepo.save(member);

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("PATCH Family Member Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar função do membro" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const context = await getFamilyContext(user.id);
    if (!context.family) {
      return NextResponse.json({ error: "Grupo familiar não encontrado." }, { status: 404 });
    }

    const dataSource = await getDataSource();
    const memberRepo = dataSource.getRepository(FamilyMember);
    const familyRepo = dataSource.getRepository(Family);

    const member = await memberRepo.findOne({
      where: { id: params.id, family_id: context.family.id }
    });

    if (!member) {
      return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 });
    }

    // Check permissions: either user is removing themselves (leaving) OR user is ADMIN
    const isSelf = member.user_id === user.id;
    const isAdmin = context.userRole === "ADMIN";

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: "Você não tem permissão para remover este membro." }, { status: 403 });
    }

    // Owner leaving deletes the family or transfers ownership
    if (isSelf && context.family.owner_id === user.id) {
      // Delete family
      await familyRepo.remove(context.family);
      return NextResponse.json({ success: true, message: "Grupo familiar excluído com sucesso." });
    }

    await memberRepo.remove(member);
    return NextResponse.json({ success: true, message: "Membro removido do grupo familiar." });
  } catch (error) {
    console.error("DELETE Family Member Error:", error);
    return NextResponse.json({ error: "Erro ao remover membro" }, { status: 500 });
  }
}
