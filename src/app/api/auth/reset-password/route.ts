import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import { PasswordResetToken } from "@/lib/db/entities/PasswordResetToken";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token e nova senha são obrigatórios." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const tokenRepo = dataSource.getRepository(PasswordResetToken);
    const userRepo = dataSource.getRepository(User);

    const resetTokenRecord = await tokenRepo.findOne({
      where: { token },
      relations: ["user"],
    });

    if (!resetTokenRecord || resetTokenRecord.expires_at < new Date()) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
    }

    const user = resetTokenRecord.user;
    user.password_hash = hashPassword(newPassword);
    await userRepo.save(user);

    // Delete token after use
    await tokenRepo.remove(resetTokenRecord);

    return NextResponse.json({ success: true, message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Erro ao redefinir senha." }, { status: 500 });
  }
}
