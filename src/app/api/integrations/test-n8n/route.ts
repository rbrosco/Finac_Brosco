export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import { dispatchOutboundWebhook } from "@/lib/services/webhook";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const dataSource = await getDataSource();
    const configRepo = dataSource.getRepository(IntegrationConfig);
    const config = await configRepo.findOne({ where: { user_id: user.id } });

    if (!config || !config.n8n_webhook_url) {
      return NextResponse.json({ error: "URL do Webhook n8n não configurada." }, { status: 400 });
    }

    const testPayload = {
      user: { id: user.id, name: user.name, email: user.email },
      action: "test_connection",
      message: "Webhook de teste disparado com sucesso do Finac Brosco para o n8n!",
      sample_transaction: {
        title: "Compra Teste n8n",
        amount: 150.00,
        type: "variable_expense",
        status: "paid"
      }
    };

    const result = await dispatchOutboundWebhook(config, "test.connection", testPayload);

    if (result && result.ok) {
      return NextResponse.json({
        success: true,
        message: `Webhook n8n disparado com sucesso! Resposta HTTP ${result.status}.`,
        result,
      });
    } else {
      return NextResponse.json({
        error: `O webhook n8n respondeu com erro (HTTP ${result?.status || 500}). Verifique a URL do n8n.`,
        result,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Test n8n Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao conectar com n8n Webhook." }, { status: 500 });
  }
}
