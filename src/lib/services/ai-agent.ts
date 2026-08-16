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
  selected: boolean;
  raw_text?: string;
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

  const provider = config.ai_provider || "lmstudio";
  let baseUrl = (config.ai_base_url || "http://localhost:1234/v1").replace(/\/+$/, "");
  const apiKey = config.ai_api_key || "";
  const model = config.ai_model || "gpt-4o-mini";

  const systemPrompt = config.ai_prompt_instructions ||
    "Você é um assistente financeiro. Analise a imagem/texto do comprovante e extraia o título da compra/receita, valor numérico exato, tipo ('income' | 'fixed_expense' | 'variable_expense') e data ('YYYY-MM-DD'). Responda EXATAMENTE um objeto JSON válido no formato: {\"title\": \"...\", \"amount\": 45.0, \"type\": \"variable_expense\", \"due_date\": \"2026-08-14\"}. Não inclua nenhum texto adicional além do JSON.";

  try {
    if (provider === "gemini" && apiKey) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const parts: any[] = [{ text: `${systemPrompt}\n\nAnalise o comprovante:` }];

      if (fileData && fileData.startsWith("data:")) {
        const mimeType = fileData.substring(fileData.indexOf(":") + 1, fileData.indexOf(";"));
        const base64Data = fileData.split(",")[1];
        parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
      } else if (content) {
        parts.push({ text: content });
      }

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
        signal: AbortSignal.timeout(8000)
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

      let userContent: any = content;
      if (fileData && fileData.startsWith("data:")) {
        userContent = [
          { type: "text", text: content || "Analise a imagem deste comprovante ou nota fiscal:" },
          { type: "image_url", image_url: { url: fileData } }
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
        signal: AbortSignal.timeout(8000)
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
  fileData?: string
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

  // 2. Amount Extraction (supports '100 conto', '45 reais', 'R$ 50', '150,00')
  let amount = 0;
  const amountMatch = workingText.match(/\b(\d+(?:[,\.]\d{1,2})?)\b/);
  if (amountMatch) {
    const cleanVal = amountMatch[1].replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleanVal);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
      workingText = workingText.replace(amountMatch[0], " ");
    }
  }

  // 3. Type Detection (Income vs Expense)
  let type: TransactionType = TransactionType.VARIABLE_EXPENSE;
  if (text.includes("comprovante de recebimento") || text.includes("depósito recebido") || text.includes("pix recebido") || text.includes("transferência recebida") || text.includes("salário") || text.includes("remuneração") || text.includes("recebi")) {
    type = TransactionType.INCOME;
  } else if (text.includes("aluguel") || text.includes("condomínio") || text.includes("luz") || text.includes("energia") || text.includes("água") || text.includes("internet") || text.includes("assinatura") || text.includes("plano mensal")) {
    type = TransactionType.FIXED_EXPENSE;
  }

  // 4. Date Extraction (from text or fileName)
  let due_date = new Date().toISOString().split("T")[0];
  const dateMatch = text.match(/(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})/) || fileName.match(/(\d{4})[-_](\d{2})[-_](\d{2})/);
  if (dateMatch) {
    if (dateMatch[1].length === 4) {
      due_date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    } else {
      due_date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }

  // 5. Clean Title & Strip Slang / Action / Price Verbs / Typos
  const wordsToIgnore = new Set([
    "gastei", "comprei", "paguei", "custou", "mandei", "fiz", "recebi", "transferi",
    "foi", "deu", "saiu", "ficou", "valor", "por", "com", "em", "de", "no", "na",
    "nos", "nas", "um", "uma", "uns", "umas", "pra", "para", "do", "da", "dos", "das",
    "reias", "reais", "real", "reis", "reai", "conto", "contos", "pila", "pilas", "pau", "paus",
    "barão", "barões", "brl", "r$", "banco", "cartão", "cartao", "conta", "fatura",
    "rogger", "brosco", "priscila", "desplanches"
  ]);

  const tokens = workingText.split(/\s+/);
  const cleanTokens = tokens.filter(tok => {
    const clean = tok.replace(/[^a-zà-ú0-9]/gi, "");
    return clean.length >= 2 && !wordsToIgnore.has(clean) && !/^\d+$/.test(clean);
  });

  let title = cleanTokens.join(" ");

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

  // Keyword overrides for specific categories
  if (text.includes("combustivel") || text.includes("combustível") || text.includes("gasolina") || text.includes("etanol") || text.includes("diesel")) {
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
    { keywords: ["pizza", "hamburguer", "lanche", "almoço", "jantar", "restaurante", "mcdonalds", "burger", "ifood", "rappi", "doce", "açougue", "mercado", "padaria", "comida", "bar", "cerveja", "café", "churrasco", "sushi", "açaí"], categoryKey: "alimentação" },
    { keywords: ["combustivel", "combustível", "gasolina", "etanol", "diesel", "posto", "uber", "99", "cabify", "estacionamento", "pedágio", "mecanico", "pneu", "ônibus", "metrô"], categoryKey: "transporte" },
    { keywords: ["aluguel", "condomínio", "luz", "energia", "água", "internet", "iptu", "gás", "enel", "sabesp", "móveis", "reforma"], categoryKey: "moradia" },
    { keywords: ["farmacia", "farmácia", "remedio", "remédio", "drogaria", "médico", "dentista", "consulta", "exame", "hospital", "suplemento"], categoryKey: "saúde" },
    { keywords: ["cinema", "teatro", "show", "festa", "viagem", "hotel", "passagem", "jogo", "steam", "playstation", "xbox", "parque"], categoryKey: "lazer" },
    { keywords: ["faculdade", "curso", "escola", "livro", "material", "aula"], categoryKey: "educação" },
    { keywords: ["netflix", "spotify", "prime", "disney", "hbo", "youtube", "icloud", "chatgpt"], categoryKey: "assinatura" },
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

  const confidence = amount > 0 ? (dateMatch ? 0.95 : 0.90) : 0.6;
  const summary = `Identificado ${type === TransactionType.INCOME ? "Receita" : "Gasto"} de R$ ${amount.toFixed(2)} registrado para ${title}`;

  return {
    title,
    amount,
    type,
    due_date,
    category_id,
    account_id,
    confidence,
    extracted_text_summary: summary,
    establishment: title
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
  userAccounts: Account[] = []
): Promise<ParsedStatementItem[]> {
  const items: ParsedStatementItem[] = [];

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

        let category_id: string | null = null;
        if (userCategories.length > 0) {
          const cat = userCategories.find(c => title.toLowerCase().includes(c.name.toLowerCase()));
          category_id = cat ? cat.id : userCategories[0].id;
        }

        items.push({
          id: `stmt-ofx-${index++}-${Date.now()}`,
          title,
          amount,
          type,
          due_date: dateStr,
          category_id,
          account_id: userAccounts[0]?.id || null,
          selected: true,
          raw_text: block
        });
      }
    }

    if (items.length > 0) return items;
  }

  // Line-by-line fallback parser for CSV / TXT / OCR statements
  const lines = content.split(/\r?\n/);
  let lineIdx = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;

    const dateMatch = trimmed.match(/(\d{2})[\/\.-](\d{2})[\/\.-]?(\d{2,4})?/);
    const amountMatch = trimmed.match(/([+-]?\s*R?\$?\s*\d+(?:[\.,]\d{2}))/i);

    if (dateMatch && amountMatch) {
      const rawAmtStr = amountMatch[1].replace(/R\$/gi, "").replace(/\s/g, "").replace(",", ".");
      const parsedAmt = parseFloat(rawAmtStr);

      if (!isNaN(parsedAmt) && Math.abs(parsedAmt) > 0) {
        const isInc = parsedAmt > 0 || trimmed.toLowerCase().includes("crédito") || trimmed.toLowerCase().includes("recebido");
        const amount = Math.abs(parsedAmt);
        const type = isInc ? TransactionType.INCOME : TransactionType.VARIABLE_EXPENSE;

        let day = dateMatch[1];
        let month = dateMatch[2];
        let year = dateMatch[3] || String(new Date().getFullYear());
        if (year.length === 2) year = `20${year}`;

        const due_date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        const cleanTitle = trimmed
          .replace(dateMatch[0], "")
          .replace(amountMatch[0], "")
          .replace(/[;\t,]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const title = cleanTitle.length > 3 ? cleanTitle : `Lançamento ${day}/${month}`;

        let category_id: string | null = null;
        if (userCategories.length > 0) {
          const cat = userCategories.find(c => title.toLowerCase().includes(c.name.toLowerCase()));
          category_id = cat ? cat.id : userCategories[0].id;
        }

        items.push({
          id: `stmt-line-${lineIdx++}-${Date.now()}`,
          title,
          amount,
          type,
          due_date,
          category_id,
          account_id: userAccounts[0]?.id || null,
          selected: true,
          raw_text: trimmed
        });
      }
    }
  }

  return items;
}
