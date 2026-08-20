import { Category, CategoryType } from "@/lib/db/entities/Category";
import { Account } from "@/lib/db/entities/Account";
import { TransactionType } from "@/lib/db/entities/Transaction";
import { IntegrationConfig } from "@/lib/db/entities/IntegrationConfig";

export interface AnalyzedReceiptResult {
  title: string;
  amount: number;
  type: TransactionType;
  due_date: string;
  category_id?: string | null;
  account_id?: string | null;
  user_id?: string | null;
  confidence: number;
  extracted_text_summary: string;
  establishment?: string;
  payment_method?: string;
}

export interface ParsedStatementItem {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  due_date: string;
  category_id?: string | null;
  account_id?: string | null;
  user_id?: string | null;
  selected: boolean;
  raw_text?: string;
}

export function resolveAiBaseUrl(provider?: string | null, rawBaseUrl?: string | null): string {
  const p = (provider || "lmstudio").toLowerCase();
  const customUrl = rawBaseUrl ? rawBaseUrl.trim().replace(/\/+$/, "") : "";
  if (customUrl) return customUrl;

  switch (p) {
    case "openai":
      return "https://api.openai.com/v1";
    case "groq":
      return "https://api.groq.com/openai/v1";
    case "deepseek":
      return "https://api.deepseek.com/v1";
    case "ollama":
      return "http://localhost:11434/v1";
    case "lmstudio":
    default:
      return "http://localhost:1234/v1";
  }
}

/**
 * Calls configured LLM provider (LM Studio, OpenAI, Gemini, Groq, DeepSeek, Ollama) to extract financial JSON.
 */
async function callAiCompletion(
  config: IntegrationConfig | null,
  content: string,
  fileData?: string
): Promise<Partial<AnalyzedReceiptResult> | null> {
  if (!config || !config.is_ai_enabled) return null;

  const provider = (config.ai_provider || "lmstudio").toLowerCase();
  const baseUrl = resolveAiBaseUrl(provider, config.ai_base_url);
  const apiKey = config.ai_api_key || "";
  const model = config.ai_model || (provider === "openai" ? "gpt-4o-mini" : provider === "groq" ? "llama-3.3-70b-versatile" : provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini");

  const systemPrompt = config.ai_prompt_instructions ||
    "Você é um assistente financeiro especialista em OCR de notas fiscais, cupons e recibos bancários. Analise com atenção a imagem/texto e extraia o nome do estabelecimento/loja (title), o valor total final pago (amount), o tipo ('variable_expense', 'fixed_expense' ou 'income') e a data ('YYYY-MM-DD'). Responda EXATAMENTE um objeto JSON válido no formato: {\"title\": \"...\", \"amount\": 45.0, \"type\": \"variable_expense\", \"due_date\": \"2026-08-16\"}. Não inclua texto adicional além do JSON.";

  try {
    let imageUrl = fileData || "";
    if (imageUrl && !imageUrl.startsWith("data:") && !imageUrl.startsWith("http")) {
      imageUrl = `data:image/jpeg;base64,${imageUrl}`;
    }

    if (provider === "gemini" && apiKey) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const parts: any[] = [{ text: `${systemPrompt}\n\nAnalise o comprovante contido nesta mensagem:` }];

      if (imageUrl.startsWith("data:")) {
        const mimeType = imageUrl.substring(imageUrl.indexOf(":") + 1, imageUrl.indexOf(";")) || "image/jpeg";
        const base64Data = imageUrl.split(",")[1];
        parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
      } else if (content) {
        parts.push({ text: content });
      }

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const data = await res.json();
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) return parseJsonFromAiResponse(txt);
      }
    } else {
      // OpenAI-compatible (/v1/chat/completions) for LM Studio, Groq, OpenAI, DeepSeek, Ollama
      const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      let userContent: any = content || "Analise a imagem deste comprovante, cupom fiscal ou extrato bancário:";
      if (imageUrl) {
        userContent = [
          { type: "text", text: content || "Analise o comprovante ou cupom fiscal contido nesta imagem:" },
          { type: "image_url", image_url: { url: imageUrl } }
        ];
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
          ],
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (res.ok) {
        const data = await res.json();
        const txt = data.choices?.[0]?.message?.content;
        if (txt) return parseJsonFromAiResponse(txt);
      }
    }
  } catch (err) {
    console.error("AI Completion Call Error:", err);
  }

  return null;
}

function parseJsonFromAiResponse(raw: string): Partial<AnalyzedReceiptResult> | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || "Comprovante IA",
        amount: typeof parsed.amount === "number" ? parsed.amount : parseFloat(parsed.amount) || 0,
        type: parsed.type === "income" ? TransactionType.INCOME : parsed.type === "fixed_expense" ? TransactionType.FIXED_EXPENSE : TransactionType.VARIABLE_EXPENSE,
        due_date: parsed.due_date || new Date().toISOString().split("T")[0]
      };
    }
  } catch {
    // Ignore JSON parse error and fallback
  }
  return null;
}

