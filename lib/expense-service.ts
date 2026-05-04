import { Prisma } from "@prisma/client";
import { emptyCurrencyTotals, toDecimal, type DecimalInput } from "@/lib/calculations";
import {
  type CurrencyCode,
  type ExpenseCategoryCode,
} from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { expenseSchema, nullableString } from "@/lib/validations";
import type { z } from "zod";

type ExpenseInput = z.output<typeof expenseSchema>;

function normalizeMoney(value: DecimalInput, scale = 4) {
  return toDecimal(value).toDecimalPlaces(scale).toFixed(scale);
}

export function expenseWhereFromFilters(filters: {
  from?: Date;
  to?: Date;
  category?: ExpenseCategoryCode;
  currencyCode?: CurrencyCode;
}) {
  return {
    ...(filters.from || filters.to
      ? {
          date: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.currencyCode ? { currencyCode: filters.currencyCode } : {}),
  } satisfies Prisma.ExpenseWhereInput;
}

export async function getExpenses(filters: Parameters<typeof expenseWhereFromFilters>[0] = {}) {
  return prisma.expense.findMany({
    where: expenseWhereFromFilters(filters),
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 500,
  });
}

export async function getExpense(id: string) {
  return prisma.expense.findUnique({ where: { id } });
}

export async function createExpense(input: ExpenseInput) {
  return prisma.expense.create({
    data: {
      date: input.date,
      category: input.category,
      description: input.description,
      amount: normalizeMoney(input.amount),
      currencyCode: input.currencyCode,
      notes: nullableString(input.notes),
    },
  });
}

export async function updateExpense(id: string, input: ExpenseInput) {
  return prisma.expense.update({
    where: { id },
    data: {
      date: input.date,
      category: input.category,
      description: input.description,
      amount: normalizeMoney(input.amount),
      currencyCode: input.currencyCode,
      notes: nullableString(input.notes),
    },
  });
}

export async function deleteExpense(id: string) {
  return prisma.expense.delete({ where: { id } });
}

export function sumExpensesByCurrency(expenses: { currencyCode: CurrencyCode; amount: DecimalInput }[]) {
  const totals = emptyCurrencyTotals();

  for (const expense of expenses) {
    totals[expense.currencyCode] = totals[expense.currencyCode].plus(toDecimal(expense.amount));
  }

  return totals;
}
