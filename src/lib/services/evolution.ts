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