/**
 * Intelligent receipt and invoice document analyzer.
 * Processes receipt text, invoice OCR or image descriptions and extracts financial fields.
 */
export async function analyzeReceiptDocument(
  content: string,
  fileName: string = "",
  userCategories: Category[] = [],
  userAccounts: Account[] = [],
  config: IntegrationConfig | null = null,
  fileData?: string,
  familyUsers: any[] = []
): Promise<AnalyzedReceiptResult> {
  // If content is raw binary JPEG data (starts with non-ASCII or \xFF\xD8), ignore binary content string
  let safeContent = content;
  if (content.startsWith("\xFF\xD8") || content.startsWith("\x00") || content.includes("\uFFFD")) {
    safeContent = "";
  }

  const text = safeContent.toLowerCase();

  // Try LLM API Completion if enabled & configured (supports Vision base64 fileData!)
  const aiResult = await callAiCompletion(config, safeContent, fileData);
  if (aiResult && aiResult.amount && aiResult.amount > 0) {
    let category_id: string | null = null;
    if (userCategories.length > 0) {
      const cat = userCategories.find(c => aiResult.title?.toLowerCase().includes(c.name.toLowerCase()));
      category_id = cat ? cat.id : userCategories[0].id;
    }

    return {
      title: aiResult.title || "Comprovante Anexado",
      amount: aiResult.amount,
      type: aiResult.type || TransactionType.VARIABLE_EXPENSE,
      due_date: aiResult.due_date || new Date().toISOString().split("T")[0],
      category_id,
      account_id: userAccounts[0]?.id || null,
      confidence: 0.98,
      extracted_text_summary: `Analisado via IA (${config?.ai_provider?.toUpperCase()}): ${aiResult.title} - R$ ${aiResult.amount.toFixed(2)}`,
      establishment: aiResult.title
    };
  }

  // Try n8n OCR Webhook if enabled & configured
  if (config && config.is_n8n_enabled && config.n8n_webhook_url) {
    try {
      const n8nRes = await fetch(config.n8n_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "receipt_ocr",
          fileData,
          fileName,
          content: safeContent
        }),
        signal: AbortSignal.timeout(5000)
      });
      if (n8nRes.ok) {
        const n8nData = await n8nRes.json();
        if (n8nData && n8nData.amount && Number(n8nData.amount) > 0) {
          return {
            title: n8nData.title || n8nData.establishment || "Comprovante n8n",
            amount: Number(n8nData.amount),
            type: n8nData.type === "income" ? TransactionType.INCOME : TransactionType.VARIABLE_EXPENSE,
            due_date: n8nData.due_date || new Date().toISOString().split("T")[0],
            category_id: userCategories[0]?.id || null,
            account_id: userAccounts[0]?.id || null,
            confidence: 0.95,
            extracted_text_summary: `Analisado via n8n OCR: ${n8nData.title || "Comprovante"} - R$ ${Number(n8nData.amount).toFixed(2)}`,
            establishment: n8nData.establishment || n8nData.title
          };
        }
      }
    } catch (n8nErr: any) {
      console.warn("n8n OCR Webhook call warning:", n8nErr.message);
    }
  }

  // 1. Account / Bank Detection & Phrase Removal
  let workingText = content.toLowerCase();
  let account_id: string | null = null;

  // Search user accounts for matching keywords
  for (const acc of userAccounts) {
    const aName = acc.name.toLowerCase();
    const keywords = aName.split(/\s+/).filter(w => w.length >= 3 && !["conta", "corrente", "cartão", "banco"].includes(w));

    let matched = false;
    for (const kw of keywords) {
      if (workingText.includes(kw) || (kw.includes("itaú") && workingText.includes("itau")) || (kw.includes("itau") && workingText.includes("itaú"))) {
        account_id = acc.id;
        matched = true;
        break;
      }
    }
    if (matched) break;
  }

  // Remove bank, card, and user name phrases
  workingText = workingText
    .replace(/(?:no|na|pelo|pela|do|da)?\s*(?:banco|cartão|conta)?\s*(itaú|itau|nubank|bradesco|santander|inter|c6|caixa|bb|bancodobrasil|sicredi|sicoob|picpay|rogger|brosco|priscila|desplanches)\b/gi, " ")
    .replace(/\b(cartao|cartão|banco|conta|fatura)\b/gi, " ");

  // Fallback default account if none matched
  if (!account_id && userAccounts.length > 0) {
    account_id = userAccounts[0].id;
  }

  // 2. Date Extraction (from text or fileName) - extracted FIRST to avoid date numbers interfering with amount
  let due_date = new Date().toISOString().split("T")[0];
  const dateMatch = text.match(/(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})/) || fileName.match(/(\d{4})[-_](\d{2})[-_](\d{2})/);
  if (dateMatch) {
    if (dateMatch[1].length === 4) {
      due_date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    } else {
      due_date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
    workingText = workingText.replace(dateMatch[0], " ");
  }
  // 4. Type Detection (Income vs Expense)
  let type: TransactionType = TransactionType.VARIABLE_EXPENSE;
  if (text.includes("comprovante de recebimento") || text.includes("depósito recebido") || text.includes("pix recebido") || text.includes("transferência recebida") || text.includes("salário") || text.includes("remuneração") || text.includes("recebi")) {
    type = TransactionType.INCOME;
  } else if (text.includes("aluguel") || text.includes("condomínio") || text.includes("luz") || text.includes("energia") || text.includes("água") || text.includes("internet") || text.includes("assinatura") || text.includes("plano mensal")) {
    type = TransactionType.FIXED_EXPENSE;
  }

  // 3. Amount Extraction (supports 'R$ 3.369,96', 'R$ 388,36', 'R$ 145,31', 'total 149.90')
  let amount = 0;
  // Priority 1: Currency pattern with R$ or Reais or Total/Valor/Valor pago/Valor do documento
  const explicitCurrencyMatch = 
    workingText.match(/(?:r\$|brl|total|valor pago|valor do documento|valor)\s*:?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[\.,]\d{1,2})?)/i) ||
    workingText.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[\.,]\d{1,2})?)\s*(?:reais|real|conto|pila)/i);

  if (explicitCurrencyMatch) {
    const rawVal = explicitCurrencyMatch[1];
    let cleanVal = rawVal;
    if (rawVal.includes(",")) {
      cleanVal = rawVal.replace(/\./g, "").replace(",", ".");
    } else if (rawVal.split(".").length > 2) {
      cleanVal = rawVal.replace(/\./g, "");
    }
    const parsed = parseFloat(cleanVal);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
      workingText = workingText.replace(explicitCurrencyMatch[0], " ");
    }
  }

  // Priority 2: Standalone decimal value like '3.369,96' or '388,36' or '145,31'
  if (amount === 0) {
    const decimalMatch = workingText.match(/\b(\d{1,3}(?:\.\d{3})+,\d{2}|\d+[\.,]\d{2})\b/);
    if (decimalMatch) {
      const cleanVal = decimalMatch[1].replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleanVal);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        workingText = workingText.replace(decimalMatch[0], " ");
      }
    }
  }

  // Priority 3: Fallback single number
  if (amount === 0) {
    const anyNumMatch = workingText.match(/\b(\d+(?:[,\.]\d{1,2})?)\b/);
    if (anyNumMatch) {
      const cleanVal = anyNumMatch[1].replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleanVal);
      if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
        amount = parsed;
        workingText = workingText.replace(anyNumMatch[0], " ");
      }
    }
  }

  // Universal Bank Receipt Extractor (Nubank, Inter, Itaú, Bradesco, Santander, BB, Caixa, C6, etc.)
  let receiverName = "";
  let payerName = "";
  let transactionId = "";

  const receiverMatch = 
    text.match(/(?:nome do benefici[áa]rio|raz[ãa]o social do benefici[áa]rio|raz[ãa]o social|quem recebeu|recebedor|favorecido|destinat[áa]rio|empresa|institui[çc][ãa]o emissora)\s*(?:nome)?\s*:?\s*([a-z0-9\s\.\-]{3,50})/i) ||
    text.match(/(?:documento)\s*:?\s*(fatura[a-z0-9\s\.\-]{3,40})/i);

  if (receiverMatch) {
    receiverName = receiverMatch[1].replace(/(?:cpf|cnpj|institui[çc][ãa]o|banco|valor|data|hor[áa]rio|c[óo]digo).*/i, "").trim();
  }

  const payerMatch = text.match(/(?:nome do pagador|pagador|quem pagou|remetente|sacado)\s*(?:nome)?\s*:?\s*([a-z0-9\s\.\-]{3,50})/i);
  if (payerMatch) {
    payerName = payerMatch[1].replace(/(?:cpf|cnpj|institui[çc][ãa]o|banco|valor|data|hor[áa]rio|c[óo]digo).*/i, "").trim();
  }

  const txIdMatch = 
    text.match(/(?:autentica[çc][ãa]o digital|c[óo]digo de autentica[çc][ãa]o|id\s*(?:da)?\s*transa[çc][ãa]o|identificador)\s*:?\s*([a-z0-9\-\.]{10,60})/i) ||
    text.match(/(?:c[óo]digo de barras)\s*:?\s*([0-9\s]{20,60})/i);

  if (txIdMatch) {
    transactionId = txIdMatch[1].trim();
  }

  // 5. Clean Title & Strip Slang / Action / Price Verbs / Typos
  const wordsToIgnore = new Set([
    "gastei", "comprei", "paguei", "custou", "mandei", "fiz", "recebi", "transferi",
    "foi", "deu", "saiu", "ficou", "valor", "por", "com", "em", "de", "no", "na",
    "nos", "nas", "um", "uma", "uns", "umas", "pra", "para", "do", "da", "dos", "das",
    "reias", "reais", "real", "reis", "reai", "conto", "contos", "pila", "pilas", "pau", "paus",
    "barão", "barões", "brl", "r$", "banco", "cartão", "cartao", "conta", "fatura",
    "rogger", "brosco", "priscila", "desplanches", "identificado", "gasto", "registrado", "aunter", "sobre"
  ]);

  let title = "";
  if (receiverName) {
    title = receiverName.toUpperCase();
  } else {
    const tokens = workingText.split(/\s+/);
    const cleanTokens = tokens.filter(tok => {
      const clean = tok.replace(/[^a-zà-ú0-9]/gi, "");
      return clean.length >= 2 && !wordsToIgnore.has(clean) && !/^\d+$/.test(clean);
    });
    title = cleanTokens.join(" ");
  }

  // If title is empty and we have an image file, use 'Comprovante Anexado'
  if (!title && fileName) {
    if (fileName.toLowerCase().includes("whatsapp")) {
      title = "Comprovante WhatsApp";
    } else if (fileName.toLowerCase().includes("pix")) {
      title = "Comprovante PIX";
    } else {
      title = "Comprovante Anexado";
    }
  }

  // Keyword overrides for specific categories, telecom, and utility companies
  if (text.includes("ligga") || text.includes("telecom") || text.includes("claro") || text.includes("vivo") || text.includes("tim") || text.includes("oi")) {
    title = receiverName ? `Internet / Telecom (${receiverName.toUpperCase()})` : "Internet / Telefone";
  } else if (text.includes("copel") || text.includes("enel") || text.includes("light") || text.includes("cemig") || text.includes("cpfl") || text.includes("energisa")) {
    title = receiverName ? `Luz (${receiverName.toUpperCase()})` : "Conta de Luz / Energia";
  } else if (text.includes("sabesp") || text.includes("sanepar") || text.includes("copasa")) {
    title = receiverName ? `Água (${receiverName.toUpperCase()})` : "Conta de Água";
  } else if (text.includes("nubank") || text.includes("nu pagamentos")) {
    title = receiverName || "Fatura Cartão Nubank";
  } else if (text.includes("combustivel") || text.includes("combustível") || text.includes("gasolina") || text.includes("etanol") || text.includes("diesel")) {
    title = "Combustível / Posto";
  } else if (text.includes("supermercado") || text.includes("carrefour") || text.includes("pão de açúcar") || text.includes("extra") || text.includes("atacadao") || text.includes("assai")) {
    title = "Mercado / Supermercado";
  } else if (text.includes("drogaria") || text.includes("farmacia") || text.includes("farmácia") || text.includes("raia") || text.includes("drogasil")) {
    title = "Farmácia / Medicamentos";
  } else if (text.includes("uber") || text.includes("99app") || text.includes("cabify")) {
    title = "Corrida de Aplicativo";
  }

  if (title.length >= 2) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else {
    title = "Gasto Diversos";
  }

  // 6. Semantic Category Classifier
  let category_id: string | null = null;

  const semanticDictionary = [
    { keywords: ["copel", "enel", "light", "cemig", "cpfl", "energisa", "equatorial", "luz", "energia", "aluguel", "condomínio", "água", "sabesp", "sanepar", "iptu", "gás"], categoryKey: "moradia" },
    { keywords: ["ligga", "telecom", "claro", "vivo", "tim", "oi", "fatura", "cartão", "cartao", "netflix", "spotify", "prime", "disney", "hbo", "youtube", "icloud", "chatgpt"], categoryKey: "assinatura" },
    { keywords: ["pizza", "hamburguer", "lanche", "almoço", "jantar", "restaurante", "mcdonalds", "burger", "ifood", "rappi", "doce", "açougue", "mercado", "padaria", "comida", "bar", "cerveja", "café", "churrasco", "sushi", "açaí"], categoryKey: "alimentação" },
    { keywords: ["combustivel", "combustível", "gasolina", "etanol", "diesel", "posto", "uber", "99", "cabify", "estacionamento", "pedágio", "mecanico", "pneu", "ônibus", "metrô"], categoryKey: "transporte" },
    { keywords: ["farmacia", "farmácia", "remedio", "remédio", "drogaria", "médico", "dentista", "consulta", "exame", "hospital", "suplemento"], categoryKey: "saúde" },
    { keywords: ["cinema", "teatro", "show", "festa", "viagem", "hotel", "passagem", "jogo", "steam", "playstation", "xbox", "parque"], categoryKey: "lazer" },
    { keywords: ["faculdade", "curso", "escola", "livro", "material", "aula"], categoryKey: "educação" },
    { keywords: ["salario", "salário", "freela", "freelance", "rendimento", "depósito", "venda", "comissão"], categoryKey: "salário" }
  ];

  if (userCategories.length > 0) {
    const fullTextLower = content.toLowerCase();
    for (const entry of semanticDictionary) {
      if (entry.keywords.some(k => fullTextLower.includes(k))) {
        const cat = userCategories.find(c => c.name.toLowerCase().includes(entry.categoryKey));
        if (cat) {
          category_id = cat.id;
          break;
        }
      }
    }

    if (!category_id) {
      const matchedCategory = userCategories.find(c => text.includes(c.name.toLowerCase()) || title.toLowerCase().includes(c.name.toLowerCase()));
      if (matchedCategory) category_id = matchedCategory.id;
    }

    if (!category_id) {
      const defaultCat = userCategories.find(c => c.type === (type === TransactionType.INCOME ? "income" : "expense"));
      if (defaultCat) category_id = defaultCat.id;
    }
  }

  // 7. Family Member Auto-Detection (matches payerName, text, or account owner)
  let matched_user_id: string | null = null;
  if (familyUsers && familyUsers.length > 0) {
    const searchTarget = (content + " " + text + " " + payerName + " " + receiverName).toLowerCase();
    for (const fUser of familyUsers) {
      if (fUser.name) {
        const first = fUser.name.toLowerCase().split(/\s+/)[0];
        if (first && first.length >= 3 && searchTarget.includes(first)) {
          matched_user_id = fUser.id;
          break;
        }
      }
    }

    // Fallback: If account is selected, check if account owner is a family member
    if (!matched_user_id && account_id) {
      const selectedAcc = userAccounts.find(a => a.id === account_id);
      if (selectedAcc && selectedAcc.user_id) {
        matched_user_id = selectedAcc.user_id;
      }
    }
  }

  const confidence = amount > 0 ? (receiverName ? 0.98 : dateMatch ? 0.95 : 0.90) : 0.6;
  const auditDetails = [
    receiverName ? `Recebedor: ${receiverName.toUpperCase()}` : "",
    payerName ? `Pagador: ${payerName}` : "",
    transactionId ? `ID Transação: ${transactionId}` : ""
  ].filter(Boolean).join(" | ");

  const summary = `Auditado ${type === TransactionType.INCOME ? "Receita" : "Gasto"} de R$ ${amount.toFixed(2)} para ${title}${auditDetails ? ` [${auditDetails}]` : ""}`;

  return {
    title,
    amount,
    type,
    due_date,
    category_id,
    account_id,
    user_id: matched_user_id,
    confidence,
    extracted_text_summary: summary,
    establishment: receiverName || title,
    payment_method: transactionId ? `PIX (ID: ${transactionId})` : "PIX / Dinheiro"
  };
}

