import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Family } from "@/lib/db/entities/Family";
import { FamilyMember, FamilyRole, FamilyMemberStatus } from "@/lib/db/entities/FamilyMember";
import { getFamilyContext } from "@/lib/db/family-helper";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { inviteCode } = await req.json();
    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json({ error: "Código de convite é obrigatório." }, { status: 400 });
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    const dataSource = await getDataSource();
    const familyRepo = dataSource.getRepository(Family);
    const memberRepo = dataSource.getRepository(FamilyMember);

    // Check if user is already in a family
    const currentContext = await getFamilyContext(user.id);
    if (currentContext.family) {
      return NextResponse.json({ error: "Você já pertence a um grupo familiar. Saia do grupo atual antes de entrar em outro." }, { status: 400 });
    }

    const family = await familyRepo.findOne({ where: { invite_code: cleanCode } });
    if (!family) {
      return NextResponse.json({ error: "Código de convite inválido ou expirado." }, { status: 404 });
    }

    // Check if member entry already exists
    let member = await memberRepo.findOne({
      where: { family_id: family.id, user_id: user.id }
    });

    if (member) {
      if (member.status === FamilyMemberStatus.ACCEPTED) {
        return NextResponse.json({ error: "Você já é um membro deste grupo familiar." }, { status: 400 });
      }
      member.status = FamilyMemberStatus.ACCEPTED;
    } else {
      member = memberRepo.create({
        family_id: family.id,
        user_id: user.id,
        role: FamilyRole.MEMBER,
        status: FamilyMemberStatus.ACCEPTED,
      });
    }

    await memberRepo.save(member);

    const updatedContext = await getFamilyContext(user.id);
    return NextResponse.json(updatedContext);
  } catch (error) {
    console.error("POST Family Join Error:", error);
    return NextResponse.json({ error: "Erro ao entrar no grupo familiar" }, { status: 500 });
  }
}
