import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDataSource } from "@/lib/db/data-source";
import { Transaction, TransactionType, TransactionStatus } from "@/lib/db/entities/Transaction";
import { IsNull } from "typeorm";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { month } = await req.json(); // format YYYY-MM e.g. "2026-09"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Mês inválido. Forneça o formato YYYY-MM." }, { status: 400 });
    }

    const dataSource = await getDataSource();
    const transactionRepo = dataSource.getRepository(Transaction);

    // Find all master recurring items or fixed expenses of the user
    const recurringTemplates = await transactionRepo.find({
      where: [
        { user_id: user.id, is_recurring: true, parent_transaction_id: IsNull() },
        { user_id: user.id, type: TransactionType.FIXED_EXPENSE, parent_transaction_id: IsNull() }
      ]
    });

    const [targetYearStr, targetMonthStr] = month.split("-");
    const targetYear = parseInt(targetYearStr, 10);
    const targetMonth = parseInt(targetMonthStr, 10);

    let createdCount = 0;

    for (const template of recurringTemplates) {
      // Check due day from template due_date
      const origDueDate = new Date(template.due_date);
      const day = origDueDate.getUTCDate();
      
      // Calculate valid day in target month
      const maxDays = new Date(targetYear, targetMonth, 0).getDate();
      const validDay = Math.min(day, maxDays);
      const newDueDateStr = `${targetYearStr}-${targetMonthStr}-${String(validDay).padStart(2, "0")}`;

      // Check if a transaction for this template already exists in target month
      const existing = await transactionRepo.findOne({
        where: [
          { user_id: user.id, parent_transaction_id: template.id, due_date: newDueDateStr },
          { user_id: user.id, title: template.title, due_date: newDueDateStr }
        ]
      });

      if (!existing) {
        const newTx = transactionRepo.create({
          user_id: user.id,
          category_id: template.category_id,
          account_id: template.account_id,
          title: template.title,
          type: template.type,
          amount: template.amount,
          due_date: newDueDateStr,
          payment_date: null,
          status: TransactionStatus.PENDING,
          frequency: template.frequency,
          description: template.description ? `Recorrência de: ${template.description}` : "Recorrência gerada automaticamente",
          is_recurring: true,
          parent_transaction_id: template.id,
        });

        await transactionRepo.save(newTx);
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído. ${createdCount} novos lançamentos recorrentes gerados para ${month}.`,
      createdCount,
    });
  } catch (error) {
    console.error("Process Recurring Error:", error);
    return NextResponse.json({ error: "Erro ao processar cobranças recorrentes" }, { status: 500 });
  }
}