/**
 * Intelligent Bank Statement (OFX / CSV / Text) parser.
 * Extracts multiple line item transactions from bank statement files.
 */
export async function parseBankStatementDocument(
  content: string,
  fileName: string = "",
  userCategories: Category[] = [],
  userAccounts: Account[] = [],
  familyUsers: any[] = []
): Promise<ParsedStatementItem[]> {
  const items: ParsedStatementItem[] = [];

  const findCategory = (titleStr: string, isInc: boolean) => {
    const titleLower = titleStr.toLowerCase();
    const semanticDict = [
      { keywords: ["copel", "enel", "light", "cemig", "cpfl", "energisa", "equatorial", "luz", "energia", "aluguel", "condomínio", "água", "sabesp", "sanepar", "iptu", "gás"], categoryKey: "moradia" },
      { keywords: ["ligga", "telecom", "claro", "vivo", "tim", "oi", "fatura", "cartão", "cartao", "netflix", "spotify", "prime", "disney", "hbo", "youtube", "icloud", "chatgpt"], categoryKey: "assinatura" },
      { keywords: ["pizza", "hamburguer", "lanche", "almoço", "jantar", "restaurante", "mcdonalds", "burger", "ifood", "rappi", "doce", "açougue", "mercado", "padaria", "comida", "bar", "cerveja", "café", "churrasco", "sushi", "açaí"], categoryKey: "alimentação" },
      { keywords: ["combustivel", "combustível", "gasolina", "etanol", "diesel", "posto", "uber", "99", "cabify", "estacionamento", "pedágio", "mecanico", "pneu", "ônibus", "metrô"], categoryKey: "transporte" },
      { keywords: ["farmacia", "farmácia", "remedio", "remédio", "drogaria", "médico", "dentista", "consulta", "exame", "hospital", "suplemento"], categoryKey: "saúde" },
      { keywords: ["cinema", "teatro", "show", "festa", "viagem", "hotel", "passagem", "jogo", "steam", "playstation", "xbox", "parque"], categoryKey: "lazer" },
      { keywords: ["faculdade", "curso", "escola", "livro", "material", "aula"], categoryKey: "educação" },
      { keywords: ["salario", "salário", "freela", "freelance", "rendimento", "depósito", "venda", "comissão"], categoryKey: "salário" }
    ];

    for (const entry of semanticDict) {
      if (entry.keywords.some(k => titleLower.includes(k))) {
        const cat = userCategories.find(c => c.name.toLowerCase().includes(entry.categoryKey));
        if (cat) return cat.id;
      }
    }
    const cat = userCategories.find(c => titleLower.includes(c.name.toLowerCase()));
    if (cat) return cat.id;
    const defaultCat = userCategories.find(c => c.type === (isInc ? "income" : "expense"));
    return defaultCat ? defaultCat.id : userCategories[0]?.id || null;
  };

  const findUser = (textStr: string) => {
    if (!familyUsers || familyUsers.length === 0) return null;
    const lower = textStr.toLowerCase();
    for (const fUser of familyUsers) {
      if (fUser.name) {
        const first = fUser.name.toLowerCase().split(/\s+/)[0];
        if (first && first.length >= 3 && lower.includes(first)) return fUser.id;
      }
    }
    return null;
  };

  // If OFX format
  if (content.includes("<STMTTRN>") || content.includes("<TRNTYPE>")) {
    const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;
    let index = 1;

    while ((match = trnRegex.exec(content)) !== null) {
      const block = match[1];
      const amountMatch = block.match(/<TRNAMT>(.*)/i);
      const dateMatch = block.match(/<DTPOSTED>(.*)/i);
      const memoMatch = block.match(/<MEMO>(.*)/i) || block.match(/<NAME>(.*)/i);

      if (amountMatch) {
        const rawAmt = parseFloat(amountMatch[1].trim());
        const isInc = rawAmt > 0;
        const amount = Math.abs(rawAmt);
        const type = isInc ? TransactionType.INCOME : TransactionType.VARIABLE_EXPENSE;

        let dateStr = new Date().toISOString().split("T")[0];
        if (dateMatch && dateMatch[1].length >= 8) {
          const rawD = dateMatch[1].trim();
          dateStr = `${rawD.substring(0, 4)}-${rawD.substring(4, 6)}-${rawD.substring(6, 8)}`;
        }

        const title = memoMatch ? memoMatch[1].trim() : `Lançamento Extrato #${index}`;
        const category_id = findCategory(title, isInc);
        const user_id = findUser(title + " " + block);

        items.push({
          id: `stmt-ofx-${index++}-${Date.now()}`,
          title,
          amount,
          type,
          due_date: dateStr,
          category_id,
          account_id: userAccounts[0]?.id || null,
          user_id,
          selected: true,
          raw_text: block
        });
      }
    }

    if (items.length > 0) return items;
  }

  // Line-by-line fallback parser for PDF / CSV / TXT / OCR statements
  const lines = content.split(/\r?\n/);
  let lineIdx = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;

    const lower = trimmed.toLowerCase();
    // Ignore balance summary lines or header info
    if (
      lower.includes("saldo do dia") ||
      lower.includes("saldo anterior") ||
      lower.includes("saldo final") ||
      lower.includes("saldo em conta") ||
      lower.includes("limite da conta") ||
      lower.includes("extrato conta") ||
      lower.includes("período de visualização") ||
      lower.includes("emitido em:")
    ) {
      continue;
    }

    // Match Date at start or middle (DD/MM/YYYY or DD/MM/YY or DD/MM)
    const dateMatch = trimmed.match(/(\d{2})[\/\.-](\d{2})[\/\.-]?(\d{2,4})?/);
    // Match all Amount occurrences in line (supports '1.920,00', '-1.253,47', '56,00', '-56,00')
    const amountMatches = Array.from(trimmed.matchAll(/([+-]?\s*R?\$?\s*-?\d{1,3}(?:\.\d{3})*,\d{2})\b/gi));
    const fallbackMatches = amountMatches.length > 0 ? amountMatches : Array.from(trimmed.matchAll(/([+-]?\s*R?\$?\s*-?\d+[\.,]\d{2})\b/gi));

    if (dateMatch && fallbackMatches.length > 0) {
      // First match is the transaction amount (second match, if present, is trailing balance)
      const targetMatch = fallbackMatches[0];
      const rawAmtStr = targetMatch[1].replace(/R\$/gi, "").replace(/\s/g, "");
      const isNegative = rawAmtStr.includes("-");
      const cleanNum = rawAmtStr.replace("-", "").replace(/\+/g, "").replace(/\./g, "").replace(",", ".");
      const parsedAmt = parseFloat(cleanNum);

      if (!isNaN(parsedAmt) && parsedAmt > 0) {
        const isInc = !isNegative && (lower.includes("crédito") || lower.includes("recebido") || lower.includes("origem") || (lower.includes("transf") && !isNegative));
        const type = isNegative ? TransactionType.VARIABLE_EXPENSE : (isInc ? TransactionType.INCOME : TransactionType.VARIABLE_EXPENSE);

        let day = dateMatch[1];
        let month = dateMatch[2];
        let year = dateMatch[3] || String(new Date().getFullYear());
        if (year.length === 2) year = `20${year}`;

        const due_date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        let cleanTitle = trimmed.replace(dateMatch[0], "");
        for (const m of fallbackMatches) {
          cleanTitle = cleanTitle.replace(m[0], "");
        }
        cleanTitle = cleanTitle
          .replace(/[;\t,]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const title = cleanTitle.length >= 2 ? cleanTitle : `Lançamento ${day}/${month}`;
        const category_id = findCategory(title, type === TransactionType.INCOME);
        const user_id = findUser(trimmed);

        items.push({
          id: `stmt-line-${lineIdx++}-${Date.now()}`,
          title,
          amount: parsedAmt,
          type,
          due_date,
          category_id,
          account_id: userAccounts[0]?.id || null,
          user_id,
          selected: true,
          raw_text: trimmed
        });
      }
    }
  }

  return items;
}

