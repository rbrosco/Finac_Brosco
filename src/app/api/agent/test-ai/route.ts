import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { resolveAiBaseUrl } from "@/lib/services/ai-agent";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { provider, apiKey, baseUrl, model, prompt } = body;

    const activeProvider = (provider || "openai").toLowerCase();
    const keyToUse = apiKey || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || "";
    const activeModel = model || (activeProvider === "openai" ? "gpt-4o-mini" : activeProvider === "groq" ? "llama-3.3-70b-versatile" : activeProvider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini");
    const endpoint = resolveAiBaseUrl(activeProvider, baseUrl);

    if (!keyToUse && activeProvider !== "ollama" && activeProvider !== "lmstudio") {
      return NextResponse.json({
        success: false,
        message: "Nenhuma chave de API fornecida. Insira sua chave de API para o provedor selecionado."
      }, { status: 400 });
    }

    let replyMessage = "";

    if (activeProvider === "gemini") {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${keyToUse}`;
      const testPrompt = prompt ? `Prompt do sistema: ${prompt}\n\nResponda resumidamente 'Conexão OK!'.` : "Responda resumidamente 'Conexão OK!'.";

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: testPrompt }] }] }),
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({
          success: false,
          message: `Erro na API do Gemini (${res.status}): ${errText.substring(0, 150)}`
        }, { status: 400 });
      }

      const data = await res.json();
      replyMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "Conexão Gemini OK!";
    } else {
      const url = endpoint.endsWith("/chat/completions") ? endpoint : `${endpoint}/chat/completions`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (keyToUse) headers["Authorization"] = `Bearer ${keyToUse}`;

      const sysMsg = prompt || "Você é um assistente financeiro de teste. Responda 'Conexão OK!'.";

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: "system", content: sysMsg },
            { role: "user", content: "Olá, teste de conexão da IA." }
          ],
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({
          success: false,
          message: `Erro no provedor ${activeProvider.toUpperCase()} (${res.status}): ${errText.substring(0, 150)}`
        }, { status: 400 });
      }

      const data = await res.json();
      replyMessage = data.choices?.[0]?.message?.content || "Conexão OK!";
    }

    return NextResponse.json({
      success: true,
      message: `Conexão efetuada com sucesso! Resposta da IA: "${replyMessage.trim().substring(0, 120)}"`,
      provider: activeProvider,
      model: activeModel,
      reply: replyMessage
    });
  } catch (error: any) {
    console.error("Test AI Connection Error:", error);
    return NextResponse.json({
      success: false,
      message: `Falha ao conectar com o provedor de IA: ${error.message || "Erro de timeout ou rede"}`
    }, { status: 500 });
  }
}
