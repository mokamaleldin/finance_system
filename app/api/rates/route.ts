import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { calculateCrossRate, toMoneyString } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { exchangeRateSchema, nullableString } from "@/lib/validations";

export async function POST(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const parsed = exchangeRateSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const crossRate = calculateCrossRate(parsed.data.usdToEgp, parsed.data.usdToTry);
    const rate = await prisma.exchangeRate.create({
      data: {
        date: parsed.data.date,
        usdToEgp: toMoneyString(parsed.data.usdToEgp, 6),
        usdToTry: toMoneyString(parsed.data.usdToTry, 6),
        crossRate: toMoneyString(crossRate, 6),
        notes: nullableString(parsed.data.notes),
      },
    });

    return NextResponse.json({ rate }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
