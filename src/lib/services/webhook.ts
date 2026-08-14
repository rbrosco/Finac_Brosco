import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";

export async function dispatchOutboundWebhook(
  config: Partial<IntegrationConfig>,
  event: string,
  data: any
) {
  if (!config.is_n8n_enabled || !config.n8n_webhook_url) {
    return null;
  }

  const webhookUrl = config.n8n_webhook_url;
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    secret: config.webhook_secret || "secret_finac_token_123",
    data,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Finac-Event": event,
        "X-Finac-Secret": config.webhook_secret || "secret_finac_token_123",
      },
      body: JSON.stringify(payload),
    });

    return {
      status: res.status,
      ok: res.ok,
    };
  } catch (err: any) {
    console.error("Outbound Webhook Error:", err.message);
    return {
      status: 500,
      ok: false,
      error: err.message,
    };
  }
}
