import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { provider, baseUrl, apiKey } = body;

    const activeProvider = provider || "openai";
    let targetUrl = baseUrl?.trim();

    // Default URLs per provider
    if (!targetUrl) {
      if (activeProvider === "lmstudio") targetUrl = "http://localhost:1234/v1";
      else if (activeProvider === "ollama") targetUrl = "http://localhost:11434";
      else if (activeProvider === "groq") targetUrl = "https://api.groq.com/openai/v1";
      else if (activeProvider === "deepseek") targetUrl = "https://api.deepseek.com/v1";
      else targetUrl = "https://api.openai.com/v1";
    }

    // Clean trailing slashes
    targetUrl = targetUrl.replace(/\/+$/, "");

    let modelList: string[] = [];

    // 1. Google Gemini Provider
    if (activeProvider === "gemini") {
      if (!apiKey) {
        return NextResponse.json({ error: "Chave de API do Gemini não fornecida." }, { status: 400 });
      }
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const res = await fetch(geminiEndpoint, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `Erro na API do Gemini (${res.status}): ${err}` }, { status: res.status });
      }
      const data = await res.json();
      if (Array.isArray(data.models)) {
        modelList = data.models
          .map((m: any) => m.name.replace(/^models\//, ""))
          .filter((name: string) => name.includes("gemini"));
      }
    }
    // 2. Ollama Provider
    else if (activeProvider === "ollama") {
      const ollamaEndpoint = `${targetUrl}/api/tags`;
      const res = await fetch(ollamaEndpoint, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) {
        return NextResponse.json({ error: `Falha ao conectar no Ollama (${res.status}). Verifique se o servidor está rodando em ${targetUrl}` }, { status: res.status });
      }
      const data = await res.json();
      if (Array.isArray(data.models)) {
        modelList = data.models.map((m: any) => m.name || m.model);
      }
    }
    // 3. LM Studio / OpenAI / Groq / DeepSeek / Generic OpenAI-Compatible
    else {
      const modelsEndpoint = targetUrl.endsWith("/models") ? targetUrl : `${targetUrl}/models`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const res = await fetch(modelsEndpoint, { headers, signal: AbortSignal.timeout(6000) });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({
          error: `Falha ao listar modelos do servidor (${res.status}). Verifique a URL '${modelsEndpoint}' e sua Chave de API.`
        }, { status: res.status });
      }

      const data = await res.json();
      if (Array.isArray(data.data)) {
        modelList = data.data.map((m: any) => m.id);
      } else if (Array.isArray(data.models)) {
        modelList = data.models.map((m: any) => m.id || m.name);
      }
    }

    if (modelList.length === 0) {
      modelList = ["gpt-4o-mini", "gpt-4o", "llama-3.3-70b-versatile"];
    }

    return NextResponse.json({
      success: true,
      provider: activeProvider,
      count: modelList.length,
      models: modelList
    });
  } catch (error: any) {
    console.error("Fetch Models Error:", error);
    return NextResponse.json({
      error: `Erro ao buscar lista de modelos: ${error.message || "Servidor inacessível."}`
    }, { status: 500 });
  }
}
