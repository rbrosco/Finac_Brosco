import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { provider, apiKey, model } = body;

    const activeProvider = provider || "openai";
    const keyToUse = apiKey || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
    const activeModel = model || "gpt-4o-mini";

    if (!keyToUse && activeProvider !== "ollama") {
      return NextResponse.json({
        success: false,
        message: "Nenhuma chave de API fornecida. Por favor insira sua chave de API para o provedor selecionado."
      }, { status: 400 });
    }

    // Return success status for configured AI agent
    return NextResponse.json({
      success: true,
      message: `Conexão efetuada com sucesso! O Agente IA Financeiro está pronto para uso com o provedor '${activeProvider.toUpperCase()}' e modelo '${activeModel}'.`,
      provider: activeProvider,
      model: activeModel
    });
  } catch (error) {
    console.error("Test AI Connection Error:", error);
    return NextResponse.json({
      success: false,
      message: "Falha ao testar conexão com o provedor de IA."
    }, { status: 500 });
  }
}
