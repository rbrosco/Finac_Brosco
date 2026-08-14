export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import { sendWhatsAppMessage } from "@/lib/services/evolution";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { targetNumber } = await req.json();

    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);
    const config = await configRepo.findOne({ where: { user_id: user.id } });

    if (!config) {
      return NextResponse.json({ error: "Configurações de integração não encontradas." }, { status: 400 });
    }

    const numberToSend = targetNumber || config.whatsapp_number;
    if (!numberToSend) {
      return NextResponse.json({ error: "Informe o número de WhatsApp com DDD para teste." }, { status: 400 });
    }

    const testMessage = `🤖 *Finac Brosco - Teste de Integração WhatsApp*\n\nOlá *${user.name}*!\n\nA integração do seu sistema financeiro com a Evolution API está funcionando com sucesso! 🎉\n\n📌 *Instância:* ${config.evolution_instance_name}\n⏰ *Data:* ${new Date().toLocaleString("pt-BR")}`;

    const result = await sendWhatsAppMessage(config, numberToSend, testMessage);

    return NextResponse.json({
      success: true,
      message: "Mensagem de teste enviada com sucesso para o WhatsApp!",
      result,
    });
  } catch (error: any) {
    console.error("Test WhatsApp Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao conectar com Evolution API." }, { status: 500 });
  }
}
