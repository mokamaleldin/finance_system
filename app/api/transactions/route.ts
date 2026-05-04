import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { parseOptionalDateParam } from "@/lib/format";
import {
  currencyValues,
  deliveredStatusValues,
  receivedStatusValues,
  transferStatusValues,
  transferTypeValues,
  type CurrencyCode,
  type DeliveredStatusCode,
  type ReceivedStatusCode,
  type TransferStatusCode,
  type TransferTypeCode,
} from "@/lib/options";
import { createTransferTransaction, getTransferTransactions } from "@/lib/transfer-service";
import { transferTransactionSchema } from "@/lib/validations";

function pick<T extends readonly string[]>(value: string | null, values: T) {
  return value && values.includes(value) ? value : undefined;
}

export async function GET(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  try {
    const params = new URL(request.url).searchParams;
    const transactions = await getTransferTransactions({
      from: parseOptionalDateParam(params.get("from") || undefined),
      to: parseOptionalDateParam(params.get("to") || undefined, true),
      customerId: params.get("customerId") || undefined,
      type: pick(params.get("type"), transferTypeValues) as TransferTypeCode | undefined,
      currency: pick(params.get("currency"), currencyValues) as CurrencyCode | undefined,
      receivedCurrency: pick(params.get("receivedCurrency"), currencyValues) as CurrencyCode | undefined,
      deliveredCurrency: pick(params.get("deliveredCurrency"), currencyValues) as CurrencyCode | undefined,
      status: pick(params.get("status"), transferStatusValues) as TransferStatusCode | undefined,
      receivedStatus: pick(params.get("receivedStatus"), receivedStatusValues) as ReceivedStatusCode | undefined,
      deliveredStatus: pick(params.get("deliveredStatus"), deliveredStatusValues) as DeliveredStatusCode | undefined,
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const parsed = transferTransactionSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const transaction = await createTransferTransaction(parsed.data);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
