export type RiskCategory = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface InvestmentOption {
  id: string;
  name: string;
  category: RiskCategory;
  categoryName: string;
  defaultAnnualRate: number; // % a.a.
  liquidity: string;
  taxStatus: string;
  fgcProtection: boolean;
  description: string;
  idealFor: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export const INVESTMENT_OPTIONS: InvestmentOption[] = [
  // --- BAIXO RISCO (Renda Fixa Conservadora) ---
  {
    id: "TESOURO_SELIC",
    name: "Tesouro Selic (Tesouro Direto)",
    category: "LOW",
    categoryName: "Baixo Risco",
    defaultAnnualRate: 10.5,
    liquidity: "Diária (D+1)",
    taxStatus: "Tabela Regressiva IR (15% a 22,5%)",
    fgcProtection: false, // Protegido pelo Tesouro Nacional (Risco Soberano Zero)
    description: "Investimento de menor risco do país. Rende 100% da taxa Selic + pequena taxa. Ideal para Reserva de Emergência.",
    idealFor: "Reserva de emergência, metas de curto prazo e alta liquidez.",
    iconName: "ShieldCheck",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400 border-emerald-500/30",
    borderColor: "border-emerald-500/40",
  },
  {
    id: "CDB",
    name: "CDB (Certificado de Depósito Bancário)",
    category: "LOW",
    categoryName: "Baixo Risco",
    defaultAnnualRate: 11.2,
    liquidity: "Diária ou no Vencimento",
    taxStatus: "Tabela Regressiva IR (15% a 22,5%)",
    fgcProtection: true, // Garantia FGC até R$ 250 mil
    description: "Emissão de bancos com rendimento atrelado ao CDI (ex: 100% a 115% do CDI). Coberto pelo FGC.",
    idealFor: "Reserva de oportunidade e rentabilidade superior à poupança.",
    iconName: "Landmark",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400 border-emerald-500/30",
    borderColor: "border-emerald-500/40",
  },
  {
    id: "LCI_LCA",
    name: "LCI / LCA (Letras de Crédito Imobiliário e Agronegócio)",
    category: "LOW",
    categoryName: "Baixo Risco",
    defaultAnnualRate: 9.5,
    liquidity: "No Vencimento (Carência mín. 90-270 dias)",
    taxStatus: "Isento de Imposto de Renda (Pessoa Física)",
    fgcProtection: true,
    description: "Títulos lastreados no setor imobiliário ou agronegócio com 100% de isenção de IR para pessoas físicas.",
    idealFor: "Metas de médio prazo buscando liquidez líquida de impostos.",
    iconName: "Wheat",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400 border-emerald-500/30",
    borderColor: "border-emerald-500/40",
  },
  {
    id: "POUPANCA",
    name: "Caderneta de Poupança",
    category: "LOW",
    categoryName: "Baixo Risco",
    defaultAnnualRate: 6.17,
    liquidity: "No Aniversário (Mensal)",
    taxStatus: "Isento de Imposto de Renda",
    fgcProtection: true,
    description: "O investimento mais tradicional do Brasil, porém com o menor rendimento real da categoria.",
    idealFor: "Facilidade de acesso imediato, embora perca rentabilidade.",
    iconName: "PiggyBank",
    badgeBg: "bg-slate-500/10",
    badgeText: "text-slate-400 border-slate-500/30",
    borderColor: "border-slate-700",
  },

  // --- MÉDIO RISCO (Híbridos / Renda Imobiliária) ---
  {
    id: "TESOURO_IPCA",
    name: "Tesouro IPCA+ (Proteção contra Inflação)",
    category: "MEDIUM",
    categoryName: "Médio Risco",
    defaultAnnualRate: 11.8,
    liquidity: "No Vencimento (Sujeito à Marcação a Mercado)",
    taxStatus: "Tabela Regressiva IR (15% a 22,5%)",
    fgcProtection: false,
    description: "Garante retorno acima da inflação (IPCA + Taxa Fixa, ex: IPCA + 6,2%). Protege o poder de compra no longo prazo.",
    idealFor: "Aposentadoria, compra de imóvel ou prazos acima de 3 anos.",
    iconName: "TrendingUp",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400 border-amber-500/30",
    borderColor: "border-amber-500/40",
  },
  {
    id: "FIIS",
    name: "FIIs (Fundos de Investimento Imobiliário)",
    category: "MEDIUM",
    categoryName: "Médio Risco",
    defaultAnnualRate: 12.0,
    liquidity: "Alta em Bolsa (D+2)",
    taxStatus: "Dividendos Isentos de IR (Ganho de capital 20%)",
    fgcProtection: false,
    description: "Investimento em carteiras de imóveis comerciais (galpões, shoppings, escritórios). Paga rendimentos mensais em conta.",
    idealFor: "Geração de renda passiva mensal sem necessidade de comprar imóveis físicos.",
    iconName: "Building2",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400 border-amber-500/30",
    borderColor: "border-amber-500/40",
  },
  {
    id: "DEBENTURES",
    name: "Debêntures Incentivadas / CRI / CRA",
    category: "MEDIUM",
    categoryName: "Médio Risco",
    defaultAnnualRate: 12.5,
    liquidity: "No Vencimento ou Mercado Secundário",
    taxStatus: "Isento de IR para Pessoa Física",
    fgcProtection: false,
    description: "Empréstimos diretos a grandes empresas de infraestrutura com isenção total de IR. Risco de crédito da empresa emissora.",
    idealFor: "Diversificação em renda fixa privada com rentabilidade turbinada.",
    iconName: "Briefcase",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400 border-amber-500/30",
    borderColor: "border-amber-500/40",
  },

  // --- ALTO RISCO (Renda Variável & Mercado de Capitais) ---
  {
    id: "ACOES",
    name: "Ações Individuais (B3 - Ibovespa)",
    category: "HIGH",
    categoryName: "Alto Risco",
    defaultAnnualRate: 14.5,
    liquidity: "Alta em Bolsa (D+2)",
    taxStatus: "Isento até R$ 20k/mês em vendas (IR 15% acima / Dividendos isentos)",
    fgcProtection: false,
    description: "Tornar-se sócio de grandes empresas brasileiras (Petrobras, Itaú, Vale, WEG). Ganho via valorização e dividendos.",
    idealFor: "Construção de patrimônio no longo prazo com oscilações diárias.",
    iconName: "BarChart3",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-400 border-rose-500/30",
    borderColor: "border-rose-500/40",
  },
  {
    id: "ETFS",
    name: "ETFs de Índice (BOVA11, IVVB11, SMAL11)",
    category: "HIGH",
    categoryName: "Alto Risco",
    defaultAnnualRate: 13.5,
    liquidity: "Alta em Bolsa (D+2)",
    taxStatus: "IR 15% sobre o ganho de capital",
    fgcProtection: false,
    description: "Cestas diversificadas de ações que replicam índices globais (ex: S&P500 americano ou Ibovespa).",
    idealFor: "Diversificação instantânea em centenas de empresas com baixo custo de gestão.",
    iconName: "Globe",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-400 border-rose-500/30",
    borderColor: "border-rose-500/40",
  },
  {
    id: "BDRS",
    name: "BDRs & Ações Internacionais (Big Techs)",
    category: "HIGH",
    categoryName: "Alto Risco",
    defaultAnnualRate: 16.0,
    liquidity: "Alta em Bolsa (D+2)",
    taxStatus: "IR 15% sobre lucros",
    fgcProtection: false,
    description: "Certificados negociados no Brasil representativos de ações globais (Apple, Microsoft, Google, Nvidia, Tesla) atrelados ao Dólar.",
    idealFor: "Dolarização do patrimônio e exposição a gigantes globais de tecnologia.",
    iconName: "Zap",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-400 border-rose-500/30",
    borderColor: "border-rose-500/40",
  },

  // --- MUITO ALTO RISCO (Criptoativos & Especulativo) ---
  {
    id: "CRIPTO",
    name: "Criptomoedas (Bitcoin, Ethereum, Altcoins)",
    category: "VERY_HIGH",
    categoryName: "Muito Alto Risco",
    defaultAnnualRate: 25.0,
    liquidity: "Imediata 24/7 (Exchanges / Wallet)",
    taxStatus: "Isento até R$ 35k/mês em alienação (15% a 22,5% acima)",
    fgcProtection: false,
    description: "Ativos digitais descentralizados com escassez matemática. Altíssima volatilidade e potencial de retorno assimétrico elevado.",
    idealFor: "Investidores arrojados buscando alta rentabilidade e custódia própria.",
    iconName: "Coins",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400 border-purple-500/30",
    borderColor: "border-purple-500/40",
  },
];

export function getInvestmentOptionById(id: string): InvestmentOption {
  const found = INVESTMENT_OPTIONS.find((opt) => opt.id === id);
  if (found) return found;
  return INVESTMENT_OPTIONS[0]; // fallback to Tesouro Selic
}
