import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { createExpense, getExpenses } from "@/lib/expense-service";
import { parseOptionalDateParam } from "@/lib/format";
import {
  currencyValues,
  expenseCategoryValues,
  type CurrencyCode,
  type ExpenseCategoryCode,
} from "@/lib/options";
import { expenseSchema } from "@/lib/validations";

function pick<T extends readonly string[]>(value: string | null, values: T) {
  return value && values.includes(value) ? value : undefined;
}

export async function GET(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  try {
    const params = new URL(request.url).searchParams;
    const expenses = await getExpenses({
      from: parseOptionalDateParam(params.get("from") || undefined),
      to: parseOptionalDateParam(params.get("to") || undefined, true),
      category: pick(params.get("category"), expenseCategoryValues) as ExpenseCategoryCode | undefined,
      currencyCode: pick(params.get("currencyCode"), currencyValues) as CurrencyCode | undefined,
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    return serverErrorResponse(error, "GET /api/expenses");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAuth("expenses:create");
  if (authError) return authError;

  const parsed = expenseSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const expense = await createExpense(parsed.data);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error, "POST /api/expenses");
  }
}
