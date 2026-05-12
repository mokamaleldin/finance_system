import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { deleteTransferExecution } from "@/lib/transfer-service";
import { z } from "zod";

const idSchema = z.object({ id: z.string() });

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const authError = await requireApiAuth("transactions:write");
  if (authError) return authError;

  const { id } = await context.params;
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const transaction = await deleteTransferExecution(id);
    return NextResponse.json({ transaction });
  } catch (error) {
    return serverErrorResponse(error, "DELETE /api/transactions/executions/[id]");
  }
}
