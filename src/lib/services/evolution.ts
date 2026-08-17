import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";
import { TransactionType } from "@/lib/db/entities/Transaction";

export async function sendWhatsAppMessage(
  config: Partial<IntegrationConfig>,
  targetNumber: string,
  message: string
) {
  const baseUrl = (config.evolution_api_url || "http://localhost:9002").replace(/\/$/, "");
  const apiKey = config.evolution_api_key || process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob";
  const instance = config.evolution_instance_name || "finac_instance";

  const cleanNumber = targetNumber.replace(/\D/g, "");
  if (!cleanNumber) {
    throw new Error("Número do WhatsApp inválido.");
  }

  const endpoint = `${baseUrl}/message/sendText/${instance}`;

  const payload = {
    number: cleanNumber,
    options: {
      delay: 1200,
      presence: "composing",
      linkPreview: false,
    },
    text: message,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": apiKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3000), // 3-second timeout
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha no envio WhatsApp (Status ${response.status}): ${errText}`);
  }

  return response.json();
}

/**
 * Sends image, receipt media or document back to WhatsApp via Evolution API.
 */
export async function sendWhatsAppMedia(
  config: Partial<IntegrationConfig>,
  targetNumber: string,
  mediaUrlOrBase64: string,
  caption?: string,
  mediaType: "image" | "document" | "audio" = "image"
) {
  const baseUrl = (config.evolution_api_url || "http://localhost:9002").replace(/\/$/, "");
  const apiKey = config.evolution_api_key || process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob";
  const instance = config.evolution_instance_name || "finac_instance";

  const cleanNumber = targetNumber.replace(/\D/g, "");
  if (!cleanNumber) return;

  const endpoint = `${baseUrl}/message/sendMedia/${instance}`;

  const payload = {
    number: cleanNumber,
    options: {
      delay: 1000,
      presence: "composing",
    },
    mediaMessage: {
      mediatype: mediaType,
      caption: caption || "",
      media: mediaUrlOrBase64,
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return await res.json();
  } catch (err: any) {
    console.warn("sendWhatsAppMedia warning:", err.message);
  }
}

/**
 * Creates instance on Evolution API and configures webhook automatically.
 */
export async function createEvolutionInstance(
  config: Partial<IntegrationConfig>,
  webhookUrl: string
) {
  const baseUrl = (config.evolution_api_url || "http://localhost:9002").replace(/\/$/, "");
  const apiKey = config.evolution_api_key || process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob";
  const instance = (config.evolution_instance_name || "finac_instance").trim();

  const endpoint = `${baseUrl}/instance/create`;

  const payload = {
    instanceName: instance,
    token: apiKey,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
    webhook: webhookUrl,
    webhook_by_events: false,
    events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE"]
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });
    return await res.json();
  } catch (err: any) {
    console.warn("Create Evolution Instance Warning:", err.message);
    return null;
  }
}

/**
 * Connects to Evolution API and fetches QR Code base64 image.
 */
export async function fetchEvolutionQRCode(config: Partial<IntegrationConfig>) {
  const baseUrl = (config.evolution_api_url || "http://localhost:9002").replace(/\/$/, "");
  const apiKey = config.evolution_api_key || process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob";
  const instance = (config.evolution_instance_name || "finac_instance").trim();

  const endpoint = `${baseUrl}/instance/connect/${instance}`;

  let res = await fetch(endpoint, {
    method: "GET",
    headers: { "apikey": apiKey },
    signal: AbortSignal.timeout(5000)
  });

  // If instance does not exist on server (404/400), create it automatically on the fly!
  if (res.status === 404 || res.status === 400) {
    await createEvolutionInstance(config, "http://localhost:3000/api/webhooks/evolution");
    res = await fetch(endpoint, {
      method: "GET",
      headers: { "apikey": apiKey },
      signal: AbortSignal.timeout(5000)
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Falha ao obter QR Code (Status ${res.status}): ${errText}`);
  }

  const data = await res.json();
  
  let base64 = data.base64 || data.qrcode?.base64 || data.code || "";
  let pairingCode = data.pairingCode || data.code || "";

  if (base64 && !base64.startsWith("data:")) {
    base64 = `data:image/png;base64,${base64}`;
  }

  return {
    base64,
    pairingCode,
    raw: data
  };
}

/**
 * Gets connection status of the instance from Evolution API.
 */
export async function getEvolutionInstanceStatus(config: Partial<IntegrationConfig>) {
  const baseUrl = (config.evolution_api_url || "http://localhost:9002").replace(/\/$/, "");
  const apiKey = config.evolution_api_key || process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob";
  const instance = (config.evolution_instance_name || "finac_instance").trim();

  const endpoint = `${baseUrl}/instance/connectionState/${instance}`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { "apikey": apiKey },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) {
      return { state: "disconnected", instance: null };
    }

    const data = await res.json();
    const stateStr = data.instance?.state || data.state || "close";
    
    return {
      state: stateStr === "open" ? "connected" : stateStr === "connecting" ? "connecting" : "disconnected",
      raw: data
    };
  } catch (err: any) {
    return { state: "disconnected", error: err.message };
  }
}

