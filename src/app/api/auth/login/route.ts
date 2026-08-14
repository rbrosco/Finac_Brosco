import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import { comparePassword, generateToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);

    const user = await userRepo.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    const isMatch = comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Erro interno no login." }, { status: 500 });
  }
}
