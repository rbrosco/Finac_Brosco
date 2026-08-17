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

    const body = await req.json();
    const { targetNumber, evolution_api_url, evolution_api_key, evolution_instance_name } = body;

    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);
    let config = await configRepo.findOne({ where: { user_id: user.id } });

    if (!config) {
      config = configRepo.create({ user_id: user.id });
    }

    const effectiveConfig: Partial<IntegrationConfig> = {
      ...config,
      evolution_api_url: evolution_api_url ? evolution_api_url.trim() : config.evolution_api_url,
      evolution_api_key: evolution_api_key ? evolution_api_key.trim() : config.evolution_api_key,
      evolution_instance_name: evolution_instance_name ? evolution_instance_name.trim() : config.evolution_instance_name,
    };

    const numberToSend = targetNumber || effectiveConfig.whatsapp_number;
    if (!numberToSend) {
      return NextResponse.json({ error: "Informe o número de WhatsApp com DDD para teste." }, { status: 400 });
    }

    const testMessage = `🤖 *Finac Brosco - Teste de Integração WhatsApp*\n\nOlá *${user.name}*!\n\nA integração do seu sistema financeiro com a Evolution API está funcionando com sucesso! 🎉\n\n📌 *Instância:* ${effectiveConfig.evolution_instance_name}\n⏰ *Data:* ${new Date().toLocaleString("pt-BR")}`;

    const result = await sendWhatsAppMessage(effectiveConfig, numberToSend, testMessage);

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
