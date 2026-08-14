import { DataSource } from "typeorm";
import { Category, CategoryType } from "./entities/Category";
import { Account, AccountType } from "./entities/Account";
import { Transaction, TransactionType, TransactionStatus, TransactionFrequency } from "./entities/Transaction";

export const DEFAULT_CATEGORIES = [
  { name: "Salário", type: CategoryType.INCOME, color: "#10b981", icon: "Banknote" },
  { name: "Freelance", type: CategoryType.INCOME, color: "#06b6d4", icon: "Briefcase" },
  { name: "Rendimentos", type: CategoryType.INCOME, color: "#8b5cf6", icon: "TrendingUp" },
  { name: "Outras Receitas", type: CategoryType.INCOME, color: "#3b82f6", icon: "PlusCircle" },
  
  { name: "Moradia", type: CategoryType.EXPENSE, color: "#ef4444", icon: "Home" },
  { name: "Alimentação", type: CategoryType.EXPENSE, color: "#f97316", icon: "Utensils" },
  { name: "Transporte", type: CategoryType.EXPENSE, color: "#eab308", icon: "Car" },
  { name: "Lazer & Cultura", type: CategoryType.EXPENSE, color: "#ec4899", icon: "Smile" },
  { name: "Saúde & Farmácia", type: CategoryType.EXPENSE, color: "#14b8a6", icon: "Activity" },
  { name: "Educação", type: CategoryType.EXPENSE, color: "#6366f1", icon: "BookOpen" },
  { name: "Assinaturas & Serviços", type: CategoryType.EXPENSE, color: "#a855f7", icon: "Tv" },
  { name: "Cartão de Crédito", type: CategoryType.EXPENSE, color: "#64748b", icon: "CreditCard" },
  { name: "Outras Despesas", type: CategoryType.EXPENSE, color: "#94a3b8", icon: "Tag" }
];

export async function createDefaultCategories(dataSource: DataSource, userId: string) {
  const categoryRepo = dataSource.getRepository(Category);

  for (const catData of DEFAULT_CATEGORIES) {
    const exists = await categoryRepo.findOne({
      where: { user_id: userId, name: catData.name }
    });

    if (!exists) {
      const category = categoryRepo.create({
        user_id: userId,
        name: catData.name,
        type: catData.type,
        color: catData.color,
        icon: catData.icon,
        is_default: true
      });
      await categoryRepo.save(category);
    }
  }
}

