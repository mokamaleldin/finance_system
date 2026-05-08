import Decimal from "decimal.js";
import { emptyCurrencyTotals } from "@/lib/calculations";
import { customerSelect } from "@/lib/customer-select";
import { getDateRange } from "@/lib/format";
import { currencyValues, type CurrencyCode } from "@/lib/options";
import { prisma } from "@/lib/prisma";

export const reportPeriodValues = ["today", "week", "month", "custom"] as const;
export type ReportPeriod = (typeof reportPeriodValues)[number];

export const reportPeriodLabels: Record<ReportPeriod, string> = {
  today: "اليوم",
  week: "هذا الأسبوع",
  month: "هذا الشهر",
  custom: "فترة مخصصة",
};

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  return start;
}

function endOfWeek(date: Date) {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  return endOfDay(end);
}

function startOfMonth(date: Date) {
  const start = startOfDay(date);
  start.setDate(1);
  return start;
}

function endOfMonth(date: Date) {
  const end = startOfMonth(date);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  return endOfDay(end);
}

export function getReportDateRange(input: {
  period?: ReportPeriod;
  from?: Date;
  to?: Date;
  today?: Date;
}) {
  const period = input.period ?? "today";
  const today = input.today ?? new Date();

  if (period === "custom" && input.from && input.to) {
    return {
      period,
      start: startOfDay(input.from),
      end: endOfDay(input.to),
    };
  }

  if (period === "week") {
    return { period, start: startOfWeek(today), end: endOfWeek(today) };
  }

  if (period === "month") {
    return { period, start: startOfMonth(today), end: endOfMonth(today) };
  }

  const { start, end } = getDateRange(today);
  return { period: "today" as const, start, end };
}

export function parseReportPeriod(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return reportPeriodValues.includes(candidate as ReportPeriod) ? (candidate as ReportPeriod) : "today";
}

export async function getReportByDateRange(start: Date, end: Date) {
  const [transactions, expenses] = await Promise.all([
    prisma.transferTransaction.findMany({
      where: {
        date: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
      include: { customer: { select: customerSelect }, commission: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const receivedTotals = emptyCurrencyTotals();
  const deliveredTotals = emptyCurrencyTotals();
  const transactionProfitTotals = emptyCurrencyTotals();
  const expenseTotals = emptyCurrencyTotals();
  const commissionTotals = emptyCurrencyTotals();
  const netProfitTotals = emptyCurrencyTotals();
  const customerIds = new Set<string>();
  const customerNames = new Set<string>();

  for (const transaction of transactions) {
    receivedTotals[transaction.receivedCurrency] =
      receivedTotals[transaction.receivedCurrency].plus(transaction.receivedAmount);
    deliveredTotals[transaction.deliveredCurrency] =
      deliveredTotals[transaction.deliveredCurrency].plus(transaction.deliveredAmount);
    transactionProfitTotals[transaction.profitCurrency] =
      transactionProfitTotals[transaction.profitCurrency].plus(transaction.profitAmount);

    if (transaction.commission) {
      commissionTotals[transaction.commission.currencyCode] =
        commissionTotals[transaction.commission.currencyCode].plus(transaction.commission.amount);
    }

    if (transaction.customerId) {
      customerIds.add(transaction.customerId);
    } else {
      customerNames.add(transaction.customerNameSnapshot);
    }
  }

  for (const expense of expenses) {
    expenseTotals[expense.currencyCode] = expenseTotals[expense.currencyCode].plus(expense.amount);
  }

  for (const currency of currencyValues) {
    netProfitTotals[currency] = new Decimal(transactionProfitTotals[currency])
      .minus(expenseTotals[currency])
      .minus(commissionTotals[currency]);
  }

  return {
    start,
    end,
    transactions,
    expenses,
    receivedTotals,
    deliveredTotals,
    transactionProfitTotals,
    expenseTotals,
    commissionTotals,
    netProfitTotals: netProfitTotals as Record<CurrencyCode, Decimal>,
    transactionsCount: transactions.length,
    customersCount: customerIds.size + customerNames.size,
    completedCount: transactions.filter((item) => item.status === "COMPLETED").length,
    openCount: transactions.filter((item) => item.status === "OPEN").length,
  };
}
