import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { refreshTransactionGroup } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { movementSchema, nullableDecimalString, nullableString } from "@/lib/validations";

export async function POST(request: Request) {
  const authError = await requireApiAuth("transactions:write");
  if (authError) return authError;

  const parsed = movementSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const movement = await prisma.financialMovement.create({
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

    await refreshTransactionGroup(movement.transactionGroupId);

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error, "POST /api/movements");
  }
}
