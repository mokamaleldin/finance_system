import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { refreshTransactionGroup } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { movementSchema, nullableDecimalString, nullableString } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const parsed = movementSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const { id } = await context.params;

  try {
    const existing = await prisma.financialMovement.findUniqueOrThrow({ where: { id } });
    const movement = await prisma.financialMovement.update({
      where: { id },
      data: {
        customerId: nullableString(parsed.data.customerId),
        date: parsed.data.date,
        type: parsed.data.type,
        currency: parsed.data.currency,
        amount: parsed.data.amount,
        rate: nullableDecimalString(parsed.data.rate),
        transactionGroupId: nullableString(parsed.data.transactionGroupId),
        notes: nullableString(parsed.data.notes),
      },
    });

    await Promise.all([
      refreshTransactionGroup(existing.transactionGroupId),
      existing.transactionGroupId === movement.transactionGroupId
        ? Promise.resolve(null)
        : refreshTransactionGroup(movement.transactionGroupId),
    ]);

    return NextResponse.json({ movement });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const { id } = await context.params;

  try {
    const existing = await prisma.financialMovement.findUniqueOrThrow({ where: { id } });
    await prisma.financialMovement.delete({ where: { id } });
    await refreshTransactionGroup(existing.transactionGroupId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
