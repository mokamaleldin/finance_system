import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { customerSchema, nullableString } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const parsed = customerSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const { id } = await context.params;

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: parsed.data.name,
        phone: nullableString(parsed.data.phone),
        country: nullableString(parsed.data.country),
        notes: nullableString(parsed.data.notes),
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const { id } = await context.params;

  try {
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
