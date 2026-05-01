import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { deriveTransactionStatus } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import {
  nullableDecimalString,
  nullableString,
  transactionGroupSchema,
} from "@/lib/validations";

export async function POST(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const parsed = transactionGroupSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const status = deriveTransactionStatus({
      expectedSourceAmount: parsed.data.expectedSourceAmount,
      expectedTargetAmount: parsed.data.expectedTargetAmount,
      movementCount: 0,
    });

    const group = await prisma.transactionGroup.create({
      data: {
        customerId: parsed.data.customerId,
        title: nullableString(parsed.data.title),
        status,
        costRate: nullableDecimalString(parsed.data.costRate),
        sellRate: nullableDecimalString(parsed.data.sellRate),
        sourceCurrency: parsed.data.sourceCurrency || null,
        targetCurrency: parsed.data.targetCurrency || null,
        expectedSourceAmount: nullableDecimalString(parsed.data.expectedSourceAmount),
        expectedTargetAmount: nullableDecimalString(parsed.data.expectedTargetAmount),
        notes: nullableString(parsed.data.notes),
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
