import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { nullableString } from "@/lib/validations";
import { transferExecutionTypeValues } from "@/lib/options";
import { createTransferExecution } from "@/lib/transfer-service";

const createSchema = z.object({
  type: z.enum(transferExecutionTypeValues),
  amount: z.string().refine((value) => Number(value) > 0, "المبلغ يجب أن يكون أكبر من صفر"),
  notes: z.string().trim().optional(),
  date: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireApiAuth("transactions:write");
  if (authError) return authError;

  const { id } = await context.params;
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const transaction = await createTransferExecution(id, {
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
      type: parsed.data.type,
      amount: parsed.data.amount,
      notes: nullableString(parsed.data.notes),
    });
    return NextResponse.json({ transaction });
  } catch (error) {
    return serverErrorResponse(error, "POST /api/transactions/[id]/executions");
  }
}
