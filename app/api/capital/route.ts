import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { createCapitalMovement, getCapitalMovements } from "@/lib/capital-service";
import { parseOptionalDateParam } from "@/lib/format";
import {
  capitalMovementTypeValues,
  currencyValues,
  type CapitalMovementTypeCode,
  type CurrencyCode,
} from "@/lib/options";
import { capitalMovementSchema } from "@/lib/validations";

function pick<T extends readonly string[]>(value: string | null, values: T) {
  return value && values.includes(value) ? value : undefined;
}

export async function GET(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  try {
    const params = new URL(request.url).searchParams;
    const movements = await getCapitalMovements({
      from: parseOptionalDateParam(params.get("from") || undefined),
      to: parseOptionalDateParam(params.get("to") || undefined, true),
      type: pick(params.get("type"), capitalMovementTypeValues) as CapitalMovementTypeCode | undefined,
      currencyCode: pick(params.get("currencyCode"), currencyValues) as CurrencyCode | undefined,
    });

    return NextResponse.json({ movements });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const parsed = capitalMovementSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const movement = await createCapitalMovement(parsed.data);
    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
