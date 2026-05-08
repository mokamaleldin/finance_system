import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { customerSelect } from "@/lib/customer-select";
import { prisma } from "@/lib/prisma";
import { customerSchema, nullableString } from "@/lib/validations";

export async function GET(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: customerSelect,
    take: 50,
  });

  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const parsed = customerSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const customer = await prisma.customer.create({
      data: {
        name: parsed.data.name,
        phone: nullableString(parsed.data.phone),
        country: nullableString(parsed.data.country),
        notes: nullableString(parsed.data.notes),
      },
      select: customerSelect,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
