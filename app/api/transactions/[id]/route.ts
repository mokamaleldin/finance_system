import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import {
  cancelTransferTransaction,
  setTransferStepStatus,
  updateTransferTransaction,
} from "@/lib/transfer-service";
import { deliveredStatusValues, receivedStatusValues } from "@/lib/options";
import { transferTransactionSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const statusPatchSchema = z.object({
  receivedStatus: z.enum(receivedStatusValues).optional(),
  deliveredStatus: z.enum(deliveredStatusValues).optional(),
});

const cancelSchema = z.object({
  cancellationReason: z.string().trim().optional().default(""),
});

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireApiAuth("transactions:write");
  if (authError) return authError;

  const { id } = await context.params;
  const payload = await request.json();

  if (payload.mode === "status") {
    const parsed = statusPatchSchema.safeParse(payload);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    try {
      const transaction = await setTransferStepStatus(id, parsed.data);
      return NextResponse.json({ transaction });
    } catch (error) {
      return serverErrorResponse(error);
    }
  }

  const parsed = transferTransactionSchema.safeParse(payload);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const transaction = await updateTransferTransaction(id, parsed.data);
    return NextResponse.json({ transaction });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const authError = await requireApiAuth("transactions:write");
  if (authError) return authError;

  const { id } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = cancelSchema.safeParse(payload);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const transaction = await cancelTransferTransaction(id, parsed.data.cancellationReason);
    return NextResponse.json({ transaction });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
