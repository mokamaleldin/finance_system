import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { deleteExpense, updateExpense } from "@/lib/expense-service";
import { expenseSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const { id } = await context.params;
  const parsed = expenseSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const expense = await updateExpense(id, parsed.data);
    return NextResponse.json({ expense });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const { id } = await context.params;

  try {
    const expense = await deleteExpense(id);
    return NextResponse.json({ expense });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
