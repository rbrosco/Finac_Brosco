import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Family } from "@/lib/db/entities/Family";
import { FamilyMember, FamilyRole, FamilyMemberStatus } from "@/lib/db/entities/FamilyMember";
import { getFamilyContext } from "@/lib/db/family-helper";
import { randomBytes } from "crypto";

function generateInviteCode(): string {
  const bytes = randomBytes(4).toString("hex").toUpperCase();
  return `FAM-${bytes}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const context = await getFamilyContext(user.id);
    return NextResponse.json(context);
  } catch (error) {
    console.error("GET Family Error:", error);
    return NextResponse.json({ error: "Erro ao carregar dados da família" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { name } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "O nome do grupo familiar é obrigatório." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const familyRepo = dataSource.getRepository(Family);
    const memberRepo = dataSource.getRepository(FamilyMember);

    // Check if user already owns or belongs to a family
    const existingContext = await getFamilyContext(user.id);
    if (existingContext.family) {
      return NextResponse.json({ error: "Você já faz parte de um grupo familiar." }, { status: 400 });
    }

    let inviteCode = generateInviteCode();
    let codeExists = await familyRepo.findOne({ where: { invite_code: inviteCode } });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await familyRepo.findOne({ where: { invite_code: inviteCode } });
    }

    const family = familyRepo.create({
      name: name.trim(),
      owner_id: user.id,
      invite_code: inviteCode,
    });

    await familyRepo.save(family);

    // Add creator as ADMIN member
    const ownerMember = memberRepo.create({
      family_id: family.id,
      user_id: user.id,
      role: FamilyRole.ADMIN,
      status: FamilyMemberStatus.ACCEPTED,
    });

    await memberRepo.save(ownerMember);

    const updatedContext = await getFamilyContext(user.id);
    return NextResponse.json(updatedContext, { status: 201 });
  } catch (error) {
    console.error("POST Family Error:", error);
    return NextResponse.json({ error: "Erro ao criar grupo familiar" }, { status: 500 });
  }
}
