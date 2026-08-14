import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";

export async function POST() {
  removeAuthCookie();
  return NextResponse.json({ success: true, message: "Sessão encerrada com sucesso." });
}
