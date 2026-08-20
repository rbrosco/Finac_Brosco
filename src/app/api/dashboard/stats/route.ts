export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Transaction, TransactionType, TransactionStatus } from "@/lib/db/entities/Transaction";
import { getFamilyUserIds } from "@/lib/db/family-helper";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const userIds = await getFamilyUserIds(user.id);

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = searchParams.get("month") || defaultMonth; // YYYY-MM

    const dataSource = await getDataSource();
    const transactionRepo = dataSource.getRepository(Transaction);

    const [yStr, mStr] = month.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const lastDay = new Date(y, m, 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

    // Get month transactions
    const monthTransactions = await transactionRepo
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.category", "category")
      .leftJoinAndSelect("t.account", "account")
      .leftJoinAndSelect("t.user", "user")
      .where("t.user_id IN (:...userIds)", { userIds })
      .andWhere("t.due_date >= :startDate AND t.due_date <= :endDate", { startDate, endDate })
      .orderBy("t.due_date", "DESC")
      .getMany();

    let totalIncome = 0;
    let receivedIncome = 0;
    let pendingIncome = 0;

    let totalFixedExpenses = 0;
    let paidFixedExpenses = 0;
    let pendingFixedExpenses = 0;

    let totalVariableExpenses = 0;
    let paidVariableExpenses = 0;
    let pendingVariableExpenses = 0;

    let paidExpenses = 0;
    let pendingExpenses = 0;

    const categoryMap = new Map<string, { name: string; amount: number; color: string; icon: string }>();

    for (const t of monthTransactions) {
      const amount = Number(t.amount);
      const typeStr = String(t.type || "").toLowerCase();
      const statusStr = String(t.status || "").toLowerCase();

      if (typeStr === "income") {
        totalIncome += amount;
        if (statusStr === "paid" || statusStr === "recebido" || statusStr === "completed") {
          receivedIncome += amount;
        } else {
          pendingIncome += amount;
        }
      } else if (typeStr === "fixed_expense") {
        totalFixedExpenses += amount;
        if (statusStr === "paid" || statusStr === "pago" || statusStr === "completed") {
          paidFixedExpenses += amount;
          paidExpenses += amount;
        } else {
          pendingFixedExpenses += amount;
          pendingExpenses += amount;
        }
      } else if (typeStr === "variable_expense") {
        totalVariableExpenses += amount;
        if (statusStr === "paid" || statusStr === "pago" || statusStr === "completed") {
          paidVariableExpenses += amount;
          paidExpenses += amount;
        } else {
          pendingVariableExpenses += amount;
          pendingExpenses += amount;
        }
      }

      // Group expenses by category
      if (t.type !== TransactionType.INCOME && t.category) {
        const catId = t.category.id;
        const existing = categoryMap.get(catId) || {
          name: t.category.name,
          amount: 0,
          color: t.category.color || "#6366f1",
          icon: t.category.icon || "Tag",
        };
        existing.amount += amount;
        categoryMap.set(catId, existing);
      }
    }

    const totalExpenses = totalFixedExpenses + totalVariableExpenses;
    const netBalance = totalIncome - totalExpenses;

    const categoryBreakdown = Array.from(categoryMap.values()).map(c => ({
      ...c,
      percentage: totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Get last 6 months trend data
    const monthlyComparison = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const mYear = d.getFullYear();
      const mMonth = String(d.getMonth() + 1).padStart(2, "0");
      const mMonthStr = `${mYear}-${mMonth}`;
      const mMaxDays = new Date(mYear, d.getMonth() + 1, 0).getDate();
      const mStart = `${mMonthStr}-01`;
      const mEnd = `${mMonthStr}-${String(mMaxDays).padStart(2, "0")}`;

      const tList = await transactionRepo
        .createQueryBuilder("t")
        .where("t.user_id IN (:...userIds)", { userIds })
        .andWhere("t.due_date >= :mStart AND t.due_date <= :mEnd", { mStart, mEnd })
        .getMany();

      let inc = 0;
      let fix = 0;
      let varExp = 0;

      for (const t of tList) {
        const val = Number(t.amount);
        if (t.type === TransactionType.INCOME) inc += val;
        else if (t.type === TransactionType.FIXED_EXPENSE) fix += val;
        else if (t.type === TransactionType.VARIABLE_EXPENSE) varExp += val;
      }

      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      monthlyComparison.push({
        month: monthLabel,
        receitas: inc,
        despesasFixas: fix,
        gastosVariaveis: varExp,
        totalDespesas: fix + varExp,
      });
    }

    // Recent 6 transactions
    const recentTransactions = monthTransactions.slice(0, 6);

    return NextResponse.json({
      month,
      totalIncome,
      receivedIncome,
      pendingIncome,
      totalFixedExpenses,
      paidFixedExpenses,
      pendingFixedExpenses,
      totalVariableExpenses,
      paidVariableExpenses,
      pendingVariableExpenses,
      totalExpenses,
      netBalance,
      paidExpenses,
      pendingExpenses,
      categoryBreakdown,
      monthlyComparison,
      recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Erro ao carregar dados do dashboard" }, { status: 500 });
  }
}