/**
 * Logout / disconnect WhatsApp instance.
 */
export async function logoutEvolutionInstance(config: Partial<IntegrationConfig>) {
  const baseUrl = (config.evolution_api_url || "http://localhost:9002").replace(/\/$/, "");
  const apiKey = config.evolution_api_key || process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob";
  const instance = (config.evolution_instance_name || "finac_instance").trim();

  const endpoint = `${baseUrl}/instance/logout/${instance}`;

  try {
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { "apikey": apiKey },
      signal: AbortSignal.timeout(5000)
    });
    return await res.json();
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Restart Evolution API Instance.
 */
export async function restartEvolutionInstance(config: Partial<IntegrationConfig>) {
  const baseUrl = (config.evolution_api_url || "http://localhost:9002").replace(/\/$/, "");
  const apiKey = config.evolution_api_key || process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob";
  const instance = (config.evolution_instance_name || "finac_instance").trim();

  const endpoint = `${baseUrl}/instance/restart/${instance}`;

  try {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "apikey": apiKey },
      signal: AbortSignal.timeout(5000)
    });
    return await res.json();
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Delete Evolution API Instance from server.
 */
export async function deleteEvolutionInstance(config: Partial<IntegrationConfig>) {
  const baseUrl = (config.evolution_api_url || "http://localhost:9002").replace(/\/$/, "");
  const apiKey = config.evolution_api_key || process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob";
  const instance = (config.evolution_instance_name || "finac_instance").trim();

  const endpoint = `${baseUrl}/instance/delete/${instance}`;

  try {
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { "apikey": apiKey },
      signal: AbortSignal.timeout(5000)
    });
    return await res.json();
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * List all existing instances from Evolution API.
 */
export async function fetchEvolutionInstances(config: Partial<IntegrationConfig>) {
  const baseUrl = (config.evolution_api_url || "http://localhost:9002").replace(/\/$/, "");
  const apiKey = config.evolution_api_key || process.env.EVOLUTION_API_KEY || "evo_fbpzwxq9n7squlurxxwpioob";

  const endpoint = `${baseUrl}/instance/fetchInstances`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { "apikey": apiKey },
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.instances || [];
  } catch {
    return [];
  }
}

export interface ParsedTransactionText {
  title: string;
  amount: number;
  type: TransactionType;
  categoryHint: string;
}

export function parseNaturalLanguageTransaction(text: string): ParsedTransactionText | null {
  if (!text) return null;

  const lower = text.toLowerCase().trim();

  // Extract amount
  const amountMatch = lower.match(/(?:r\$\s*|valor\s*|de\s*)?(\d+(?:[.,]\d{1,2})?)/);
  if (!amountMatch) return null;

  const rawAmountStr = amountMatch[1].replace(",", ".");
  const amount = parseFloat(rawAmountStr);
  if (isNaN(amount) || amount <= 0) return null;

  let type: TransactionType = TransactionType.VARIABLE_EXPENSE;
  let categoryHint = "Outras Despesas";

  // Check type
  if (lower.includes("recebi") || lower.includes("ganhei") || lower.includes("salário") || lower.includes("rendimento") || lower.includes("entrada") || lower.includes("freela")) {
    type = TransactionType.INCOME;
    categoryHint = lower.includes("freela") ? "Freelance" : lower.includes("salário") ? "Salário" : "Outras Receitas";
  } else if (lower.includes("fixo") || lower.includes("fixa") || lower.includes("aluguel") || lower.includes("condomínio") || lower.includes("plano") || lower.includes("mensalidade")) {
    type = TransactionType.FIXED_EXPENSE;
    categoryHint = lower.includes("aluguel") || lower.includes("condomínio") ? "Moradia" : lower.includes("plano") ? "Saúde & Farmácia" : "Assinaturas & Serviços";
  } else {
    type = TransactionType.VARIABLE_EXPENSE;
    if (lower.includes("mercado") || lower.includes("almoço") || lower.includes("jantar") || lower.includes("comida") || lower.includes("restaurante") || lower.includes("lanche")) {
      categoryHint = "Alimentação";
    } else if (lower.includes("uber") || lower.includes("gasolina") || lower.includes("posto") || lower.includes("combustível") || lower.includes("ônibus")) {
      categoryHint = "Transporte";
    } else if (lower.includes("remédio") || lower.includes("farmácia") || lower.includes("médico")) {
      categoryHint = "Saúde & Farmácia";
    } else if (lower.includes("cinema") || lower.includes("show") || lower.includes("jogos") || lower.includes("lazer")) {
      categoryHint = "Lazer & Cultura";
    }
  }

  // Extract clean title
  let title = text
    .replace(/(?:gastei|paguei|recebi|ganhei|lançar|despesa|receita|r\$|\d+(?:[.,]\d{1,2})?|no|na|de|com|em)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!title || title.length < 2) {
    title = type === TransactionType.INCOME ? "Receita via WhatsApp" : "Gasto via WhatsApp";
  }

  // Capitalize title
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    title,
    amount,
    type,
    categoryHint,
  };
}