export async function seedDemoData(dataSource: DataSource, userId: string) {
  await createDefaultCategories(dataSource, userId);

  const categoryRepo = dataSource.getRepository(Category);
  const accountRepo = dataSource.getRepository(Account);
  const transactionRepo = dataSource.getRepository(Transaction);

  // Check or create accounts
  let checkingAcc = await accountRepo.findOne({ where: { user_id: userId, name: "Conta Corrente" } });
  if (!checkingAcc) {
    checkingAcc = await accountRepo.save(accountRepo.create({
      user_id: userId,
      name: "Conta Corrente Itaú",
      type: AccountType.CHECKING,
      initial_balance: 3500.00,
      color: "#3b82f6",
      icon: "Landmark"
    }));
  }

  let creditAcc = await accountRepo.findOne({ where: { user_id: userId, name: "Cartão Nubank" } });
  if (!creditAcc) {
    creditAcc = await accountRepo.save(accountRepo.create({
      user_id: userId,
      name: "Cartão Nubank",
      type: AccountType.CREDIT_CARD,
      initial_balance: 0.00,
      color: "#8b5cf6",
      icon: "CreditCard"
    }));
  }

  const categories = await categoryRepo.find({ where: { user_id: userId } });
  const getCat = (name: string) => categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()))?.id || categories[0]?.id;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const demoTransactions = [
    // Receitas
    {
      title: "Salário Mensal",
      type: TransactionType.INCOME,
      amount: 8500.00,
      due_date: `${year}-${month}-05`,
      payment_date: `${year}-${month}-05`,
      status: TransactionStatus.PAID,
      frequency: TransactionFrequency.MONTHLY,
      is_recurring: true,
      category_id: getCat("Salário"),
      account_id: checkingAcc.id,
      description: "Depósito mensal da empresa"
    },
    {
      title: "Projeto Freelance Website",
      type: TransactionType.INCOME,
      amount: 2300.00,
      due_date: `${year}-${month}-12`,
      payment_date: `${year}-${month}-12`,
      status: TransactionStatus.PAID,
      frequency: TransactionFrequency.ONE_OFF,
      is_recurring: false,
      category_id: getCat("Freelance"),
      account_id: checkingAcc.id,
      description: "Desenvolvimento de landing page"
    },
    // Despesas Fixas (Recorrentes)
    {
      title: "Aluguel & Condomínio",
      type: TransactionType.FIXED_EXPENSE,
      amount: 2200.00,
      due_date: `${year}-${month}-10`,
      payment_date: `${year}-${month}-10`,
      status: TransactionStatus.PAID,
      frequency: TransactionFrequency.MONTHLY,
      is_recurring: true,
      category_id: getCat("Moradia"),
      account_id: checkingAcc.id,
      description: "Pagamento mensal da moradia"
    },
    {
      title: "Internet Fibra 500MB",
      type: TransactionType.FIXED_EXPENSE,
      amount: 149.90,
      due_date: `${year}-${month}-15`,
      payment_date: `${year}-${month}-15`,
      status: TransactionStatus.PAID,
      frequency: TransactionFrequency.MONTHLY,
      is_recurring: true,
      category_id: getCat("Assinaturas"),
      account_id: checkingAcc.id,
      description: "Conta mensal de internet"
    },
    {
      title: "Plano de Saúde",
      type: TransactionType.FIXED_EXPENSE,
      amount: 580.00,
      due_date: `${year}-${month}-20`,
      payment_date: null,
      status: TransactionStatus.PENDING,
      frequency: TransactionFrequency.MONTHLY,
      is_recurring: true,
      category_id: getCat("Saúde"),
      account_id: checkingAcc.id,
      description: "Mensalidade do convênio"
    },
    {
      title: "Academia Smart Fit",
      type: TransactionType.FIXED_EXPENSE,
      amount: 119.90,
      due_date: `${year}-${month}-25`,
      payment_date: null,
      status: TransactionStatus.PENDING,
      frequency: TransactionFrequency.MONTHLY,
      is_recurring: true,
      category_id: getCat("Lazer"),
      account_id: creditAcc.id,
      description: "Mensalidade da academia"
    },
    // Gastos Variáveis
    {
      title: "Supermercado Mensal",
      type: TransactionType.VARIABLE_EXPENSE,
      amount: 845.60,
      due_date: `${year}-${month}-08`,
      payment_date: `${year}-${month}-08`,
      status: TransactionStatus.PAID,
      frequency: TransactionFrequency.ONE_OFF,
      is_recurring: false,
      category_id: getCat("Alimentação"),
      account_id: creditAcc.id,
      description: "Compras no Carrefour"
    },
    {
      title: "Combustível Posto Shell",
      type: TransactionType.VARIABLE_EXPENSE,
      amount: 220.00,
      due_date: `${year}-${month}-14`,
      payment_date: `${year}-${month}-14`,
      status: TransactionStatus.PAID,
      frequency: TransactionFrequency.ONE_OFF,
      is_recurring: false,
      category_id: getCat("Transporte"),
      account_id: creditAcc.id,
      description: "Abastecimento do carro"
    },
    {
      title: "Jantar de Fim de Semana",
      type: TransactionType.VARIABLE_EXPENSE,
      amount: 185.00,
      due_date: `${year}-${month}-18`,
      payment_date: null,
      status: TransactionStatus.PENDING,
      frequency: TransactionFrequency.ONE_OFF,
      is_recurring: false,
      category_id: getCat("Alimentação"),
      account_id: creditAcc.id,
      description: "Restaurante com família"
    },
    {
      title: "Farmácia - Medicamentos",
      type: TransactionType.VARIABLE_EXPENSE,
      amount: 94.50,
      due_date: `${year}-${month}-21`,
      payment_date: null,
      status: TransactionStatus.PENDING,
      frequency: TransactionFrequency.ONE_OFF,
      is_recurring: false,
      category_id: getCat("Saúde"),
      account_id: creditAcc.id,
      description: "Remédios de rotina"
    }
  ];

  for (const t of demoTransactions) {
    const transaction = transactionRepo.create({
      user_id: userId,
      ...t
    });
    await transactionRepo.save(transaction);
  }
}
