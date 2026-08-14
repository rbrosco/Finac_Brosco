import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import { hashPassword, generateToken, setAuthCookie } from "@/lib/auth";
import { createDefaultCategories } from "@/lib/db/seed";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);

    const existing = await userRepo.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 400 });
    }

    const user = userRepo.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hashPassword(password),
    });

    await userRepo.save(user);

    // Initialize default categories for the user
    await createDefaultCategories(dataSource, user.id);

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
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Erro ao realizar cadastro." }, { status: 500 });
  }
}
