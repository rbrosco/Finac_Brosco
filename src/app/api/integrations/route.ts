export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);

    let config = await configRepo.findOne({ where: { user_id: user.id } });
    if (!config) {
      // Create default integration config for the user
      config = configRepo.create({
        user_id: user.id,
        evolution_api_url: "http://localhost:9002",
        evolution_api_key: process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob",
        evolution_instance_name: "finac_instance",
        webhook_secret: `secret_finac_${user.id.substring(0, 8)}`,
        is_whatsapp_enabled: true,
        is_n8n_enabled: true,
        notify_on_created: true,
        notify_on_due: true,
      });
      await configRepo.save(config);
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("GET Integration Config Error:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações de integração" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);

    let config = await configRepo.findOne({ where: { user_id: user.id } });
    if (!config) {
      config = configRepo.create({ user_id: user.id });
    }

    if (body.evolution_api_url !== undefined) config.evolution_api_url = body.evolution_api_url.trim();
    if (body.evolution_api_key !== undefined) config.evolution_api_key = body.evolution_api_key.trim();
    if (body.evolution_instance_name !== undefined) config.evolution_instance_name = body.evolution_instance_name.trim();
    if (body.whatsapp_number !== undefined) config.whatsapp_number = body.whatsapp_number ? body.whatsapp_number.trim() : null;
    if (body.n8n_webhook_url !== undefined) config.n8n_webhook_url = body.n8n_webhook_url ? body.n8n_webhook_url.trim() : null;
    if (body.webhook_secret !== undefined) config.webhook_secret = body.webhook_secret.trim();
    if (body.is_whatsapp_enabled !== undefined) config.is_whatsapp_enabled = Boolean(body.is_whatsapp_enabled);
    if (body.is_n8n_enabled !== undefined) config.is_n8n_enabled = Boolean(body.is_n8n_enabled);
    if (body.notify_on_created !== undefined) config.notify_on_created = Boolean(body.notify_on_created);
    if (body.notify_on_due !== undefined) config.notify_on_due = Boolean(body.notify_on_due);

    if (body.ai_provider !== undefined) config.ai_provider = body.ai_provider.trim();
    if (body.ai_base_url !== undefined) config.ai_base_url = body.ai_base_url.trim();
    if (body.ai_api_key !== undefined) config.ai_api_key = body.ai_api_key ? body.ai_api_key.trim() : null;
    if (body.ai_model !== undefined) config.ai_model = body.ai_model.trim();
    if (body.ai_prompt_instructions !== undefined) config.ai_prompt_instructions = body.ai_prompt_instructions ? body.ai_prompt_instructions.trim() : null;
    if (body.is_ai_enabled !== undefined) config.is_ai_enabled = Boolean(body.is_ai_enabled);

    await configRepo.save(config);
    return NextResponse.json(config);
  } catch (error) {
    console.error("POST Integration Config Error:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações de integração" }, { status: 500 });
  }
}