export interface AiChatResponse {
  text: string;
  proposal?: AnalyzedReceiptResult | null;
}

export async function callAiChatAssistant(
  userText: string,
  config: IntegrationConfig | null,
  categories: Category[] = [],
  accounts: Account[] = [],
  financialSummary?: { income: number; expense: number; balance: number },
  transactionsList: any[] = []
): Promise<AiChatResponse> {
  const lower = userText.toLowerCase().trim();

  const isTransaction = /\d+(?:[.,]\d{1,2})?/.test(lower) && (
    lower.includes("gastei") || lower.includes("comprei") || lower.includes("paguei") ||
    lower.includes("recebi") || lower.includes("ganhei") || lower.includes("mercado") ||
    lower.includes("uber") || lower.includes("lançar") || lower.includes("pix") || lower.includes("r$")
  );

  let proposal: AnalyzedReceiptResult | null = null;
  if (isTransaction) {
    proposal = await analyzeReceiptDocument(userText, "chat.txt", categories, accounts, config);
  }

  const isAiConfigured = Boolean(
    config && (config.is_ai_enabled || config.ai_api_key || config.ai_prompt_instructions || config.ai_provider)
  );

  if (isAiConfigured && config) {
    const provider = (config.ai_provider || "lmstudio").toLowerCase();
    const baseUrl = resolveAiBaseUrl(provider, config.ai_base_url);
    const apiKey = config.ai_api_key || "";
    const model = config.ai_model || (provider === "openai" ? "gpt-4o-mini" : provider === "groq" ? "llama-3.3-70b-versatile" : provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini");

    const contextText = financialSummary
      ? `Resumo Financeiro do Usuário neste Mês:\n- Receitas Totais: R$ ${financialSummary.income.toFixed(2)}\n- Despesas Totais: R$ ${financialSummary.expense.toFixed(2)}\n- Saldo Atual: R$ ${financialSummary.balance.toFixed(2)}`
      : "";

    let transactionsContext = "";
    if (transactionsList && transactionsList.length > 0) {
      const formattedItems = transactionsList.slice(0, 50).map((t) => {
        const typeStr = t.type === "income" ? "Receita" : t.type === "fixed_expense" ? "Despesa Fixa (Recorrente/Pós-paga)" : "Gasto Variável";
        const statusStr = t.status === "paid" ? "PAGO / QUITADO" : "PENDENTE / A VENCER (PÓS-PAGO)";
        const catStr = t.category?.name || "Sem categoria";
        const accStr = t.account?.name || "Sem conta";
        const dateStr = t.due_date || "Data N/D";
        const valStr = `R$ ${Number(t.amount || 0).toFixed(2)}`;

        return `- "${t.title}" | Valor: ${valStr} | Tipo: ${typeStr} | Status: ${statusStr} | Vencimento/Data: ${dateStr} | Conta: ${accStr} | Categoria: ${catStr}`;
      }).join("\n");

      transactionsContext = `\n\nTRANSAÇÕES E LANÇAMENTOS REAIS REGISTRADOS NO BANCO DE DADOS (${transactionsList.length} lançamentos encontrados):\n${formattedItems}`;
    } else {
      transactionsContext = `\n\nTRANSAÇÕES E LANÇAMENTOS REAIS REGISTRADOS NO BANCO DE DADOS:\nNenhum lançamento foi cadastrado no sistema pelo usuário ainda.`;
    }

    const userPromptInstructions = config.ai_prompt_instructions?.trim()
      ? `INSTRUÇÕES E PERSONALIDADE DEFINIDAS PELO USUÁRIO (CUMPRA RIGOROSAMENTE):\n${config.ai_prompt_instructions.trim()}\n\n`
      : "";

    const systemPrompt = `${userPromptInstructions}Você é o Agente IA Assistente Financeiro do sistema Finac Brosco.

REGRAS OBRIGATÓRIAS DE RESPOSTA (SEM EXCEÇÃO):
1. Para responder perguntas sobre lançamentos, pós-pagos, despesas, receitas ou pagamentos pendentes, consulte ESTRITAMENTE a lista 'TRANSAÇÕES E LANÇAMENTOS REAIS REGISTRADOS NO BANCO DE DADOS' fornecida abaixo.
2. NUNCA invente, simule ou crie títulos, valores, datas ou compras fictícias. Se a informação não estiver listada no contexto, diga expressamente que o lançamento não existe no sistema.
3. Responda de forma cortês, objetiva, prestativa e formatada em markdown sem exibir códigos de marcação brutos.

${contextText}${transactionsContext}`.trim();

    try {
      if (provider === "gemini" && apiKey) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n[Mensagem do Usuário]: ${userText}` }] }]
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) return { text: txt, proposal };
        } else {
          const errBody = await res.text();
          console.warn(`Gemini AI Chat Error Status ${res.status}:`, errBody);
        }
      } else {
        const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userText }
            ],
            temperature: 0.7
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt) return { text: txt, proposal };
        } else {
          const errBody = await res.text();
          console.warn(`AI Chat Provider Error (${provider} -> ${endpoint}) Status ${res.status}:`, errBody);
        }
      }
    } catch (err) {
      console.warn("AI Chat Assistant Call Error:", err);
    }
  }

  if (proposal && proposal.amount > 0) {
    return {
      text: `Entendi! Encontrei um lançamento: **${proposal.title}** no valor de **R$ ${proposal.amount.toFixed(2)}**. Confira os detalhes abaixo e confirme para cadastrar no sistema.`,
      proposal
    };
  }

  // Fallback heuristics using REAL transaction list
  if (lower.includes("pós pago") || lower.includes("pos pago") || lower.includes("pendente") || lower.includes("contas a pagar")) {
    const pendings = transactionsList.filter(t => t.status === "pending" || t.type === "fixed_expense");
    if (pendings.length > 0) {
      const itemsText = pendings.map(t => `- **${t.title}**: R$ ${Number(t.amount).toFixed(2)} (Vencimento: ${t.due_date}) [Status: ${t.status === "paid" ? "PAGO" : "PENDENTE"}]`).join("\n");
      return {
        text: `📋 **Lançamentos Pós-Pagos / Pendentes Encontrados no Sistema:**\n\n${itemsText}`
      };
    } else {
      return {
        text: `📋 Não encontrei nenhum lançamento pós-pago ou pendente cadastrado no sistema.`
      };
    }
  }

  if (proposal && proposal.amount > 0) {
    return {
      text: `Entendi! Encontrei um lançamento: **${proposal.title}** no valor de **R$ ${proposal.amount.toFixed(2)}**. Confira os detalhes abaixo e confirme para cadastrar no sistema.`,
      proposal
    };
  }

  if (lower.includes("saldo") || lower.includes("resumo") || lower.includes("quanto gastei")) {
    if (financialSummary) {
      const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
      return {
        text: `📊 **Seu Resumo Financeiro no Mês:**\n\n🟢 **Receitas:** ${fmt(financialSummary.income)}\n🔴 **Despesas:** ${fmt(financialSummary.expense)}\n💰 **Saldo Atual:** ${fmt(financialSummary.balance)}\n\n💡 Você pode me pedir para lançar um novo gasto ou anexar um comprovante no leitor!`
      };
    }
  }

  if (lower.includes("dica") || lower.includes("economia") || lower.includes("ajuda") || lower.includes("economizar")) {
    return {
      text: `💡 **Dicas do Agente IA para Economia e Organização:**\n\n1. **Categorize seus gastos variáveis**: Monitore o acumulado em Alimentação e Lazer para evitar surpresas no fim do mês.\n2. **Defina metas para despesas fixas**: Tente renegociar assinaturas e planos anuais.\n3. **Use o WhatsApp**: Cadastre gastos na hora pelo WhatsApp digitando \`finac gastei 50 mercado\` para nunca esquecer de registrar uma compra!`
    };
  }

  return {
    text: `Olá! Sou seu Agente IA Financeiro. Posso responder suas dúvidas sobre saldo, ajudar a economizar ou identificar lançamentos (ex: *"Mercado R$ 120"*, *"Pix 50 lanche"*). Como posso te ajudar agora?`
  };
}

