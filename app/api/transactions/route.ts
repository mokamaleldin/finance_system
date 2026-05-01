import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { createTransferTransaction, getTransferTransactions } from "@/lib/transfer-service";
import { transferTransactionSchema } from "@/lib/validations";

export async function GET() {
  const authError = await requireApiAuth();
  if (authError) return authError;

  try {
    const transactions = await getTransferTransactions();
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
