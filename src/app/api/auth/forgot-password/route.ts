import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import { PasswordResetToken } from "@/lib/db/entities/PasswordResetToken";
import randomstring from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);
    const tokenRepo = dataSource.getRepository(PasswordResetToken);

    const user = await userRepo.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Return success to avoid email enumeration
      return NextResponse.json({ message: "Se o e-mail existir em nosso sistema, um código de recuperação foi gerado." });
    }

    const resetToken = randomstring.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await tokenRepo.save(tokenRepo.create({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt,
    }));

    return NextResponse.json({
      message: "Código de recuperação gerado com sucesso.",
      // For demo / test convenience, return token so user can test reset without external SMTP
      resetToken,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Erro ao processar solicitação." }, { status: 500 });
  }
}
