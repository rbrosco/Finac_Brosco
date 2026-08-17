import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import { POST as evolutionWebhookHandler } from "@/app/api/webhooks/evolution/route";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { messageText, imageUrl } = body;

    if (!messageText && !imageUrl) {
      return NextResponse.json({ error: "Informe o texto ou URL da imagem da mensagem de teste" }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);

    let config = await configRepo.findOne({ where: { user_id: user.id } });
    if (!config) {
      config = configRepo.create({
        user_id: user.id,
        whatsapp_number: "5511999999999",
        evolution_keyword: "finac",
        require_keyword: true
      });
      await configRepo.save(config);
    }

    const mockMessage: any = {
      conversation: messageText || ""
    };

    if (imageUrl) {
      mockMessage.imageMessage = {
        url: imageUrl,
        caption: messageText || "finac cupom"
      };
    }

    const mockWebhookPayload = {
      event: "messages.upsert",
      data: {
        key: {
          remoteJid: `${config.whatsapp_number || "5511999999999"}@s.whatsapp.net`,
          fromMe: false,
          id: `SIMULATED_${Date.now()}`
        },
        message: mockMessage
      }
    };

    const simulatedReq = new NextRequest("http://localhost:3000/api/webhooks/evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockWebhookPayload)
    });

    const res = await evolutionWebhookHandler(simulatedReq);
    const data = await res.json();

    return NextResponse.json({
      status: res.status,
      simulatedResult: data
    });
  } catch (error: any) {
    console.error("Test Evolution Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Erro no simulador de webhook Evolution" }, { status: 500 });
  }
}
