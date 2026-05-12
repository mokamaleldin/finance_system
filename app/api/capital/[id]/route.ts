import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { deleteCapitalMovement, updateCapitalMovement } from "@/lib/capital-service";
import { capitalMovementSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireApiAuth("capital:write");
  if (authError) return authError;

  const { id } = await context.params;
  const parsed = capitalMovementSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const movement = await updateCapitalMovement(id, parsed.data);
    return NextResponse.json({ movement });
  } catch (error) {
    return serverErrorResponse(error, "PATCH /api/capital/[id]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireApiAuth("capital:write");
  if (authError) return authError;

  const { id } = await context.params;

  try {
    const movement = await deleteCapitalMovement(id);
    return NextResponse.json({ movement });
  } catch (error) {
    return serverErrorResponse(error, "DELETE /api/capital/[id]");
  }
}
